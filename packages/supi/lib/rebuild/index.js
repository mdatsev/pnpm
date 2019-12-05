"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("@pnpm/constants");
const core_loggers_1 = require("@pnpm/core-loggers");
const lifecycle_1 = require("@pnpm/lifecycle");
const link_bins_1 = require("@pnpm/link-bins");
const lockfile_utils_1 = require("@pnpm/lockfile-utils");
const lockfile_walker_1 = require("@pnpm/lockfile-walker");
const logger_1 = require("@pnpm/logger");
const modules_yaml_1 = require("@pnpm/modules-yaml");
const pkgid_to_filename_1 = require("@pnpm/pkgid-to-filename");
const npa = require("@zkochan/npm-package-arg");
const dp = require("dependency-path");
const graphSequencer = require("graph-sequencer");
const p_limit_1 = require("p-limit");
const path = require("path");
const R = require("ramda");
const run_groups_1 = require("run-groups");
const semver = require("semver");
const getContext_1 = require("../getContext");
const extendRebuildOptions_1 = require("./extendRebuildOptions");
function findPackages(packages, searched, opts) {
    return Object.keys(packages)
        .filter((relativeDepPath) => {
        const pkgLockfile = packages[relativeDepPath];
        const pkgInfo = lockfile_utils_1.nameVerFromPkgSnapshot(relativeDepPath, pkgLockfile);
        if (!pkgInfo.name) {
            logger_1.default.warn({
                message: `Skipping ${relativeDepPath} because cannot get the package name from ${constants_1.WANTED_LOCKFILE}.
            Try to run run \`pnpm update --depth 100\` to create a new ${constants_1.WANTED_LOCKFILE} with all the necessary info.`,
                prefix: opts.prefix,
            });
            return false;
        }
        return matches(searched, pkgInfo);
    });
}
// TODO: move this logic to separate package as this is also used in dependencies-hierarchy
function matches(searched, manifest) {
    return searched.some((searchedPkg) => {
        if (typeof searchedPkg === 'string') {
            return manifest.name === searchedPkg;
        }
        return searchedPkg.name === manifest.name && !!manifest.version &&
            semver.satisfies(manifest.version, searchedPkg.range);
    });
}
async function rebuildPkgs(importers, pkgSpecs, maybeOpts) {
    var _a;
    const reporter = (_a = maybeOpts) === null || _a === void 0 ? void 0 : _a.reporter;
    if (reporter) {
        logger_1.streamParser.on('data', reporter);
    }
    const opts = await extendRebuildOptions_1.default(maybeOpts);
    const ctx = await getContext_1.default(importers, opts);
    if (!ctx.currentLockfile || !ctx.currentLockfile.packages)
        return;
    const packages = ctx.currentLockfile.packages;
    const searched = pkgSpecs.map((arg) => {
        const { fetchSpec, name, raw, type } = npa(arg);
        if (raw === name) {
            return name;
        }
        if (type !== 'version' && type !== 'range') {
            throw new Error(`Invalid argument - ${arg}. Rebuild can only select by version or range`);
        }
        return {
            name,
            range: fetchSpec,
        };
    });
    let pkgs = [];
    for (const { rootDir } of importers) {
        pkgs = [
            ...pkgs,
            ...findPackages(packages, searched, { prefix: rootDir }),
        ];
    }
    await _rebuild({
        pkgsToRebuild: new Set(pkgs),
        ...ctx,
    }, opts);
}
exports.rebuildPkgs = rebuildPkgs;
async function rebuild(importers, maybeOpts) {
    var _a, _b, _c;
    const reporter = (_a = maybeOpts) === null || _a === void 0 ? void 0 : _a.reporter;
    if (reporter) {
        logger_1.streamParser.on('data', reporter);
    }
    const opts = await extendRebuildOptions_1.default(maybeOpts);
    const ctx = await getContext_1.default(importers, opts);
    let idsToRebuild = [];
    if (opts.pending) {
        idsToRebuild = ctx.pendingBuilds;
    }
    else if ((_b = ctx.currentLockfile) === null || _b === void 0 ? void 0 : _b.packages) {
        idsToRebuild = Object.keys(ctx.currentLockfile.packages);
    }
    const pkgsThatWereRebuilt = await _rebuild({
        pkgsToRebuild: new Set(idsToRebuild),
        ...ctx,
    }, opts);
    ctx.pendingBuilds = ctx.pendingBuilds.filter((relDepPath) => !pkgsThatWereRebuilt.has(relDepPath));
    const scriptsOpts = {
        extraBinPaths: ctx.extraBinPaths,
        rawConfig: opts.rawConfig,
        unsafePerm: opts.unsafePerm || false,
    };
    await lifecycle_1.runLifecycleHooksConcurrently(['preinstall', 'install', 'postinstall', 'prepublish', 'prepare'], ctx.importers, opts.childConcurrency || 5, scriptsOpts);
    for (const { id, manifest } of ctx.importers) {
        if (((_c = manifest) === null || _c === void 0 ? void 0 : _c.scripts) && (!opts.pending || ctx.pendingBuilds.includes(id))) {
            ctx.pendingBuilds.splice(ctx.pendingBuilds.indexOf(id), 1);
        }
    }
    await modules_yaml_1.write(ctx.rootModulesDir, {
        ...ctx.modulesFile,
        hoistedAliases: ctx.hoistedAliases,
        hoistPattern: ctx.hoistPattern,
        included: ctx.include,
        independentLeaves: ctx.independentLeaves,
        layoutVersion: constants_1.LAYOUT_VERSION,
        packageManager: `${opts.packageManager.name}@${opts.packageManager.version}`,
        pendingBuilds: ctx.pendingBuilds,
        registries: ctx.registries,
        shamefullyHoist: ctx.shamefullyHoist,
        skipped: Array.from(ctx.skipped),
        store: ctx.storeDir,
        virtualStoreDir: ctx.virtualStoreDir,
    });
}
exports.rebuild = rebuild;
function getSubgraphToBuild(step, nodesToBuildAndTransitive, opts) {
    let currentShouldBeBuilt = false;
    for (const { relDepPath, next } of step.dependencies) {
        if (nodesToBuildAndTransitive.has(relDepPath)) {
            currentShouldBeBuilt = true;
        }
        const childShouldBeBuilt = getSubgraphToBuild(next(), nodesToBuildAndTransitive, opts)
            || opts.pkgsToRebuild.has(relDepPath);
        if (childShouldBeBuilt) {
            nodesToBuildAndTransitive.add(relDepPath);
            currentShouldBeBuilt = true;
        }
    }
    for (const relDepPath of step.missing) {
        // It might make sense to fail if the depPath is not in the skipped list from .modules.yaml
        // However, the skipped list currently contains package IDs, not dep paths.
        logger_1.default.debug({ message: `No entry for "${relDepPath}" in ${constants_1.WANTED_LOCKFILE}` });
    }
    return currentShouldBeBuilt;
}
const limitLinking = p_limit_1.default(16);
async function _rebuild(ctx, opts) {
    const pkgsThatWereRebuilt = new Set();
    const graph = new Map();
    const pkgSnapshots = ctx.currentLockfile.packages || {};
    const nodesToBuildAndTransitive = new Set();
    getSubgraphToBuild(lockfile_walker_1.default(ctx.currentLockfile, ctx.importers.map(({ id }) => id), {
        include: {
            dependencies: opts.production,
            devDependencies: opts.development,
            optionalDependencies: opts.optional,
        }
    }), nodesToBuildAndTransitive, { pkgsToRebuild: ctx.pkgsToRebuild });
    const nodesToBuildAndTransitiveArray = Array.from(nodesToBuildAndTransitive);
    for (const relDepPath of nodesToBuildAndTransitiveArray) {
        const pkgSnapshot = pkgSnapshots[relDepPath];
        graph.set(relDepPath, R.toPairs({ ...pkgSnapshot.dependencies, ...pkgSnapshot.optionalDependencies })
            .map(([pkgName, reference]) => dp.refToRelative(reference, pkgName))
            .filter((childRelDepPath) => childRelDepPath && nodesToBuildAndTransitive.has(childRelDepPath)));
    }
    const graphSequencerResult = graphSequencer({
        graph,
        groups: [nodesToBuildAndTransitiveArray],
    });
    const chunks = graphSequencerResult.chunks;
    const warn = (message) => logger_1.default.warn({ message, prefix: opts.dir });
    const groups = chunks.map((chunk) => chunk.filter((relDepPath) => ctx.pkgsToRebuild.has(relDepPath)).map((relDepPath) => async () => {
        const pkgSnapshot = pkgSnapshots[relDepPath];
        const depPath = dp.resolve(opts.registries, relDepPath);
        const pkgInfo = lockfile_utils_1.nameVerFromPkgSnapshot(relDepPath, pkgSnapshot);
        const independent = ctx.independentLeaves && lockfile_utils_1.packageIsIndependent(pkgSnapshot);
        const pkgRoot = !independent
            ? path.join(ctx.virtualStoreDir, pkgid_to_filename_1.default(depPath, opts.lockfileDir), 'node_modules', pkgInfo.name)
            : await (async () => {
                const { dir } = await opts.storeController.getPackageLocation(pkgSnapshot.id || depPath, pkgInfo.name, {
                    lockfileDir: opts.lockfileDir,
                    targetEngine: opts.sideEffectsCacheRead && !opts.force && constants_1.ENGINE_NAME || undefined,
                });
                return dir;
            })();
        try {
            if (!independent) {
                const modules = path.join(ctx.virtualStoreDir, pkgid_to_filename_1.default(depPath, opts.lockfileDir), 'node_modules');
                const binPath = path.join(pkgRoot, 'node_modules', '.bin');
                await link_bins_1.default(modules, binPath, { warn });
            }
            await lifecycle_1.runPostinstallHooks({
                depPath,
                extraBinPaths: ctx.extraBinPaths,
                optional: pkgSnapshot.optional === true,
                pkgRoot,
                prepare: pkgSnapshot.prepare,
                rawConfig: opts.rawConfig,
                rootNodeModulesDir: ctx.rootModulesDir,
                unsafePerm: opts.unsafePerm || false,
            });
            pkgsThatWereRebuilt.add(relDepPath);
        }
        catch (err) {
            if (pkgSnapshot.optional) {
                // TODO: add parents field to the log
                core_loggers_1.skippedOptionalDependencyLogger.debug({
                    details: err.toString(),
                    package: {
                        id: pkgSnapshot.id || depPath,
                        name: pkgInfo.name,
                        version: pkgInfo.version,
                    },
                    prefix: opts.dir,
                    reason: 'build_failure',
                });
                return;
            }
            throw err;
        }
    }));
    await run_groups_1.default(opts.childConcurrency || 5, groups);
    // It may be optimized because some bins were already linked before running lifecycle scripts
    await Promise.all(Object
        .keys(pkgSnapshots)
        .filter((relDepPath) => !lockfile_utils_1.packageIsIndependent(pkgSnapshots[relDepPath]))
        .map((relDepPath) => limitLinking(() => {
        const depPath = dp.resolve(opts.registries, relDepPath);
        const pkgSnapshot = pkgSnapshots[relDepPath];
        const pkgInfo = lockfile_utils_1.nameVerFromPkgSnapshot(relDepPath, pkgSnapshot);
        const modules = path.join(ctx.virtualStoreDir, pkgid_to_filename_1.default(depPath, opts.lockfileDir), 'node_modules');
        const binPath = path.join(modules, pkgInfo.name, 'node_modules', '.bin');
        return link_bins_1.default(modules, binPath, { warn });
    })));
    await Promise.all(ctx.importers.map(({ rootDir }) => limitLinking(() => {
        const modules = path.join(rootDir, 'node_modules');
        const binPath = path.join(modules, '.bin');
        return link_bins_1.default(modules, binPath, {
            allowExoticManifests: true,
            warn,
        });
    })));
    return pkgsThatWereRebuilt;
}

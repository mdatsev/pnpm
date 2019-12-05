"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("@pnpm/constants");
const core_loggers_1 = require("@pnpm/core-loggers");
const filter_lockfile_1 = require("@pnpm/filter-lockfile");
const hoist_1 = require("@pnpm/hoist");
const logger_1 = require("@pnpm/logger");
const matcher_1 = require("@pnpm/matcher");
const modules_cleaner_1 = require("@pnpm/modules-cleaner");
const symlink_dependency_1 = require("@pnpm/symlink-dependency");
const dp = require("dependency-path");
const fs = require("mz/fs");
const p_limit_1 = require("p-limit");
const path = require("path");
const R = require("ramda");
const lockfile_1 = require("./lockfile");
const resolvePeers_1 = require("./resolvePeers");
const updateLockfile_1 = require("./updateLockfile");
const brokenNodeModulesLogger = logger_1.default('_broken_node_modules');
async function linkPackages(importers, dependenciesTree, opts) {
    var _a, _b, _c;
    // TODO: decide what kind of logging should be here.
    // The `Creating dependency graph` is not good to report in all cases as
    // sometimes node_modules is alread up-to-date
    // logger.info(`Creating dependency graph`)
    const { depGraph, importersDirectAbsolutePathsByAlias } = resolvePeers_1.default({
        dependenciesTree,
        importers,
        independentLeaves: opts.independentLeaves,
        lockfileDir: opts.lockfileDir,
        strictPeerDependencies: opts.strictPeerDependencies,
        virtualStoreDir: opts.virtualStoreDir,
    });
    for (const { id } of importers) {
        for (const [alias, depPath] of R.toPairs(importersDirectAbsolutePathsByAlias[id])) {
            const depNode = depGraph[depPath];
            if (depNode.isPure)
                continue;
            const lockfileImporter = opts.wantedLockfile.importers[id];
            const ref = lockfile_1.absolutePathToRef(depPath, {
                alias,
                realName: depNode.name,
                registries: opts.registries,
                resolution: depNode.resolution,
            });
            if ((_a = lockfileImporter.dependencies) === null || _a === void 0 ? void 0 : _a[alias]) {
                lockfileImporter.dependencies[alias] = ref;
            }
            else if ((_b = lockfileImporter.devDependencies) === null || _b === void 0 ? void 0 : _b[alias]) {
                lockfileImporter.devDependencies[alias] = ref;
            }
            else if ((_c = lockfileImporter.optionalDependencies) === null || _c === void 0 ? void 0 : _c[alias]) {
                lockfileImporter.optionalDependencies[alias] = ref;
            }
        }
    }
    const { newLockfile, pendingRequiresBuilds } = updateLockfile_1.default(depGraph, opts.wantedLockfile, opts.virtualStoreDir, opts.registries); // tslint:disable-line:prefer-const
    let newWantedLockfile = opts.afterAllResolvedHook
        ? opts.afterAllResolvedHook(newLockfile)
        : newLockfile;
    let depNodes = R.values(depGraph).filter(({ absolutePath, name, packageId }) => {
        var _a;
        const relDepPath = dp.relative(opts.registries, name, absolutePath);
        if (((_a = newWantedLockfile.packages) === null || _a === void 0 ? void 0 : _a[relDepPath]) && !newWantedLockfile.packages[relDepPath].optional) {
            opts.skipped.delete(relDepPath);
            return true;
        }
        if (opts.wantedToBeSkippedPackageIds.has(packageId)) {
            opts.skipped.add(relDepPath);
            return false;
        }
        opts.skipped.delete(relDepPath);
        return true;
    });
    if (!opts.include.dependencies) {
        depNodes = depNodes.filter(({ dev, optional }) => dev !== false || optional);
    }
    if (!opts.include.devDependencies) {
        depNodes = depNodes.filter(({ dev }) => dev !== true);
    }
    if (!opts.include.optionalDependencies) {
        depNodes = depNodes.filter(({ optional }) => !optional);
    }
    const removedDepPaths = await modules_cleaner_1.prune(importers, {
        currentLockfile: opts.currentLockfile,
        dryRun: opts.dryRun,
        hoistedAliases: opts.hoistedAliases,
        hoistedModulesDir: opts.hoistPattern && opts.hoistedModulesDir || undefined,
        include: opts.include,
        lockfileDir: opts.lockfileDir,
        pruneStore: opts.pruneStore,
        registries: opts.registries,
        skipped: opts.skipped,
        storeController: opts.storeController,
        virtualStoreDir: opts.virtualStoreDir,
        wantedLockfile: newWantedLockfile,
    });
    core_loggers_1.stageLogger.debug({
        prefix: opts.lockfileDir,
        stage: 'importing_started',
    });
    const importerIds = importers.map(({ id }) => id);
    const filterOpts = {
        include: opts.include,
        registries: opts.registries,
        skipped: opts.skipped,
    };
    const newCurrentLockfile = filter_lockfile_1.filterLockfileByImporters(newWantedLockfile, importerIds, {
        ...filterOpts,
        failOnMissingDependencies: true,
    });
    const newDepPaths = await linkNewPackages(filter_lockfile_1.filterLockfileByImporters(opts.currentLockfile, importerIds, {
        ...filterOpts,
        failOnMissingDependencies: false,
    }), newCurrentLockfile, depGraph, {
        dryRun: opts.dryRun,
        force: opts.force,
        lockfileDir: opts.lockfileDir,
        optional: opts.include.optionalDependencies,
        registries: opts.registries,
        storeController: opts.storeController,
        virtualStoreDir: opts.virtualStoreDir,
    });
    core_loggers_1.stageLogger.debug({
        prefix: opts.lockfileDir,
        stage: 'importing_done',
    });
    const rootDepsByDepPath = depNodes
        .filter(({ depth }) => depth === 0)
        .reduce((acc, depNode) => {
        acc[depNode.absolutePath] = depNode;
        return acc;
    }, {});
    await Promise.all(importers.map(({ id, manifest, modulesDir, rootDir }) => {
        const directAbsolutePathsByAlias = importersDirectAbsolutePathsByAlias[id];
        return Promise.all(Object.keys(directAbsolutePathsByAlias)
            .map((rootAlias) => ({ rootAlias, depGraphNode: rootDepsByDepPath[directAbsolutePathsByAlias[rootAlias]] }))
            .filter(({ depGraphNode }) => depGraphNode)
            .map(async ({ rootAlias, depGraphNode }) => {
            var _a, _b;
            if (!opts.dryRun &&
                (await symlink_dependency_1.default(depGraphNode.peripheralLocation, modulesDir, rootAlias)).reused)
                return;
            const isDev = (_a = manifest.devDependencies) === null || _a === void 0 ? void 0 : _a[depGraphNode.name];
            const isOptional = (_b = manifest.optionalDependencies) === null || _b === void 0 ? void 0 : _b[depGraphNode.name];
            core_loggers_1.rootLogger.debug({
                added: {
                    dependencyType: isDev && 'dev' || isOptional && 'optional' || 'prod',
                    id: depGraphNode.packageId,
                    latest: opts.outdatedDependencies[depGraphNode.packageId],
                    name: rootAlias,
                    realName: depGraphNode.name,
                    version: depGraphNode.version,
                },
                prefix: rootDir,
            });
        }));
    }));
    if (opts.updateLockfileMinorVersion) {
        newWantedLockfile.lockfileVersion = constants_1.LOCKFILE_VERSION;
    }
    await Promise.all(pendingRequiresBuilds.map(async ({ absoluteDepPath, relativeDepPath }) => {
        const depNode = depGraph[absoluteDepPath];
        if (!depNode.fetchingBundledManifest) {
            // This should never ever happen
            throw new Error(`Cannot create ${constants_1.WANTED_LOCKFILE} because raw manifest (aka package.json) wasn't fetched for "${absoluteDepPath}"`);
        }
        const filesResponse = await depNode.fetchingFiles();
        // The npm team suggests to always read the package.json for deciding whether the package has lifecycle scripts
        const pkgJson = await depNode.fetchingBundledManifest();
        depNode.requiresBuild = Boolean(pkgJson.scripts && (pkgJson.scripts.preinstall || pkgJson.scripts.install || pkgJson.scripts.postinstall) ||
            filesResponse.filenames.includes('binding.gyp') ||
            filesResponse.filenames.some((filename) => !!filename.match(/^[.]hooks[\\/]/)));
        // TODO: try to cover with unit test the case when entry is no longer available in lockfile
        // It is an edge that probably happens if the entry is removed during lockfile prune
        if (depNode.requiresBuild && newWantedLockfile.packages[relativeDepPath]) {
            newWantedLockfile.packages[relativeDepPath].requiresBuild = true;
        }
    }));
    let currentLockfile;
    const allImportersIncluded = R.equals(importerIds.sort(), Object.keys(newWantedLockfile.importers).sort());
    if (opts.makePartialCurrentLockfile ||
        !allImportersIncluded) {
        const filteredCurrentLockfile = allImportersIncluded
            ? opts.currentLockfile
            : filter_lockfile_1.filterLockfileByImporters(opts.currentLockfile, Object.keys(newWantedLockfile.importers)
                .filter((importerId) => !importerIds.includes(importerId) && opts.currentLockfile.importers[importerId]), {
                ...filterOpts,
                failOnMissingDependencies: false,
            });
        const packages = filteredCurrentLockfile.packages || {};
        if (newWantedLockfile.packages) {
            for (const relDepPath in newWantedLockfile.packages) { // tslint:disable-line:forin
                const depPath = dp.resolve(opts.registries, relDepPath);
                if (depGraph[depPath]) {
                    packages[relDepPath] = newWantedLockfile.packages[relDepPath];
                }
            }
        }
        const importers = importerIds.reduce((acc, importerId) => {
            acc[importerId] = newWantedLockfile.importers[importerId];
            return acc;
        }, opts.currentLockfile.importers);
        currentLockfile = { ...newWantedLockfile, packages, importers };
    }
    else if (opts.include.dependencies &&
        opts.include.devDependencies &&
        opts.include.optionalDependencies &&
        opts.skipped.size === 0) {
        currentLockfile = newWantedLockfile;
    }
    else {
        currentLockfile = newCurrentLockfile;
    }
    let newHoistedAliases = {};
    if (newDepPaths.length > 0 || removedDepPaths.size > 0) {
        const rootImporterWithFlatModules = opts.hoistPattern && importers.find(({ id }) => id === '.');
        if (rootImporterWithFlatModules) {
            newHoistedAliases = await hoist_1.default(matcher_1.default(opts.hoistPattern), {
                getIndependentPackageLocation: opts.independentLeaves
                    ? async (packageId, packageName) => {
                        const { dir } = await opts.storeController.getPackageLocation(packageId, packageName, {
                            lockfileDir: opts.lockfileDir,
                            targetEngine: opts.sideEffectsCacheRead && constants_1.ENGINE_NAME || undefined,
                        });
                        return dir;
                    }
                    : undefined,
                lockfile: currentLockfile,
                lockfileDir: opts.lockfileDir,
                modulesDir: opts.hoistedModulesDir,
                registries: opts.registries,
                virtualStoreDir: opts.virtualStoreDir,
            });
        }
    }
    if (!opts.dryRun) {
        await Promise.all(importers.map((importer) => Promise.all(importer.linkedDependencies.map((linkedDependency) => {
            const depLocation = resolvePath(importer.rootDir, linkedDependency.resolution.directory);
            return symlink_dependency_1.symlinkDirectRootDependency(depLocation, importer.modulesDir, linkedDependency.alias, {
                fromDependenciesField: linkedDependency.dev && 'devDependencies' || linkedDependency.optional && 'optionalDependencies' || 'dependencies',
                linkedPackage: linkedDependency,
                prefix: importer.rootDir,
            });
        }))));
    }
    return {
        currentLockfile,
        depGraph,
        newDepPaths,
        newHoistedAliases,
        removedDepPaths,
        wantedLockfile: newWantedLockfile,
    };
}
exports.default = linkPackages;
const isAbsolutePath = /^[/]|^[A-Za-z]:/;
// This function is copied from @pnpm/local-resolver
function resolvePath(where, spec) {
    if (isAbsolutePath.test(spec))
        return spec;
    return path.resolve(where, spec);
}
async function linkNewPackages(currentLockfile, wantedLockfile, depGraph, opts) {
    const wantedRelDepPaths = R.keys(wantedLockfile.packages);
    let newDepPathsSet;
    if (opts.force) {
        newDepPathsSet = new Set(wantedRelDepPaths
            .map((relDepPath) => dp.resolve(opts.registries, relDepPath))
            // when installing a new package, not all the nodes are analyzed
            // just skip the ones that are in the lockfile but were not analyzed
            .filter((depPath) => depGraph[depPath]));
    }
    else {
        newDepPathsSet = await selectNewFromWantedDeps(wantedRelDepPaths, currentLockfile, depGraph, opts);
    }
    core_loggers_1.statsLogger.debug({
        added: newDepPathsSet.size,
        prefix: opts.lockfileDir,
    });
    const existingWithUpdatedDeps = [];
    if (!opts.force && currentLockfile.packages && wantedLockfile.packages) {
        // add subdependencies that have been updated
        // TODO: no need to relink everything. Can be relinked only what was changed
        for (const relDepPath of wantedRelDepPaths) {
            if (currentLockfile.packages[relDepPath] &&
                (!R.equals(currentLockfile.packages[relDepPath].dependencies, wantedLockfile.packages[relDepPath].dependencies) ||
                    !R.equals(currentLockfile.packages[relDepPath].optionalDependencies, wantedLockfile.packages[relDepPath].optionalDependencies))) {
                const depPath = dp.resolve(opts.registries, relDepPath);
                // TODO: come up with a test that triggers the usecase of depGraph[depPath] undefined
                // see related issue: https://github.com/pnpm/pnpm/issues/870
                if (depGraph[depPath] && !newDepPathsSet.has(depPath)) {
                    existingWithUpdatedDeps.push(depGraph[depPath]);
                }
            }
        }
    }
    if (!newDepPathsSet.size && !existingWithUpdatedDeps.length)
        return [];
    const newDepPaths = Array.from(newDepPathsSet);
    if (opts.dryRun)
        return newDepPaths;
    const newPkgs = R.props(newDepPaths, depGraph);
    await Promise.all([
        linkAllModules(newPkgs, depGraph, {
            lockfileDir: opts.lockfileDir,
            optional: opts.optional,
        }),
        linkAllModules(existingWithUpdatedDeps, depGraph, {
            lockfileDir: opts.lockfileDir,
            optional: opts.optional,
        }),
        linkAllPkgs(opts.storeController, newPkgs, opts),
    ]);
    return newDepPaths;
}
async function selectNewFromWantedDeps(wantedRelDepPaths, currentLockfile, depGraph, opts) {
    const newDeps = new Set();
    const prevRelDepPaths = new Set(R.keys(currentLockfile.packages));
    await Promise.all(wantedRelDepPaths.map(async (wantedRelDepPath) => {
        const depPath = dp.resolve(opts.registries, wantedRelDepPath);
        const depNode = depGraph[depPath];
        if (!depNode)
            return;
        if (prevRelDepPaths.has(wantedRelDepPath)) {
            if (depNode.independent)
                return;
            if (await fs.exists(depNode.peripheralLocation)) {
                return;
            }
            brokenNodeModulesLogger.debug({
                missing: depNode.peripheralLocation,
            });
        }
        newDeps.add(depPath);
    }));
    return newDeps;
}
const limitLinking = p_limit_1.default(16);
async function linkAllPkgs(storeController, depNodes, opts) {
    return Promise.all(depNodes.map(async ({ centralLocation, fetchingFiles, independent, peripheralLocation }) => {
        const filesResponse = await fetchingFiles();
        if (independent)
            return;
        return storeController.importPackage(centralLocation, peripheralLocation, {
            filesResponse,
            force: opts.force,
        });
    }));
}
async function linkAllModules(depNodes, depGraph, opts) {
    return Promise.all(depNodes
        .filter(({ independent }) => !independent)
        .map(async ({ children, optionalDependencies, name, modules }) => {
        const childrenToLink = opts.optional
            ? children
            : Object.keys(children)
                .reduce((nonOptionalChildren, childAlias) => {
                if (!optionalDependencies.has(childAlias)) {
                    nonOptionalChildren[childAlias] = children[childAlias];
                }
                return nonOptionalChildren;
            }, {});
        await Promise.all(Object.keys(childrenToLink)
            .map(async (childAlias) => {
            const pkg = depGraph[childrenToLink[childAlias]];
            if (!pkg.installable && pkg.optional)
                return;
            if (childAlias === name) {
                logger_1.default.warn({
                    message: `Cannot link dependency with name ${childAlias} to ${modules}. Dependency's name should differ from the parent's name.`,
                    prefix: opts.lockfileDir,
                });
                return;
            }
            await limitLinking(() => symlink_dependency_1.default(pkg.peripheralLocation, modules, childAlias));
        }));
    }));
}

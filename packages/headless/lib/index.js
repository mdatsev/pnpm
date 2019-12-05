"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const build_modules_1 = require("@pnpm/build-modules");
const constants_1 = require("@pnpm/constants");
const core_loggers_1 = require("@pnpm/core-loggers");
const error_1 = require("@pnpm/error");
const filter_lockfile_1 = require("@pnpm/filter-lockfile");
const hoist_1 = require("@pnpm/hoist");
const lifecycle_1 = require("@pnpm/lifecycle");
const link_bins_1 = require("@pnpm/link-bins");
const lockfile_file_1 = require("@pnpm/lockfile-file");
const lockfile_utils_1 = require("@pnpm/lockfile-utils");
const logger_1 = require("@pnpm/logger");
const matcher_1 = require("@pnpm/matcher");
const modules_cleaner_1 = require("@pnpm/modules-cleaner");
const modules_yaml_1 = require("@pnpm/modules-yaml");
const pkgid_to_filename_1 = require("@pnpm/pkgid-to-filename");
const read_importer_manifest_1 = require("@pnpm/read-importer-manifest");
const read_package_json_1 = require("@pnpm/read-package-json");
const symlink_dependency_1 = require("@pnpm/symlink-dependency");
const utils_1 = require("@pnpm/utils");
const dp = require("dependency-path");
const fs = require("mz/fs");
const p_limit_1 = require("p-limit");
const path = require("path");
const pathAbsolute = require("path-absolute");
const R = require("ramda");
const brokenNodeModulesLogger = logger_1.default('_broken_node_modules');
exports.default = async (opts) => {
    var _a, _b;
    const reporter = opts.reporter;
    if (reporter) {
        logger_1.streamParser.on('data', reporter);
    }
    const lockfileDir = opts.lockfileDir;
    const wantedLockfile = opts.wantedLockfile || await lockfile_file_1.readWantedLockfile(lockfileDir, { ignoreIncompatible: false });
    if (!wantedLockfile) {
        throw new Error(`Headless installation requires a ${constants_1.WANTED_LOCKFILE} file`);
    }
    const rootModulesDir = await utils_1.realNodeModulesDir(lockfileDir);
    const virtualStoreDir = pathAbsolute((_a = opts.virtualStoreDir, (_a !== null && _a !== void 0 ? _a : 'node_modules/.pnpm')), lockfileDir);
    const currentLockfile = opts.currentLockfile || await lockfile_file_1.readCurrentLockfile(virtualStoreDir, { ignoreIncompatible: false });
    const hoistedModulesDir = opts.shamefullyHoist
        ? rootModulesDir : path.join(virtualStoreDir, 'node_modules');
    for (const { id, manifest, rootDir } of opts.importers) {
        if (!lockfile_utils_1.satisfiesPackageManifest(wantedLockfile, manifest, id)) {
            throw new error_1.default('OUTDATED_LOCKFILE', `Cannot install with "frozen-lockfile" because ${constants_1.WANTED_LOCKFILE} is not up-to-date with ` +
                path.relative(lockfileDir, path.join(rootDir, 'package.json')));
        }
    }
    const scriptsOpts = {
        optional: false,
        rawConfig: opts.rawConfig,
        stdio: opts.ownLifecycleHooksStdio || 'inherit',
        unsafePerm: opts.unsafePerm || false,
    };
    if (!opts.ignoreScripts) {
        await lifecycle_1.runLifecycleHooksConcurrently(['preinstall'], opts.importers, opts.childConcurrency || 5, scriptsOpts);
    }
    const skipped = opts.skipped || new Set();
    if (currentLockfile) {
        await modules_cleaner_1.prune(opts.importers, {
            currentLockfile,
            dryRun: false,
            hoistedAliases: opts.hoistedAliases,
            hoistedModulesDir: opts.hoistPattern && hoistedModulesDir || undefined,
            include: opts.include,
            lockfileDir,
            pruneStore: opts.pruneStore,
            registries: opts.registries,
            skipped,
            storeController: opts.storeController,
            virtualStoreDir,
            wantedLockfile,
        });
    }
    else {
        core_loggers_1.statsLogger.debug({
            prefix: lockfileDir,
            removed: 0,
        });
    }
    core_loggers_1.stageLogger.debug({
        prefix: lockfileDir,
        stage: 'importing_started',
    });
    const filterOpts = {
        include: opts.include,
        registries: opts.registries,
        skipped,
    };
    const filteredLockfile = filter_lockfile_1.filterLockfileByImportersAndEngine(wantedLockfile, opts.importers.map(({ id }) => id), {
        ...filterOpts,
        currentEngine: opts.currentEngine,
        engineStrict: opts.engineStrict,
        failOnMissingDependencies: true,
        includeIncompatiblePackages: opts.force === true,
        lockfileDir,
    });
    const { directDependenciesByImporterId, graph } = await lockfileToDepGraph(filteredLockfile, opts.force ? null : currentLockfile, {
        ...opts,
        importerIds: opts.importers.map(({ id }) => id),
        lockfileDir,
        skipped,
        virtualStoreDir,
    });
    const depNodes = R.values(graph);
    core_loggers_1.statsLogger.debug({
        added: depNodes.length,
        prefix: lockfileDir,
    });
    await Promise.all([
        linkAllModules(depNodes, {
            lockfileDir,
            optional: opts.include.optionalDependencies,
        }),
        linkAllPkgs(opts.storeController, depNodes, opts),
    ]);
    core_loggers_1.stageLogger.debug({
        prefix: lockfileDir,
        stage: 'importing_done',
    });
    function warn(message) {
        logger_1.default.warn({
            message,
            prefix: lockfileDir,
        });
    }
    const rootImporterWithFlatModules = opts.hoistPattern && opts.importers.find((importer) => importer.id === '.');
    let newHoistedAliases;
    if (rootImporterWithFlatModules) {
        newHoistedAliases = await hoist_1.default(matcher_1.default(opts.hoistPattern), {
            getIndependentPackageLocation: opts.independentLeaves
                ? async (packageId, packageName) => {
                    const { dir } = await opts.storeController.getPackageLocation(packageId, packageName, {
                        lockfileDir,
                        targetEngine: opts.sideEffectsCacheRead && constants_1.ENGINE_NAME || undefined,
                    });
                    return dir;
                }
                : undefined,
            lockfile: filteredLockfile,
            lockfileDir,
            modulesDir: hoistedModulesDir,
            registries: opts.registries,
            virtualStoreDir,
        });
    }
    else {
        newHoistedAliases = {};
    }
    await Promise.all(opts.importers.map(async ({ rootDir, id, manifest, modulesDir }) => {
        await linkRootPackages(filteredLockfile, {
            importerDir: rootDir,
            importerId: id,
            importerModulesDir: modulesDir,
            importers: opts.importers,
            lockfileDir,
            registries: opts.registries,
            rootDependencies: directDependenciesByImporterId[id],
        });
        // Even though headless installation will never update the package.json
        // this needs to be logged because otherwise install summary won't be printed
        core_loggers_1.packageManifestLogger.debug({
            prefix: rootDir,
            updated: manifest,
        });
    }));
    if (opts.ignoreScripts) {
        for (const { id, manifest } of opts.importers) {
            if (opts.ignoreScripts && ((_b = manifest) === null || _b === void 0 ? void 0 : _b.scripts) &&
                (manifest.scripts.preinstall || manifest.scripts.prepublish ||
                    manifest.scripts.install ||
                    manifest.scripts.postinstall ||
                    manifest.scripts.prepare)) {
                opts.pendingBuilds.push(id);
            }
        }
        // we can use concat here because we always only append new packages, which are guaranteed to not be there by definition
        opts.pendingBuilds = opts.pendingBuilds
            .concat(depNodes
            .filter(({ requiresBuild }) => requiresBuild)
            .map(({ relDepPath }) => relDepPath));
    }
    else {
        const directNodes = new Set();
        for (const { id } of opts.importers) {
            R
                .values(directDependenciesByImporterId[id])
                .filter((loc) => graph[loc])
                .forEach((loc) => {
                directNodes.add(loc);
            });
        }
        const extraBinPaths = [...opts.extraBinPaths || []];
        if (opts.hoistPattern && !opts.shamefullyHoist) {
            extraBinPaths.unshift(path.join(virtualStoreDir, 'node_modules/.bin'));
        }
        await build_modules_1.default(graph, Array.from(directNodes), {
            childConcurrency: opts.childConcurrency,
            extraBinPaths,
            lockfileDir,
            optional: opts.include.optionalDependencies,
            rawConfig: opts.rawConfig,
            rootNodeModulesDir: virtualStoreDir,
            sideEffectsCacheWrite: opts.sideEffectsCacheWrite,
            storeController: opts.storeController,
            unsafePerm: opts.unsafePerm,
            userAgent: opts.userAgent,
        });
    }
    await linkAllBins(graph, { optional: opts.include.optionalDependencies, warn });
    await Promise.all(opts.importers.map(linkBinsOfImporter));
    if (currentLockfile && !R.equals(opts.importers.map(({ id }) => id).sort(), Object.keys(filteredLockfile.importers).sort())) {
        Object.assign(filteredLockfile.packages, currentLockfile.packages);
    }
    await lockfile_file_1.writeCurrentLockfile(virtualStoreDir, filteredLockfile);
    await modules_yaml_1.write(rootModulesDir, {
        hoistedAliases: newHoistedAliases,
        hoistPattern: opts.hoistPattern,
        included: opts.include,
        independentLeaves: !!opts.independentLeaves,
        layoutVersion: constants_1.LAYOUT_VERSION,
        packageManager: `${opts.packageManager.name}@${opts.packageManager.version}`,
        pendingBuilds: opts.pendingBuilds,
        registries: opts.registries,
        shamefullyHoist: opts.shamefullyHoist || false,
        skipped: Array.from(skipped),
        store: opts.storeDir,
        virtualStoreDir,
    });
    // waiting till package requests are finished
    await Promise.all(depNodes.map(({ finishing }) => finishing));
    core_loggers_1.summaryLogger.debug({ prefix: lockfileDir });
    await opts.storeController.close();
    if (!opts.ignoreScripts) {
        await lifecycle_1.runLifecycleHooksConcurrently(['install', 'postinstall', 'prepublish', 'prepare'], opts.importers, opts.childConcurrency || 5, scriptsOpts);
    }
    if (reporter) {
        logger_1.streamParser.removeListener('data', reporter);
    }
};
function linkBinsOfImporter({ modulesDir, binsDir, rootDir }) {
    const warn = (message) => logger_1.default.warn({ message, prefix: rootDir });
    return link_bins_1.default(modulesDir, binsDir, {
        allowExoticManifests: true,
        warn,
    });
}
async function linkRootPackages(lockfile, opts) {
    const importerManifestsByImporterId = {};
    for (const { id, manifest } of opts.importers) {
        importerManifestsByImporterId[id] = manifest;
    }
    const lockfileImporter = lockfile.importers[opts.importerId];
    const allDeps = {
        ...lockfileImporter.devDependencies,
        ...lockfileImporter.dependencies,
        ...lockfileImporter.optionalDependencies,
    };
    return Promise.all(Object.keys(allDeps)
        .map(async (alias) => {
        var _a, _b, _c, _d, _e;
        if (allDeps[alias].startsWith('link:')) {
            const isDev = (_a = lockfileImporter.devDependencies) === null || _a === void 0 ? void 0 : _a[alias];
            const isOptional = (_b = lockfileImporter.optionalDependencies) === null || _b === void 0 ? void 0 : _b[alias];
            const packageDir = path.join(opts.importerDir, allDeps[alias].substr(5));
            const linkedPackage = await (async () => {
                const importerId = lockfile_file_1.getLockfileImporterId(opts.lockfileDir, packageDir);
                if (importerManifestsByImporterId[importerId]) {
                    return importerManifestsByImporterId[importerId];
                }
                // TODO: cover this case with a test
                return await read_importer_manifest_1.readImporterManifestOnly(packageDir);
            })();
            await symlink_dependency_1.symlinkDirectRootDependency(packageDir, opts.importerModulesDir, alias, {
                fromDependenciesField: isDev && 'devDependencies' ||
                    isOptional && 'optionalDependencies' ||
                    'dependencies',
                linkedPackage,
                prefix: opts.importerDir,
            });
            return;
        }
        const depPath = dp.refToAbsolute(allDeps[alias], alias, opts.registries);
        const peripheralLocation = opts.rootDependencies[alias];
        // Skipping linked packages
        if (!peripheralLocation) {
            return;
        }
        if ((await symlink_dependency_1.default(peripheralLocation, opts.importerModulesDir, alias)).reused) {
            return;
        }
        const isDev = (_c = lockfileImporter.devDependencies) === null || _c === void 0 ? void 0 : _c[alias];
        const isOptional = (_d = lockfileImporter.optionalDependencies) === null || _d === void 0 ? void 0 : _d[alias];
        const relDepPath = dp.refToRelative(allDeps[alias], alias);
        if (relDepPath === null)
            return;
        const pkgSnapshot = (_e = lockfile.packages) === null || _e === void 0 ? void 0 : _e[relDepPath];
        if (!pkgSnapshot)
            return; // this won't ever happen. Just making typescript happy
        const pkgId = pkgSnapshot.id || depPath || undefined;
        const pkgInfo = lockfile_utils_1.nameVerFromPkgSnapshot(relDepPath, pkgSnapshot);
        core_loggers_1.rootLogger.debug({
            added: {
                dependencyType: isDev && 'dev' || isOptional && 'optional' || 'prod',
                id: pkgId,
                // latest: opts.outdatedPkgs[pkg.id],
                name: alias,
                realName: pkgInfo.name,
                version: pkgInfo.version,
            },
            prefix: opts.importerDir,
        });
    }));
}
async function lockfileToDepGraph(lockfile, currentLockfile, opts) {
    var _a, _b;
    const currentPackages = (_b = (_a = currentLockfile) === null || _a === void 0 ? void 0 : _a.packages, (_b !== null && _b !== void 0 ? _b : {}));
    const graph = {};
    let directDependenciesByImporterId = {};
    if (lockfile.packages) {
        const pkgSnapshotByLocation = {};
        await Promise.all(Object.keys(lockfile.packages).map(async (relDepPath) => {
            const depPath = dp.resolve(opts.registries, relDepPath);
            const pkgSnapshot = lockfile.packages[relDepPath];
            // TODO: optimize. This info can be already returned by pkgSnapshotToResolution()
            const pkgName = lockfile_utils_1.nameVerFromPkgSnapshot(relDepPath, pkgSnapshot).name;
            const modules = path.join(opts.virtualStoreDir, pkgid_to_filename_1.default(depPath, opts.lockfileDir), 'node_modules');
            const packageId = lockfile_utils_1.packageIdFromSnapshot(relDepPath, pkgSnapshot, opts.registries);
            const pkgLocation = await opts.storeController.getPackageLocation(packageId, pkgName, {
                lockfileDir: opts.lockfileDir,
                targetEngine: opts.sideEffectsCacheRead && !opts.force && constants_1.ENGINE_NAME || undefined,
            });
            const independent = opts.independentLeaves && lockfile_utils_1.packageIsIndependent(pkgSnapshot);
            const peripheralLocation = !independent
                ? path.join(modules, pkgName)
                : pkgLocation.dir;
            if (currentPackages[relDepPath] && R.equals(currentPackages[relDepPath].dependencies, lockfile.packages[relDepPath].dependencies) &&
                R.equals(currentPackages[relDepPath].optionalDependencies, lockfile.packages[relDepPath].optionalDependencies)) {
                if (await fs.exists(peripheralLocation)) {
                    return;
                }
                brokenNodeModulesLogger.debug({
                    missing: peripheralLocation,
                });
            }
            const resolution = lockfile_utils_1.pkgSnapshotToResolution(relDepPath, pkgSnapshot, opts.registries);
            core_loggers_1.progressLogger.debug({
                packageId,
                requester: opts.lockfileDir,
                status: 'resolved',
            });
            let fetchResponse = opts.storeController.fetchPackage({
                force: false,
                lockfileDir: opts.lockfileDir,
                pkgId: packageId,
                resolution,
            });
            if (fetchResponse instanceof Promise)
                fetchResponse = await fetchResponse;
            fetchResponse.files() // tslint:disable-line
                .then(({ fromStore }) => {
                core_loggers_1.progressLogger.debug({
                    packageId,
                    requester: opts.lockfileDir,
                    status: fromStore
                        ? 'found_in_store' : 'fetched',
                });
            })
                .catch(() => {
                // ignore
            });
            graph[peripheralLocation] = {
                centralLocation: pkgLocation.dir,
                children: {},
                fetchingFiles: fetchResponse.files,
                finishing: fetchResponse.finishing,
                hasBin: pkgSnapshot.hasBin === true,
                hasBundledDependencies: !!pkgSnapshot.bundledDependencies,
                independent,
                isBuilt: pkgLocation.isBuilt,
                modules,
                name: pkgName,
                optional: !!pkgSnapshot.optional,
                optionalDependencies: new Set(R.keys(pkgSnapshot.optionalDependencies)),
                packageId,
                peripheralLocation,
                prepare: pkgSnapshot.prepare === true,
                relDepPath,
                requiresBuild: pkgSnapshot.requiresBuild === true,
            };
            pkgSnapshotByLocation[peripheralLocation] = pkgSnapshot;
        }));
        const ctx = {
            force: opts.force,
            graph,
            independentLeaves: opts.independentLeaves,
            lockfileDir: opts.lockfileDir,
            pkgSnapshotsByRelDepPaths: lockfile.packages,
            registries: opts.registries,
            sideEffectsCacheRead: opts.sideEffectsCacheRead,
            skipped: opts.skipped,
            storeController: opts.storeController,
            storeDir: opts.storeDir,
            virtualStoreDir: opts.virtualStoreDir,
        };
        for (const peripheralLocation of R.keys(graph)) {
            const pkgSnapshot = pkgSnapshotByLocation[peripheralLocation];
            const allDeps = {
                ...pkgSnapshot.dependencies,
                ...(opts.include.optionalDependencies ? pkgSnapshot.optionalDependencies : {}),
            };
            graph[peripheralLocation].children = await getChildrenPaths(ctx, allDeps);
        }
        for (const importerId of opts.importerIds) {
            const lockfileImporter = lockfile.importers[importerId];
            const rootDeps = {
                ...(opts.include.devDependencies ? lockfileImporter.devDependencies : {}),
                ...(opts.include.dependencies ? lockfileImporter.dependencies : {}),
                ...(opts.include.optionalDependencies ? lockfileImporter.optionalDependencies : {}),
            };
            directDependenciesByImporterId[importerId] = await getChildrenPaths(ctx, rootDeps);
        }
    }
    return { graph, directDependenciesByImporterId };
}
async function getChildrenPaths(ctx, allDeps) {
    const children = {};
    for (const alias of Object.keys(allDeps)) {
        const childDepPath = dp.refToAbsolute(allDeps[alias], alias, ctx.registries);
        if (childDepPath === null) {
            children[alias] = path.resolve(ctx.lockfileDir, allDeps[alias].substr(5));
            continue;
        }
        const childRelDepPath = dp.refToRelative(allDeps[alias], alias);
        const childPkgSnapshot = ctx.pkgSnapshotsByRelDepPaths[childRelDepPath];
        if (ctx.graph[childDepPath]) {
            children[alias] = ctx.graph[childDepPath].peripheralLocation;
        }
        else if (childPkgSnapshot) {
            if (ctx.independentLeaves && lockfile_utils_1.packageIsIndependent(childPkgSnapshot)) {
                const pkgId = childPkgSnapshot.id || childDepPath;
                const pkgName = lockfile_utils_1.nameVerFromPkgSnapshot(childRelDepPath, childPkgSnapshot).name;
                const pkgLocation = await ctx.storeController.getPackageLocation(pkgId, pkgName, {
                    lockfileDir: ctx.lockfileDir,
                    targetEngine: ctx.sideEffectsCacheRead && !ctx.force && constants_1.ENGINE_NAME || undefined,
                });
                children[alias] = pkgLocation.dir;
            }
            else {
                const pkgName = lockfile_utils_1.nameVerFromPkgSnapshot(childRelDepPath, childPkgSnapshot).name;
                children[alias] = path.join(ctx.virtualStoreDir, pkgid_to_filename_1.default(childDepPath, ctx.lockfileDir), 'node_modules', pkgName);
            }
        }
        else if (allDeps[alias].indexOf('file:') === 0) {
            children[alias] = path.resolve(ctx.lockfileDir, allDeps[alias].substr(5));
        }
        else if (!ctx.skipped.has(childRelDepPath)) {
            throw new Error(`${childRelDepPath} not found in ${constants_1.WANTED_LOCKFILE}`);
        }
    }
    return children;
}
const limitLinking = p_limit_1.default(16);
async function linkAllPkgs(storeController, depNodes, opts) {
    return Promise.all(depNodes.map(async (depNode) => {
        const filesResponse = await depNode.fetchingFiles();
        if (depNode.independent)
            return;
        return storeController.importPackage(depNode.centralLocation, depNode.peripheralLocation, {
            filesResponse,
            force: opts.force,
        });
    }));
}
async function linkAllBins(depGraph, opts) {
    return Promise.all(R.values(depGraph)
        .map((depNode) => limitLinking(async () => {
        const childrenToLink = opts.optional
            ? depNode.children
            : Object.keys(depNode.children)
                .reduce((nonOptionalChildren, childAlias) => {
                if (!depNode.optionalDependencies.has(childAlias)) {
                    nonOptionalChildren[childAlias] = depNode.children[childAlias];
                }
                return nonOptionalChildren;
            }, {});
        const binPath = path.join(depNode.peripheralLocation, 'node_modules', '.bin');
        const pkgSnapshots = R.props(R.values(childrenToLink), depGraph);
        if (pkgSnapshots.includes(undefined)) { // tslint:disable-line
            await link_bins_1.default(depNode.modules, binPath, { warn: opts.warn });
        }
        else {
            const pkgs = await Promise.all(pkgSnapshots
                .filter(({ hasBin }) => hasBin)
                .map(async ({ peripheralLocation }) => ({
                location: peripheralLocation,
                manifest: await read_package_json_1.fromDir(peripheralLocation),
            })));
            await link_bins_1.linkBinsOfPackages(pkgs, binPath, { warn: opts.warn });
        }
        // link also the bundled dependencies` bins
        if (depNode.hasBundledDependencies) {
            const bundledModules = path.join(depNode.peripheralLocation, 'node_modules');
            await link_bins_1.default(bundledModules, binPath, { warn: opts.warn });
        }
    })));
}
async function linkAllModules(depNodes, opts) {
    return Promise.all(depNodes
        .filter(({ independent }) => !independent)
        .map(async (depNode) => {
        const childrenToLink = opts.optional
            ? depNode.children
            : Object.keys(depNode.children)
                .reduce((nonOptionalChildren, childAlias) => {
                if (!depNode.optionalDependencies.has(childAlias)) {
                    nonOptionalChildren[childAlias] = depNode.children[childAlias];
                }
                return nonOptionalChildren;
            }, {});
        await Promise.all(Object.keys(childrenToLink)
            .map(async (alias) => {
            // if (!pkg.installable && pkg.optional) return
            if (alias === depNode.name) {
                logger_1.default.warn({
                    message: `Cannot link dependency with name ${alias} to ${depNode.modules}. Dependency's name should differ from the parent's name.`,
                    prefix: opts.lockfileDir,
                });
                return;
            }
            await limitLinking(() => symlink_dependency_1.default(childrenToLink[alias], depNode.modules, alias));
        }));
    }));
}

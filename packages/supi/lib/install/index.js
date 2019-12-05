"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const build_modules_1 = require("@pnpm/build-modules");
const constants_1 = require("@pnpm/constants");
const core_loggers_1 = require("@pnpm/core-loggers");
const error_1 = require("@pnpm/error");
const headless_1 = require("@pnpm/headless");
const lifecycle_1 = require("@pnpm/lifecycle");
const link_bins_1 = require("@pnpm/link-bins");
const lockfile_file_1 = require("@pnpm/lockfile-file");
const lockfile_utils_1 = require("@pnpm/lockfile-utils");
const logger_1 = require("@pnpm/logger");
const modules_yaml_1 = require("@pnpm/modules-yaml");
const read_modules_dir_1 = require("@pnpm/read-modules-dir");
const resolve_dependencies_1 = require("@pnpm/resolve-dependencies");
const types_1 = require("@pnpm/types");
const utils_1 = require("@pnpm/utils");
const rimraf = require("@zkochan/rimraf");
const dp = require("dependency-path");
const isInnerLink = require("is-inner-link");
const isSubdir = require("is-subdir");
const p_every_1 = require("p-every");
const pFilter = require("p-filter");
const p_limit_1 = require("p-limit");
const path = require("path");
const R = require("ramda");
const semver = require("semver");
const getContext_1 = require("../getContext");
const getSpecFromPackageManifest_1 = require("../getSpecFromPackageManifest");
const lock_1 = require("../lock");
const lockfilesEqual_1 = require("../lockfilesEqual");
const parseWantedDependencies_1 = require("../parseWantedDependencies");
const safeIsInnerLink_1 = require("../safeIsInnerLink");
const removeDeps_1 = require("../uninstall/removeDeps");
const getPref_1 = require("../utils/getPref");
const extendInstallOptions_1 = require("./extendInstallOptions");
const getPreferredVersions_1 = require("./getPreferredVersions");
const getWantedDependencies_1 = require("./getWantedDependencies");
const link_1 = require("./link");
const lockfile_1 = require("./lockfile");
async function install(manifest, opts) {
    const importers = await mutateModules([
        {
            buildIndex: 0,
            manifest,
            mutation: 'install',
            rootDir: opts.dir || process.cwd(),
        },
    ], opts);
    return importers[0].manifest;
}
exports.install = install;
async function mutateModules(importers, maybeOpts) {
    var _a;
    const reporter = (_a = maybeOpts) === null || _a === void 0 ? void 0 : _a.reporter;
    if (reporter) {
        logger_1.streamParser.on('data', reporter);
    }
    const opts = await extendInstallOptions_1.default(maybeOpts);
    if (!opts.include.dependencies && opts.include.optionalDependencies) {
        throw new error_1.default('OPTIONAL_DEPS_REQUIRE_PROD_DEPS', 'Optional dependencies cannot be installed without production dependencies');
    }
    const ctx = await getContext_1.default(importers, opts);
    for (const { manifest, rootDir } of ctx.importers) {
        if (!manifest) {
            throw new Error(`No package.json found in "${rootDir}"`);
        }
    }
    let result;
    try {
        if (opts.lock) {
            result = await lock_1.default(ctx.lockfileDir, _install, {
                locks: opts.locks,
                prefix: ctx.lockfileDir,
                stale: opts.lockStaleDuration,
                storeController: opts.storeController,
            });
        }
        else {
            result = await _install();
        }
    }
    finally {
        await opts.storeController.saveState();
    }
    if (reporter) {
        logger_1.streamParser.removeListener('data', reporter);
    }
    return result;
    async function _install() {
        const installsOnly = importers.every((importer) => importer.mutation === 'install');
        if (!opts.lockfileOnly &&
            !opts.update &&
            installsOnly &&
            (opts.frozenLockfile ||
                opts.preferFrozenLockfile &&
                    (!opts.pruneLockfileImporters || Object.keys(ctx.wantedLockfile.importers).length === ctx.importers.length) &&
                    ctx.existsWantedLockfile &&
                    ctx.wantedLockfile.lockfileVersion === constants_1.LOCKFILE_VERSION &&
                    await p_every_1.default(ctx.importers, async (importer) => !hasLocalTarballDepsInRoot(ctx.wantedLockfile, importer.id) &&
                        lockfile_utils_1.satisfiesPackageManifest(ctx.wantedLockfile, importer.manifest, importer.id) &&
                        linkedPackagesAreUpToDate(importer.manifest, ctx.wantedLockfile.importers[importer.id], importer.rootDir, opts.localPackages)))) {
            if (!ctx.existsWantedLockfile) {
                if (ctx.importers.some((importer) => pkgHasDependencies(importer.manifest))) {
                    throw new Error(`Headless installation requires a ${constants_1.WANTED_LOCKFILE} file`);
                }
            }
            else {
                logger_1.default.info({ message: 'Lockfile is up-to-date, resolution step is skipped', prefix: opts.lockfileDir });
                await headless_1.default({
                    currentEngine: {
                        nodeVersion: opts.nodeVersion,
                        pnpmVersion: opts.packageManager.name === 'pnpm' ? opts.packageManager.version : '',
                    },
                    currentLockfile: ctx.currentLockfile,
                    engineStrict: opts.engineStrict,
                    extraBinPaths: opts.extraBinPaths,
                    force: opts.force,
                    hoistedAliases: ctx.hoistedAliases,
                    hoistPattern: ctx.hoistPattern,
                    ignoreScripts: opts.ignoreScripts,
                    importers: ctx.importers,
                    include: opts.include,
                    independentLeaves: opts.independentLeaves,
                    lockfileDir: ctx.lockfileDir,
                    ownLifecycleHooksStdio: opts.ownLifecycleHooksStdio,
                    packageManager: opts.packageManager,
                    pendingBuilds: ctx.pendingBuilds,
                    pruneStore: opts.pruneStore,
                    rawConfig: opts.rawConfig,
                    registries: opts.registries,
                    shamefullyHoist: ctx.shamefullyHoist,
                    sideEffectsCacheRead: opts.sideEffectsCacheRead,
                    sideEffectsCacheWrite: opts.sideEffectsCacheWrite,
                    skipped: ctx.skipped,
                    storeController: opts.storeController,
                    storeDir: opts.storeDir,
                    unsafePerm: opts.unsafePerm,
                    userAgent: opts.userAgent,
                    virtualStoreDir: ctx.virtualStoreDir,
                    wantedLockfile: ctx.wantedLockfile,
                });
                return importers;
            }
        }
        const importersToInstall = [];
        const importersToBeInstalled = ctx.importers.filter(({ mutation }) => mutation === 'install');
        const scriptsOpts = {
            extraBinPaths: opts.extraBinPaths,
            rawConfig: opts.rawConfig,
            stdio: opts.ownLifecycleHooksStdio,
            unsafePerm: opts.unsafePerm || false,
        };
        if (!opts.ignoreScripts) {
            await lifecycle_1.runLifecycleHooksConcurrently(['preinstall'], importersToBeInstalled, opts.childConcurrency, scriptsOpts);
        }
        // TODO: make it concurrent
        for (const importer of ctx.importers) {
            switch (importer.mutation) {
                case 'uninstallSome':
                    importersToInstall.push({
                        pruneDirectDependencies: false,
                        ...importer,
                        removePackages: importer.dependencyNames,
                        updatePackageManifest: true,
                        wantedDependencies: [],
                    });
                    break;
                case 'install': {
                    await installCase(importer);
                    break;
                }
                case 'installSome': {
                    await installSome(importer);
                    break;
                }
                case 'unlink': {
                    const packageDirs = await read_modules_dir_1.default(importer.modulesDir);
                    const externalPackages = await pFilter(packageDirs, (packageDir) => isExternalLink(ctx.storeDir, importer.modulesDir, packageDir));
                    const allDeps = utils_1.getAllDependenciesFromPackage(importer.manifest);
                    const packagesToInstall = [];
                    for (const pkgName of externalPackages) {
                        await rimraf(path.join(importer.modulesDir, pkgName));
                        if (allDeps[pkgName]) {
                            packagesToInstall.push(pkgName);
                        }
                    }
                    if (!packagesToInstall.length)
                        return importers;
                    // TODO: install only those that were unlinked
                    // but don't update their version specs in package.json
                    await installCase({ ...importer, mutation: 'install' });
                    break;
                }
                case 'unlinkSome': {
                    const packagesToInstall = [];
                    const allDeps = utils_1.getAllDependenciesFromPackage(importer.manifest);
                    for (const depName of importer.dependencyNames) {
                        try {
                            if (!await isExternalLink(ctx.storeDir, importer.modulesDir, depName)) {
                                logger_1.default.warn({
                                    message: `${depName} is not an external link`,
                                    prefix: importer.rootDir,
                                });
                                continue;
                            }
                        }
                        catch (err) {
                            if (err['code'] !== 'ENOENT')
                                throw err; // tslint:disable-line:no-string-literal
                        }
                        await rimraf(path.join(importer.modulesDir, depName));
                        if (allDeps[depName]) {
                            packagesToInstall.push(depName);
                        }
                    }
                    if (!packagesToInstall.length)
                        return importers;
                    // TODO: install only those that were unlinked
                    // but don't update their version specs in package.json
                    await installSome({ ...importer, mutation: 'installSome', dependencySelectors: packagesToInstall }, false);
                    break;
                }
            }
        }
        async function installCase(importer) {
            var _a, _b, _c, _d;
            const wantedDependencies = getWantedDependencies_1.default(importer.manifest, { updateWorkspaceDependencies: opts.update });
            if ((_a = ctx.wantedLockfile) === null || _a === void 0 ? void 0 : _a.importers) {
                forgetResolutionsOfPrevWantedDeps(ctx.wantedLockfile.importers[importer.id], wantedDependencies);
            }
            const scripts = opts.ignoreScripts ? {} : (_c = (_b = importer.manifest) === null || _b === void 0 ? void 0 : _b.scripts, (_c !== null && _c !== void 0 ? _c : {}));
            if (opts.ignoreScripts && ((_d = importer.manifest) === null || _d === void 0 ? void 0 : _d.scripts) &&
                (importer.manifest.scripts.preinstall || importer.manifest.scripts.prepublish ||
                    importer.manifest.scripts.install ||
                    importer.manifest.scripts.postinstall ||
                    importer.manifest.scripts.prepare)) {
                ctx.pendingBuilds.push(importer.id);
            }
            if (scripts['prepublish']) { // tslint:disable-line:no-string-literal
                logger_1.default.warn({
                    message: '`prepublish` scripts are deprecated. Use `prepare` for build steps and `prepublishOnly` for upload-only.',
                    prefix: importer.rootDir,
                });
            }
            importersToInstall.push({
                pruneDirectDependencies: false,
                ...importer,
                updatePackageManifest: opts.update === true,
                wantedDependencies,
            });
        }
        async function installSome(importer, updatePackageManifest = true) {
            const currentPrefs = opts.ignoreCurrentPrefs ? {} : utils_1.getAllDependenciesFromPackage(importer.manifest);
            const optionalDependencies = importer.targetDependenciesField ? {} : importer.manifest.optionalDependencies || {};
            const devDependencies = importer.targetDependenciesField ? {} : importer.manifest.devDependencies || {};
            const wantedDeps = parseWantedDependencies_1.default(importer.dependencySelectors, {
                allowNew: importer.allowNew !== false,
                currentPrefs,
                defaultTag: opts.tag,
                dev: importer.targetDependenciesField === 'devDependencies',
                devDependencies,
                optional: importer.targetDependenciesField === 'optionalDependencies',
                optionalDependencies,
                updateWorkspaceDependencies: opts.update,
            });
            importersToInstall.push({
                pruneDirectDependencies: false,
                ...importer,
                updatePackageManifest,
                wantedDependencies: wantedDeps.map(wantedDep => ({ ...wantedDep, isNew: true })),
            });
        }
        const equalLockfiles = lockfilesEqual_1.default(ctx.currentLockfile, ctx.wantedLockfile);
        const currentLockfileIsUpToDate = !ctx.existsWantedLockfile || equalLockfiles;
        // Unfortunately, the private lockfile may differ from the public one.
        // A user might run named installations on a project that has a pnpm-lock.yaml file before running a noop install
        const makePartialCurrentLockfile = !installsOnly && (ctx.existsWantedLockfile && !ctx.existsCurrentLockfile ||
            // TODO: this operation is quite expensive. We'll have to find a better solution to do this.
            // maybe in pnpm v2 it won't be needed. See: https://github.com/pnpm/pnpm/issues/841
            !equalLockfiles);
        const result = await installInContext(importersToInstall, ctx, {
            ...opts,
            currentLockfileIsUpToDate,
            makePartialCurrentLockfile,
            update: opts.update || !installsOnly,
            updateLockfileMinorVersion: true,
        });
        if (!opts.ignoreScripts) {
            await lifecycle_1.runLifecycleHooksConcurrently(['install', 'postinstall', 'prepublish', 'prepare'], importersToBeInstalled, opts.childConcurrency, scriptsOpts);
        }
        return result;
    }
}
exports.mutateModules = mutateModules;
async function isExternalLink(storeDir, modules, pkgName) {
    const link = await isInnerLink(modules, pkgName);
    // checking whether the link is pointing to the store is needed
    // because packages are linked to store when independent-leaves = true
    return !link.isInner && !isSubdir(storeDir, link.target);
}
function pkgHasDependencies(manifest) {
    return Boolean(R.keys(manifest.dependencies).length ||
        R.keys(manifest.devDependencies).length ||
        R.keys(manifest.optionalDependencies).length);
}
async function partitionLinkedPackages(dependencies, opts) {
    var _a;
    const nonLinkedDependencies = [];
    const linkedAliases = new Set();
    for (const dependency of dependencies) {
        if (!dependency.alias || ((_a = opts.localPackages) === null || _a === void 0 ? void 0 : _a[dependency.alias])) {
            nonLinkedDependencies.push(dependency);
            continue;
        }
        const isInnerLink = await safeIsInnerLink_1.default(opts.modulesDir, dependency.alias, {
            hideAlienModules: opts.lockfileOnly === false,
            importerDir: opts.importerDir,
            storeDir: opts.storeDir,
            virtualStoreDir: opts.virtualStoreDir,
        });
        if (isInnerLink === true) {
            nonLinkedDependencies.push(dependency);
            continue;
        }
        // This info-log might be better to be moved to the reporter
        logger_1.default.info({
            message: `${dependency.alias} is linked to ${opts.modulesDir} from ${isInnerLink}`,
            prefix: opts.importerDir,
        });
        linkedAliases.add(dependency.alias);
    }
    return {
        linkedAliases,
        nonLinkedDependencies,
    };
}
// If the specifier is new, the old resolution probably does not satisfy it anymore.
// By removing these resolutions we ensure that they are resolved again using the new specs.
function forgetResolutionsOfPrevWantedDeps(importer, wantedDeps) {
    var _a;
    if (!importer.specifiers)
        return;
    importer.dependencies = importer.dependencies || {};
    importer.devDependencies = importer.devDependencies || {};
    importer.optionalDependencies = importer.optionalDependencies || {};
    for (const { alias, pref } of wantedDeps) {
        if (alias && importer.specifiers[alias] !== pref) {
            if (((_a = importer.dependencies[alias]) === null || _a === void 0 ? void 0 : _a.startsWith('link:')) === false) {
                delete importer.dependencies[alias];
            }
            delete importer.devDependencies[alias];
            delete importer.optionalDependencies[alias];
        }
    }
}
async function linkedPackagesAreUpToDate(manifest, lockfileImporter, prefix, localPackages) {
    var _a, _b, _c;
    const localPackagesByDirectory = localPackages ? getLocalPackagesByDirectory(localPackages) : {};
    for (const depField of types_1.DEPENDENCIES_FIELDS) {
        const importerDeps = lockfileImporter[depField];
        const pkgDeps = manifest[depField];
        if (!importerDeps || !pkgDeps)
            continue;
        const depNames = Object.keys(importerDeps);
        for (const depName of depNames) {
            if (!pkgDeps[depName])
                continue;
            const isLinked = importerDeps[depName].startsWith('link:');
            if (isLinked && (pkgDeps[depName].startsWith('link:') || pkgDeps[depName].startsWith('file:')))
                continue;
            const dir = isLinked
                ? path.join(prefix, importerDeps[depName].substr(5))
                : (_c = (_b = (_a = localPackages) === null || _a === void 0 ? void 0 : _a[depName]) === null || _b === void 0 ? void 0 : _b[importerDeps[depName]]) === null || _c === void 0 ? void 0 : _c.dir;
            if (!dir)
                continue;
            const linkedPkg = localPackagesByDirectory[dir] || await utils_1.safeReadPackageFromDir(dir);
            const availableVersion = pkgDeps[depName].startsWith('workspace:') ? pkgDeps[depName].substr(10) : pkgDeps[depName];
            const localPackageSatisfiesRange = linkedPkg && semver.satisfies(linkedPkg.version, availableVersion);
            if (isLinked !== localPackageSatisfiesRange)
                return false;
        }
    }
    return true;
}
function getLocalPackagesByDirectory(localPackages) {
    const localPackagesByDirectory = {};
    Object.keys(localPackages || {}).forEach((pkgName) => {
        Object.keys(localPackages[pkgName] || {}).forEach((pkgVersion) => {
            localPackagesByDirectory[localPackages[pkgName][pkgVersion].dir] = localPackages[pkgName][pkgVersion].manifest;
        });
    });
    return localPackagesByDirectory;
}
function hasLocalTarballDepsInRoot(lockfile, importerId) {
    var _a;
    const importer = (_a = lockfile.importers) === null || _a === void 0 ? void 0 : _a[importerId];
    if (!importer)
        return false;
    return R.any(refIsLocalTarball, R.values(importer.dependencies || {}))
        || R.any(refIsLocalTarball, R.values(importer.devDependencies || {}))
        || R.any(refIsLocalTarball, R.values(importer.optionalDependencies || {}));
}
function refIsLocalTarball(ref) {
    return ref.startsWith('file:') && (ref.endsWith('.tgz') || ref.endsWith('.tar.gz') || ref.endsWith('.tar'));
}
async function addDependenciesToPackage(manifest, dependencySelectors, opts) {
    const importers = await mutateModules([
        {
            allowNew: opts.allowNew,
            dependencySelectors,
            manifest,
            mutation: 'installSome',
            peer: opts.peer,
            pinnedVersion: opts.pinnedVersion,
            rootDir: opts.dir || process.cwd(),
            targetDependenciesField: opts.targetDependenciesField,
        },
    ], {
        ...opts,
        lockfileDir: opts.lockfileDir || opts.dir,
    });
    return importers[0].manifest;
}
exports.addDependenciesToPackage = addDependenciesToPackage;
async function installInContext(importers, ctx, opts) {
    var _a, _b, _c;
    if (opts.lockfileOnly && ctx.existsCurrentLockfile) {
        logger_1.default.warn({
            message: '`node_modules` is present. Lockfile only installation will make it out-of-date',
            prefix: ctx.lockfileDir,
        });
    }
    ctx.wantedLockfile.importers = ctx.wantedLockfile.importers || {};
    for (const { id } of importers) {
        if (!ctx.wantedLockfile.importers[id]) {
            ctx.wantedLockfile.importers[id] = { specifiers: {} };
        }
    }
    if (opts.pruneLockfileImporters) {
        const importerIds = new Set(importers.map(({ id }) => id));
        for (const wantedImporter of Object.keys(ctx.wantedLockfile.importers)) {
            if (!importerIds.has(wantedImporter)) {
                delete ctx.wantedLockfile.importers[wantedImporter];
            }
        }
    }
    await Promise.all(importers
        .map(async (importer) => {
        if (importer.mutation !== 'uninstallSome')
            return;
        importer.manifest = await removeDeps_1.default(importer.manifest, importer.dependencyNames, {
            prefix: importer.rootDir,
            saveType: importer.targetDependenciesField,
        });
    }));
    core_loggers_1.stageLogger.debug({
        prefix: ctx.lockfileDir,
        stage: 'resolution_started',
    });
    const defaultUpdateDepth = (() => {
        if (opts.force)
            return Infinity;
        if (opts.update) {
            return opts.depth;
        }
        return -1;
    })();
    const _toResolveImporter = toResolveImporter.bind(null, {
        defaultUpdateDepth,
        localPackages: opts.localPackages,
        lockfileOnly: opts.lockfileOnly,
        preferredVersions: opts.preferredVersions,
        storeDir: ctx.storeDir,
        virtualStoreDir: ctx.virtualStoreDir,
    });
    const importersToResolve = await Promise.all(importers.map((importer) => _toResolveImporter(importer, Boolean(ctx.hoistPattern && importer.id === '.'))));
    const { dependenciesTree, outdatedDependencies, resolvedImporters, resolvedPackagesByPackageId, wantedToBeSkippedPackageIds, } = await resolve_dependencies_1.default(importersToResolve, {
        currentLockfile: ctx.currentLockfile,
        dryRun: opts.lockfileOnly,
        engineStrict: opts.engineStrict,
        force: opts.force,
        hooks: opts.hooks,
        localPackages: opts.localPackages,
        lockfileDir: opts.lockfileDir,
        nodeVersion: opts.nodeVersion,
        pnpmVersion: opts.packageManager.name === 'pnpm' ? opts.packageManager.version : '',
        registries: opts.registries,
        resolutionStrategy: opts.resolutionStrategy,
        sideEffectsCache: opts.sideEffectsCacheRead,
        storeController: opts.storeController,
        tag: opts.tag,
        updateLockfile: ctx.wantedLockfile.lockfileVersion !== constants_1.LOCKFILE_VERSION || !opts.currentLockfileIsUpToDate,
        virtualStoreDir: ctx.virtualStoreDir,
        wantedLockfile: ctx.wantedLockfile,
    });
    core_loggers_1.stageLogger.debug({
        prefix: ctx.lockfileDir,
        stage: 'resolution_done',
    });
    const importersToLink = await Promise.all(importers.map(async (importer, index) => {
        const resolvedImporter = resolvedImporters[importer.id];
        let newPkg = importer.manifest;
        if (importer.updatePackageManifest) {
            newPkg = await getPref_1.updateImporterManifest(importersToResolve[index], {
                directDependencies: resolvedImporter.directDependencies,
                saveWorkspaceProtocol: opts.saveWorkspaceProtocol,
            });
        }
        else {
            core_loggers_1.packageManifestLogger.debug({
                prefix: importer.rootDir,
                updated: importer.manifest,
            });
        }
        if (newPkg) {
            const lockfileImporter = ctx.wantedLockfile.importers[importer.id];
            ctx.wantedLockfile.importers[importer.id] = addDirectDependenciesToLockfile(newPkg, lockfileImporter, resolvedImporter.linkedDependencies, resolvedImporter.directDependencies, ctx.registries);
        }
        const topParents = importer.manifest
            ? await getTopParents(R.difference(Object.keys(utils_1.getAllDependenciesFromPackage(importer.manifest)), resolvedImporter.directDependencies
                .filter(({ isNew }) => isNew === true)
                .map(({ alias }) => alias) || []), importer.modulesDir)
            : [];
        return {
            binsDir: importer.binsDir,
            directNodeIdsByAlias: resolvedImporter.directNodeIdsByAlias,
            id: importer.id,
            linkedDependencies: resolvedImporter.linkedDependencies,
            manifest: newPkg || importer.manifest,
            modulesDir: importer.modulesDir,
            pruneDirectDependencies: importer.pruneDirectDependencies,
            removePackages: importer.removePackages,
            rootDir: importer.rootDir,
            topParents,
        };
    }));
    const result = await link_1.default(importersToLink, dependenciesTree, {
        afterAllResolvedHook: (_a = opts.hooks) === null || _a === void 0 ? void 0 : _a.afterAllResolved,
        currentLockfile: ctx.currentLockfile,
        dryRun: opts.lockfileOnly,
        force: opts.force,
        hoistedAliases: ctx.hoistedAliases,
        hoistedModulesDir: ctx.hoistedModulesDir,
        hoistPattern: ctx.hoistPattern,
        include: opts.include,
        independentLeaves: opts.independentLeaves,
        lockfileDir: opts.lockfileDir,
        makePartialCurrentLockfile: opts.makePartialCurrentLockfile,
        outdatedDependencies,
        pruneStore: opts.pruneStore,
        registries: ctx.registries,
        sideEffectsCacheRead: opts.sideEffectsCacheRead,
        skipped: ctx.skipped,
        storeController: opts.storeController,
        strictPeerDependencies: opts.strictPeerDependencies,
        updateLockfileMinorVersion: opts.updateLockfileMinorVersion,
        virtualStoreDir: ctx.virtualStoreDir,
        wantedLockfile: ctx.wantedLockfile,
        wantedToBeSkippedPackageIds,
    });
    ctx.pendingBuilds = ctx.pendingBuilds
        .filter((relDepPath) => !result.removedDepPaths.has(dp.resolve(ctx.registries, relDepPath)));
    if (opts.ignoreScripts) {
        // we can use concat here because we always only append new packages, which are guaranteed to not be there by definition
        ctx.pendingBuilds = ctx.pendingBuilds
            .concat(result.newDepPaths
            .filter((depPath) => result.depGraph[depPath].requiresBuild)
            .map((depPath) => dp.relative(ctx.registries, result.depGraph[depPath].name, depPath)));
    }
    if (!opts.lockfileOnly) {
        // postinstall hooks
        if (!opts.ignoreScripts && ((_b = result.newDepPaths) === null || _b === void 0 ? void 0 : _b.length)) {
            const depPaths = Object.keys(result.depGraph);
            const rootNodes = depPaths.filter((depPath) => result.depGraph[depPath].depth === 0);
            await build_modules_1.default(result.depGraph, rootNodes, {
                childConcurrency: opts.childConcurrency,
                depsToBuild: new Set(result.newDepPaths),
                extraBinPaths: ctx.extraBinPaths,
                lockfileDir: ctx.lockfileDir,
                optional: opts.include.optionalDependencies,
                rawConfig: opts.rawConfig,
                rootNodeModulesDir: ctx.virtualStoreDir,
                sideEffectsCacheWrite: opts.sideEffectsCacheWrite,
                storeController: opts.storeController,
                unsafePerm: opts.unsafePerm,
                userAgent: opts.userAgent,
            });
        }
        if ((_c = result.newDepPaths) === null || _c === void 0 ? void 0 : _c.length) {
            const newPkgs = R.props(result.newDepPaths, result.depGraph);
            await linkAllBins(newPkgs, result.depGraph, {
                optional: opts.include.optionalDependencies,
                warn: (message) => logger_1.default.warn({ message, prefix: opts.lockfileDir }),
            });
        }
        if (!opts.lockfileOnly) {
            await Promise.all(importersToLink.map(linkBinsOfImporter));
        }
    }
    // waiting till the skipped packages are downloaded to the store
    await Promise.all(R.props(Array.from(ctx.skipped), resolvedPackagesByPackageId)
        // skipped packages might have not been reanalized on a repeat install
        // so lets just ignore those by excluding nulls
        .filter(Boolean)
        .map(({ fetchingFiles }) => fetchingFiles()));
    // waiting till package requests are finished
    await Promise.all(R.values(resolvedPackagesByPackageId).map(({ finishing }) => finishing()));
    const lockfileOpts = { forceSharedFormat: opts.forceSharedLockfile };
    if (opts.lockfileOnly) {
        await lockfile_file_1.writeWantedLockfile(ctx.lockfileDir, result.wantedLockfile, lockfileOpts);
    }
    else {
        await Promise.all([
            opts.useLockfile
                ? lockfile_file_1.writeLockfiles({
                    currentLockfile: result.currentLockfile,
                    currentLockfileDir: ctx.virtualStoreDir,
                    wantedLockfile: result.wantedLockfile,
                    wantedLockfileDir: ctx.lockfileDir,
                    ...lockfileOpts,
                })
                : lockfile_file_1.writeCurrentLockfile(ctx.virtualStoreDir, result.currentLockfile, lockfileOpts),
            (() => {
                if (result.currentLockfile.packages === undefined && result.removedDepPaths.size === 0) {
                    return Promise.resolve();
                }
                return modules_yaml_1.write(ctx.rootModulesDir, {
                    ...ctx.modulesFile,
                    hoistedAliases: result.newHoistedAliases,
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
            })(),
        ]);
    }
    core_loggers_1.summaryLogger.debug({ prefix: opts.lockfileDir });
    await opts.storeController.close();
    return importersToLink.map(({ manifest, rootDir }) => ({ rootDir, manifest }));
}
async function toResolveImporter(opts, importer, hoist) {
    var _a, _b;
    const allDeps = getWantedDependencies_1.default(importer.manifest);
    const { linkedAliases, nonLinkedDependencies } = await partitionLinkedPackages(allDeps, {
        importerDir: importer.rootDir,
        localPackages: opts.localPackages,
        lockfileOnly: opts.lockfileOnly,
        modulesDir: importer.modulesDir,
        storeDir: opts.storeDir,
        virtualStoreDir: opts.virtualStoreDir,
    });
    const existingDeps = nonLinkedDependencies
        .filter(({ alias }) => !importer.wantedDependencies.some((wantedDep) => wantedDep.alias === alias));
    let wantedDependencies;
    if (!importer.manifest || hoist) {
        wantedDependencies = [
            ...importer.wantedDependencies,
            ...existingDeps,
        ]
            .map((dep) => ({
            ...dep,
            updateDepth: hoist ? Infinity : opts.defaultUpdateDepth,
        }));
    }
    else {
        wantedDependencies = [
            ...importer.wantedDependencies.map((dep) => ({ ...dep, updateDepth: opts.defaultUpdateDepth })),
            ...existingDeps.map((dep) => ({ ...dep, updateDepth: -1 })),
        ];
    }
    return {
        ...importer,
        preferredVersions: (_b = (_a = opts.preferredVersions, (_a !== null && _a !== void 0 ? _a : (importer.manifest && getPreferredVersions_1.default(importer.manifest)))), (_b !== null && _b !== void 0 ? _b : {})),
        wantedDependencies: wantedDependencies
            .filter(({ alias, updateDepth }) => updateDepth >= 0 || !linkedAliases.has(alias)),
    };
}
const limitLinking = p_limit_1.default(16);
function linkBinsOfImporter({ modulesDir, binsDir, rootDir }) {
    const warn = (message) => logger_1.default.warn({ message, prefix: rootDir });
    return link_bins_1.default(modulesDir, binsDir, { allowExoticManifests: true, warn });
}
async function linkAllBins(depNodes, depGraph, opts) {
    return Promise.all(depNodes.map((depNode => limitLinking(async () => build_modules_1.linkBinsOfDependencies(depNode, depGraph, opts)))));
}
function addDirectDependenciesToLockfile(newManifest, lockfileImporter, linkedPackages, directDependencies, registries) {
    var _a, _b, _c;
    const newLockfileImporter = {
        dependencies: {},
        devDependencies: {},
        optionalDependencies: {},
        specifiers: {},
    };
    linkedPackages.forEach((linkedPkg) => {
        newLockfileImporter.specifiers[linkedPkg.alias] = getSpecFromPackageManifest_1.default(newManifest, linkedPkg.alias);
    });
    const directDependenciesByAlias = directDependencies.reduce((acc, directDependency) => {
        acc[directDependency.alias] = directDependency;
        return acc;
    }, {});
    const optionalDependencies = R.keys(newManifest.optionalDependencies);
    const dependencies = R.difference(R.keys(newManifest.dependencies), optionalDependencies);
    const devDependencies = R.difference(R.difference(R.keys(newManifest.devDependencies), optionalDependencies), dependencies);
    const allDeps = [
        ...optionalDependencies,
        ...devDependencies,
        ...dependencies,
    ];
    for (const alias of allDeps) {
        if (directDependenciesByAlias[alias]) {
            const dep = directDependenciesByAlias[alias];
            const ref = lockfile_1.absolutePathToRef(dep.id, {
                alias: dep.alias,
                realName: dep.name,
                registries,
                resolution: dep.resolution,
            });
            if (dep.dev) {
                newLockfileImporter.devDependencies[dep.alias] = ref;
            }
            else if (dep.optional) {
                newLockfileImporter.optionalDependencies[dep.alias] = ref;
            }
            else {
                newLockfileImporter.dependencies[dep.alias] = ref;
            }
            newLockfileImporter.specifiers[dep.alias] = getSpecFromPackageManifest_1.default(newManifest, dep.alias);
        }
        else if (lockfileImporter.specifiers[alias]) {
            newLockfileImporter.specifiers[alias] = lockfileImporter.specifiers[alias];
            if ((_a = lockfileImporter.dependencies) === null || _a === void 0 ? void 0 : _a[alias]) {
                newLockfileImporter.dependencies[alias] = lockfileImporter.dependencies[alias];
            }
            else if ((_b = lockfileImporter.optionalDependencies) === null || _b === void 0 ? void 0 : _b[alias]) {
                newLockfileImporter.optionalDependencies[alias] = lockfileImporter.optionalDependencies[alias];
            }
            else if ((_c = lockfileImporter.devDependencies) === null || _c === void 0 ? void 0 : _c[alias]) {
                newLockfileImporter.devDependencies[alias] = lockfileImporter.devDependencies[alias];
            }
        }
    }
    alignDependencyTypes(newManifest, newLockfileImporter);
    return newLockfileImporter;
}
function alignDependencyTypes(manifest, lockfileImporter) {
    const depTypesOfAliases = getAliasToDependencyTypeMap(manifest);
    // Aligning the dependency types in pnpm-lock.yaml
    for (const depType of types_1.DEPENDENCIES_FIELDS) {
        if (!lockfileImporter[depType])
            continue;
        for (const alias of Object.keys(lockfileImporter[depType] || {})) {
            if (depType === depTypesOfAliases[alias] || !depTypesOfAliases[alias])
                continue;
            lockfileImporter[depTypesOfAliases[alias]][alias] = lockfileImporter[depType][alias];
            delete lockfileImporter[depType][alias];
        }
    }
}
function getAliasToDependencyTypeMap(manifest) {
    const depTypesOfAliases = {};
    for (const depType of types_1.DEPENDENCIES_FIELDS) {
        if (!manifest[depType])
            continue;
        for (const alias of Object.keys(manifest[depType] || {})) {
            if (!depTypesOfAliases[alias]) {
                depTypesOfAliases[alias] = depType;
            }
        }
    }
    return depTypesOfAliases;
}
async function getTopParents(pkgNames, modules) {
    const pkgs = await Promise.all(pkgNames.map((pkgName) => path.join(modules, pkgName)).map(utils_1.safeReadPackageFromDir));
    return pkgs
        .filter(Boolean)
        .map(({ name, version }) => ({ name, version }));
}

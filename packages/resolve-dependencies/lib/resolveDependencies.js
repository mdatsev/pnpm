"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_loggers_1 = require("@pnpm/core-loggers");
const error_1 = require("@pnpm/error");
const lockfile_utils_1 = require("@pnpm/lockfile-utils");
const logger_1 = require("@pnpm/logger");
const package_is_installable_1 = require("@pnpm/package-is-installable");
const utils_1 = require("@pnpm/utils");
const dp = require("dependency-path");
const path = require("path");
const exists = require("path-exists");
const R = require("ramda");
const semver = require("semver");
const encodePkgId_1 = require("./encodePkgId");
const getNonDevWantedDependencies_1 = require("./getNonDevWantedDependencies");
const wantedDepIsLocallyAvailable_1 = require("./wantedDepIsLocallyAvailable");
const dependencyResolvedLogger = logger_1.default('_dependency_resolved');
function nodeIdToParents(nodeId, resolvedPackagesByPackageId) {
    const pkgIds = utils_1.splitNodeId(nodeId).slice(2, -2);
    return pkgIds
        .map((pkgId) => {
        const pkg = resolvedPackagesByPackageId[pkgId];
        return {
            id: pkg.id,
            name: pkg.name,
            version: pkg.version,
        };
    });
}
exports.nodeIdToParents = nodeIdToParents;
const ENGINE_NAME = `${process.platform}-${process.arch}-node-${process.version.split('.')[0]}`;
async function resolveDependencies(ctx, wantedDependencies, options) {
    const extendedWantedDeps = getDepsToResolve(wantedDependencies, ctx.wantedLockfile, {
        parentDependsOnPeers: options.parentDependsOnPeers,
        preferedDependencies: options.preferedDependencies,
        prefix: ctx.prefix,
        proceed: options.proceed,
        registries: ctx.registries,
        resolvedDependencies: options.resolvedDependencies,
        updateLockfile: ctx.updateLockfile,
    });
    const resolveDepOpts = {
        currentDepth: options.currentDepth,
        dependentId: options.dependentId,
        localPackages: options.localPackages,
        parentDependsOnPeer: options.parentDependsOnPeers,
        parentIsInstallable: options.parentIsInstallable,
        parentNodeId: options.parentNodeId,
        preferredVersions: options.preferredVersions,
        readPackageHook: options.readPackageHook,
    };
    const postponedResolutionsQueue = ctx.resolutionStrategy === 'fewer-dependencies'
        ? [] : undefined;
    const pkgAddresses = (await Promise.all(extendedWantedDeps
        .map(async (extendedWantedDep) => {
        const updateDepth = typeof extendedWantedDep.wantedDependency.updateDepth === 'number'
            ? extendedWantedDep.wantedDependency.updateDepth : options.updateDepth;
        const resolveDependencyOpts = {
            ...resolveDepOpts,
            ...extendedWantedDep.infoFromLockfile,
            proceed: extendedWantedDep.proceed,
            update: options.currentDepth <= updateDepth,
            updateDepth,
        };
        const resolveDependencyResult = await resolveDependency(extendedWantedDep.wantedDependency, ctx, resolveDependencyOpts);
        if (!resolveDependencyResult)
            return null;
        if (resolveDependencyResult.isLinkedDependency || !resolveDependencyResult.isNew)
            return resolveDependencyResult;
        const resolveChildren = async function (preferredVersions) {
            const resolvedPackage = ctx.resolvedPackagesByPackageId[resolveDependencyResult.pkgId];
            const resolvedDependencies = resolveDependencyResult.updated
                ? undefined
                : extendedWantedDep.infoFromLockfile && extendedWantedDep.infoFromLockfile.resolvedDependencies || undefined;
            const optionalDependencyNames = extendedWantedDep.infoFromLockfile && extendedWantedDep.infoFromLockfile.optionalDependencyNames || undefined;
            const children = await resolveDependencies(ctx, getWantedDependencies(resolveDependencyResult.pkg, {
                optionalDependencyNames,
                resolvedDependencies,
                useManifestInfoFromLockfile: resolveDependencyResult.useManifestInfoFromLockfile,
            }), {
                currentDepth: options.currentDepth + 1,
                dependentId: resolveDependencyResult.pkgId,
                parentDependsOnPeers: Boolean(Object.keys(resolveDependencyOpts.dependencyLockfile && resolveDependencyOpts.dependencyLockfile.peerDependencies || resolveDependencyResult.pkg.peerDependencies || {}).length),
                parentIsInstallable: resolveDependencyResult.installable,
                parentNodeId: resolveDependencyResult.nodeId,
                preferedDependencies: resolveDependencyResult.updated
                    ? extendedWantedDep.infoFromLockfile && extendedWantedDep.infoFromLockfile.resolvedDependencies || undefined
                    : undefined,
                preferredVersions,
                // If the package is not linked, we should also gather information about its dependencies.
                // After linking the package we'll need to symlink its dependencies.
                proceed: !resolveDependencyResult.depIsLinked,
                resolvedDependencies,
                updateDepth,
            });
            ctx.childrenByParentId[resolveDependencyResult.pkgId] = children.map((child) => ({
                alias: child.alias,
                pkgId: child.pkgId,
            }));
            ctx.dependenciesTree[resolveDependencyResult.nodeId] = {
                children: children.reduce((chn, child) => {
                    chn[child.alias] = child.nodeId;
                    return chn;
                }, {}),
                depth: options.currentDepth,
                installable: resolveDependencyResult.installable,
                resolvedPackage,
            };
        };
        if (postponedResolutionsQueue) {
            postponedResolutionsQueue.push(resolveChildren);
        }
        await resolveChildren(options.preferredVersions);
        return resolveDependencyResult;
    })))
        .filter(Boolean);
    if (postponedResolutionsQueue) {
        const newPreferredVersions = {
            ...options.preferredVersions,
        };
        for (const { pkgId } of pkgAddresses) {
            if (!pkgId)
                continue; // This will happen only with linked dependencies
            const resolvedPackage = ctx.resolvedPackagesByPackageId[pkgId];
            if (newPreferredVersions[resolvedPackage.name] && newPreferredVersions[resolvedPackage.name].type !== 'tag') {
                newPreferredVersions[resolvedPackage.name] = {
                    selector: `${newPreferredVersions[resolvedPackage.name].selector} || ${resolvedPackage.version}`,
                    type: 'range',
                };
            }
            else {
                newPreferredVersions[resolvedPackage.name] = {
                    selector: resolvedPackage.version,
                    type: 'version',
                };
            }
        }
        await Promise.all(postponedResolutionsQueue.map((postponedResolution) => postponedResolution(newPreferredVersions)));
    }
    return pkgAddresses;
}
exports.default = resolveDependencies;
function getDepsToResolve(wantedDependencies, wantedLockfile, options) {
    const resolvedDependencies = options.resolvedDependencies || {};
    const preferedDependencies = options.preferedDependencies || {};
    const extendedWantedDeps = [];
    // The only reason we resolve children in case the package depends on peers
    // is to get information about the existing dependencies, so that they can
    // be merged with the resolved peers.
    const proceedAll = options.proceed || options.parentDependsOnPeers || options.updateLockfile;
    let allPeers = new Set();
    for (const wantedDependency of wantedDependencies) {
        let reference = wantedDependency.alias && resolvedDependencies[wantedDependency.alias];
        let proceed = proceedAll;
        // If dependencies that were used by the previous version of the package
        // satisfy the newer version's requirements, then pnpm tries to keep
        // the previous dependency.
        // So for example, if foo@1.0.0 had bar@1.0.0 as a dependency
        // and foo was updated to 1.1.0 which depends on bar ^1.0.0
        // then bar@1.0.0 can be reused for foo@1.1.0
        if (!reference && wantedDependency.alias && semver.validRange(wantedDependency.pref) !== null && // tslint:disable-line
            preferedDependencies[wantedDependency.alias] &&
            preferedSatisfiesWanted(preferedDependencies[wantedDependency.alias], wantedDependency, wantedLockfile, {
                prefix: options.prefix,
            })) {
            proceed = true;
            reference = preferedDependencies[wantedDependency.alias];
        }
        const infoFromLockfile = getInfoFromLockfile(wantedLockfile, options.registries, reference, wantedDependency.alias);
        if (!proceedAll &&
            infoFromLockfile &&
            infoFromLockfile.dependencyLockfile &&
            infoFromLockfile.dependencyLockfile.peerDependencies) {
            proceed = true;
            Object.keys(infoFromLockfile.dependencyLockfile.peerDependencies).forEach((peerName) => {
                allPeers.add(peerName);
            });
        }
        extendedWantedDeps.push({
            infoFromLockfile,
            proceed,
            wantedDependency,
        });
    }
    if (!proceedAll && allPeers.size) {
        for (const extendedWantedDep of extendedWantedDeps) {
            if (!extendedWantedDep.proceed && allPeers.has(extendedWantedDep.wantedDependency.alias)) {
                extendedWantedDep.proceed = true;
            }
        }
    }
    return extendedWantedDeps;
}
function preferedSatisfiesWanted(preferredRef, wantedDep, lockfile, opts) {
    const relDepPath = dp.refToRelative(preferredRef, wantedDep.alias);
    if (relDepPath === null)
        return false;
    const pkgSnapshot = lockfile.packages && lockfile.packages[relDepPath];
    if (!pkgSnapshot) {
        logger_1.default.warn({
            message: `Could not find preferred package ${relDepPath} in lockfile`,
            prefix: opts.prefix,
        });
        return false;
    }
    const { version } = lockfile_utils_1.nameVerFromPkgSnapshot(relDepPath, pkgSnapshot);
    return semver.satisfies(version, wantedDep.pref, true);
}
function getInfoFromLockfile(lockfile, registries, reference, pkgName) {
    if (!reference || !pkgName) {
        return null;
    }
    const relDepPath = dp.refToRelative(reference, pkgName);
    if (!relDepPath) {
        return null;
    }
    const dependencyLockfile = lockfile.packages && lockfile.packages[relDepPath];
    if (dependencyLockfile) {
        if (dependencyLockfile.peerDependencies && dependencyLockfile.dependencies) {
            // This is done to guarantee that the dependency will be relinked with the
            // up-to-date peer dependencies
            // Covered by test: "peer dependency is grouped with dependency when peer is resolved not from a top dependency"
            R.keys(dependencyLockfile.peerDependencies).forEach((peer) => {
                delete dependencyLockfile.dependencies[peer];
            });
        }
        const depPath = dp.resolve(registries, relDepPath);
        return {
            currentResolution: lockfile_utils_1.pkgSnapshotToResolution(relDepPath, dependencyLockfile, registries),
            dependencyLockfile,
            depPath,
            optionalDependencyNames: R.keys(dependencyLockfile.optionalDependencies),
            pkgId: lockfile_utils_1.packageIdFromSnapshot(relDepPath, dependencyLockfile, registries),
            relDepPath,
            resolvedDependencies: {
                ...dependencyLockfile.dependencies,
                ...dependencyLockfile.optionalDependencies,
            },
        };
    }
    else {
        return {
            pkgId: dp.tryGetPackageId(registries, relDepPath) || relDepPath,
            relDepPath,
        };
    }
}
async function resolveDependency(wantedDependency, ctx, options) {
    const update = Boolean(options.update ||
        options.localPackages &&
            wantedDepIsLocallyAvailable_1.default(options.localPackages, wantedDependency, { defaultTag: ctx.defaultTag, registry: ctx.registries.default }));
    const proceed = update || options.proceed || !options.currentResolution;
    const parentIsInstallable = options.parentIsInstallable === undefined || options.parentIsInstallable;
    const currentLockfileContainsTheDep = options.relDepPath ? Boolean(ctx.currentLockfile.packages && ctx.currentLockfile.packages[options.relDepPath]) : undefined;
    const depIsLinked = Boolean(options.depPath &&
        // if package is not in `node_modules/.pnpm-lock.yaml`
        // we can safely assume that it doesn't exist in `node_modules`
        currentLockfileContainsTheDep &&
        options.relDepPath && options.dependencyLockfile &&
        await exists(path.join(ctx.virtualStoreDir, `${options.depPath}/node_modules/${lockfile_utils_1.nameVerFromPkgSnapshot(options.relDepPath, options.dependencyLockfile).name}/package.json`)) &&
        (options.currentDepth > 0 || wantedDependency.alias && await exists(path.join(ctx.modulesDir, wantedDependency.alias))));
    if (!proceed && depIsLinked) {
        return null;
    }
    let pkgResponse;
    try {
        pkgResponse = await ctx.storeController.requestPackage(wantedDependency, {
            currentPackageId: options.pkgId,
            currentResolution: options.currentResolution,
            defaultTag: ctx.defaultTag,
            downloadPriority: -options.currentDepth,
            importerDir: ctx.prefix,
            localPackages: options.localPackages,
            lockfileDir: ctx.lockfileDir,
            preferredVersions: options.preferredVersions,
            registry: wantedDependency.alias && utils_1.pickRegistryForPackage(ctx.registries, wantedDependency.alias) || ctx.registries.default,
            sideEffectsCache: ctx.sideEffectsCache,
            // Unfortunately, even when run with --lockfile-only, we need the *real* package.json
            // so fetching of the tarball cannot be ever avoided. Related issue: https://github.com/pnpm/pnpm/issues/1176
            skipFetch: false,
            update,
        });
    }
    catch (err) {
        if (wantedDependency.optional) {
            core_loggers_1.skippedOptionalDependencyLogger.debug({
                details: err.toString(),
                package: {
                    name: wantedDependency.alias,
                    pref: wantedDependency.pref,
                    version: wantedDependency.alias ? wantedDependency.pref : undefined,
                },
                parents: nodeIdToParents(utils_1.createNodeId(options.parentNodeId, 'fake-id'), ctx.resolvedPackagesByPackageId),
                prefix: ctx.prefix,
                reason: 'resolution_failure',
            });
            return null;
        }
        throw err;
    }
    dependencyResolvedLogger.debug({
        resolution: pkgResponse.body.id,
        wanted: {
            dependentId: options.dependentId,
            name: wantedDependency.alias,
            rawSpec: wantedDependency.pref,
        },
    });
    pkgResponse.body.id = encodePkgId_1.default(pkgResponse.body.id);
    if (!options.parentDependsOnPeer && !pkgResponse.body.updated &&
        options.currentDepth === options.updateDepth &&
        currentLockfileContainsTheDep && !ctx.force) {
        return null;
    }
    if (pkgResponse.body.isLocal) {
        const manifest = pkgResponse.body.manifest || await pkgResponse.bundledManifest(); // tslint:disable-line:no-string-literal
        if (options.currentDepth > 0) {
            logger_1.default.warn({
                message: `Ignoring file dependency because it is not a root dependency ${wantedDependency}`,
                prefix: ctx.prefix,
            });
            return null;
        }
        else {
            return {
                alias: wantedDependency.alias || manifest.name,
                dev: wantedDependency.dev,
                id: pkgResponse.body.id,
                isLinkedDependency: true,
                name: manifest.name,
                normalizedPref: pkgResponse.body.normalizedPref,
                optional: wantedDependency.optional,
                resolution: pkgResponse.body.resolution,
                version: manifest.version,
            };
        }
    }
    // For the root dependency dependentId will be undefined,
    // that's why checking it
    if (options.dependentId && utils_1.nodeIdContainsSequence(options.parentNodeId, options.dependentId, pkgResponse.body.id)) {
        return null;
    }
    let pkg;
    let useManifestInfoFromLockfile = false;
    let prepare;
    let hasBin;
    if (!options.update && options.dependencyLockfile && options.relDepPath &&
        !pkgResponse.body.updated &&
        // peerDependencies field is also used for transitive peer dependencies which should not be linked
        // That's why we cannot omit reading package.json of such dependencies.
        // This can be removed if we implement something like peerDependenciesMeta.transitive: true
        !options.dependencyLockfile.peerDependencies) {
        useManifestInfoFromLockfile = true;
        prepare = options.dependencyLockfile.prepare === true;
        hasBin = options.dependencyLockfile.hasBin === true;
        pkg = Object.assign(lockfile_utils_1.nameVerFromPkgSnapshot(options.relDepPath, options.dependencyLockfile), options.dependencyLockfile);
    }
    else {
        // tslint:disable:no-string-literal
        pkg = ctx.readPackageHook
            ? ctx.readPackageHook(pkgResponse.body.manifest || await pkgResponse.bundledManifest())
            : pkgResponse.body.manifest || await pkgResponse.bundledManifest();
        prepare = Boolean(pkgResponse.body.resolvedVia === 'git-repository' &&
            pkg.scripts && typeof pkg.scripts.prepare === 'string');
        if (options.dependencyLockfile && options.dependencyLockfile.deprecated &&
            !pkgResponse.body.updated && !pkg.deprecated) {
            pkg.deprecated = options.dependencyLockfile.deprecated;
        }
        hasBin = Boolean(pkg.bin && !R.isEmpty(pkg.bin) || pkg.directories && pkg.directories.bin);
        // tslint:enable:no-string-literal
    }
    if (!pkg.name) { // TODO: don't fail on optional dependencies
        throw new error_1.default('MISSING_PACKAGE_NAME', `Can't install ${wantedDependency.pref}: Missing package name`);
    }
    if (options.currentDepth === 0 && pkgResponse.body.latest && pkgResponse.body.latest !== pkg.version) {
        ctx.outdatedDependencies[pkgResponse.body.id] = pkgResponse.body.latest;
    }
    if (pkg.deprecated) {
        core_loggers_1.deprecationLogger.debug({
            deprecated: pkg.deprecated,
            depth: options.currentDepth,
            pkgId: pkgResponse.body.id,
            pkgName: pkg.name,
            pkgVersion: pkg.version,
            prefix: ctx.prefix,
        });
    }
    // using colon as it will never be used inside a package ID
    const nodeId = utils_1.createNodeId(options.parentNodeId, pkgResponse.body.id);
    const currentIsInstallable = (ctx.force ||
        package_is_installable_1.default(pkgResponse.body.id, pkg, {
            engineStrict: ctx.engineStrict,
            lockfileDir: ctx.lockfileDir,
            nodeVersion: ctx.nodeVersion,
            optional: wantedDependency.optional,
            pnpmVersion: ctx.pnpmVersion,
        }));
    if (currentIsInstallable !== true || !parentIsInstallable) {
        ctx.skipped.add(pkgResponse.body.id);
    }
    const installable = parentIsInstallable && currentIsInstallable !== false;
    const isNew = !ctx.resolvedPackagesByPackageId[pkgResponse.body.id];
    if (isNew) {
        core_loggers_1.progressLogger.debug({
            packageId: pkgResponse.body.id,
            requester: ctx.lockfileDir,
            status: 'resolved',
        });
        if (pkgResponse.files) {
            pkgResponse.files()
                .then((fetchResult) => {
                core_loggers_1.progressLogger.debug({
                    packageId: pkgResponse.body.id,
                    requester: ctx.lockfileDir,
                    status: fetchResult.fromStore
                        ? 'found_in_store' : 'fetched',
                });
            })
                .catch(() => {
                // Ignore
            });
        }
        ctx.resolvedPackagesByPackageId[pkgResponse.body.id] = getResolvedPackage({
            dependencyLockfile: options.dependencyLockfile,
            force: ctx.force,
            hasBin,
            pkg,
            pkgResponse,
            prepare,
            wantedDependency,
        });
    }
    else {
        ctx.resolvedPackagesByPackageId[pkgResponse.body.id].prod = ctx.resolvedPackagesByPackageId[pkgResponse.body.id].prod || !wantedDependency.dev && !wantedDependency.optional;
        ctx.resolvedPackagesByPackageId[pkgResponse.body.id].dev = ctx.resolvedPackagesByPackageId[pkgResponse.body.id].dev || wantedDependency.dev;
        ctx.resolvedPackagesByPackageId[pkgResponse.body.id].optional = ctx.resolvedPackagesByPackageId[pkgResponse.body.id].optional && wantedDependency.optional;
        ctx.pendingNodes.push({
            alias: wantedDependency.alias || pkg.name,
            depth: options.currentDepth,
            installable,
            nodeId,
            resolvedPackage: ctx.resolvedPackagesByPackageId[pkgResponse.body.id],
        });
    }
    return {
        alias: wantedDependency.alias || pkg.name,
        depIsLinked,
        isNew,
        nodeId,
        normalizedPref: options.currentDepth === 0 ? pkgResponse.body.normalizedPref : undefined,
        pkgId: pkgResponse.body.id,
        // Next fields are actually only needed when isNew = true
        installable,
        pkg,
        updated: pkgResponse.body.updated,
        useManifestInfoFromLockfile,
    };
}
function getResolvedPackage(options) {
    const peerDependencies = peerDependenciesWithoutOwn(options.pkg);
    return {
        additionalInfo: {
            bundledDependencies: options.pkg.bundledDependencies,
            bundleDependencies: options.pkg.bundleDependencies,
            cpu: options.pkg.cpu,
            deprecated: options.pkg.deprecated,
            engines: options.pkg.engines,
            os: options.pkg.os,
            peerDependencies,
            peerDependenciesMeta: options.pkg.peerDependenciesMeta,
        },
        dev: options.wantedDependency.dev,
        engineCache: !options.force && options.pkgResponse.body.cacheByEngine && options.pkgResponse.body.cacheByEngine[ENGINE_NAME],
        fetchingBundledManifest: options.pkgResponse.bundledManifest,
        fetchingFiles: options.pkgResponse.files,
        finishing: options.pkgResponse.finishing,
        hasBin: options.hasBin,
        hasBundledDependencies: !!(options.pkg.bundledDependencies || options.pkg.bundleDependencies),
        id: options.pkgResponse.body.id,
        independent: (options.pkg.dependencies === undefined || R.isEmpty(options.pkg.dependencies)) &&
            (options.pkg.optionalDependencies === undefined || R.isEmpty(options.pkg.optionalDependencies)) &&
            (options.pkg.peerDependencies === undefined || R.isEmpty(options.pkg.peerDependencies)),
        name: options.pkg.name,
        optional: options.wantedDependency.optional,
        optionalDependencies: new Set(R.keys(options.pkg.optionalDependencies)),
        path: options.pkgResponse.body.inStoreLocation,
        peerDependencies: peerDependencies || {},
        prepare: options.prepare,
        prod: !options.wantedDependency.dev && !options.wantedDependency.optional,
        requiresBuild: options.dependencyLockfile && Boolean(options.dependencyLockfile.requiresBuild),
        resolution: options.pkgResponse.body.resolution,
        version: options.pkg.version,
    };
}
function peerDependenciesWithoutOwn(pkg) {
    if (!pkg.peerDependencies && !pkg.peerDependenciesMeta)
        return pkg.peerDependencies;
    const ownDeps = new Set(R.keys(pkg.dependencies).concat(R.keys(pkg.optionalDependencies)));
    const result = {};
    if (pkg.peerDependencies) {
        for (const peer of Object.keys(pkg.peerDependencies)) {
            if (ownDeps.has(peer))
                continue;
            result[peer] = pkg.peerDependencies[peer];
        }
    }
    if (pkg.peerDependenciesMeta) {
        for (const peer of Object.keys(pkg.peerDependenciesMeta)) {
            if (ownDeps.has(peer) || result[peer] || pkg.peerDependenciesMeta[peer].optional !== true)
                continue;
            result[peer] = '*';
        }
    }
    if (R.isEmpty(result))
        return undefined;
    return result;
}
function getWantedDependencies(pkg, opts) {
    let deps = getNonDevWantedDependencies_1.default(pkg);
    if (!deps.length && opts.resolvedDependencies && opts.useManifestInfoFromLockfile) {
        const optionalDependencyNames = opts.optionalDependencyNames || [];
        deps = Object.keys(opts.resolvedDependencies)
            .map((depName) => ({
            alias: depName,
            optional: optionalDependencyNames.includes(depName),
        }));
    }
    return deps;
}
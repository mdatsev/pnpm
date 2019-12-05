"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const check_package_1 = require("@pnpm/check-package");
const core_loggers_1 = require("@pnpm/core-loggers");
const logger_1 = require("@pnpm/logger");
const pkgid_to_filename_1 = require("@pnpm/pkgid-to-filename");
const read_package_json_1 = require("@pnpm/read-package-json");
const rimraf = require("@zkochan/rimraf");
const loadJsonFile = require("load-json-file");
const makeDir = require("make-dir");
const fs = require("mz/fs");
const p_queue_1 = require("p-queue");
const path = require("path");
const exists = require("path-exists");
const pShare = require("promise-share");
const R = require("ramda");
const renameOverwrite = require("rename-overwrite");
const ssri = require("ssri");
const symlinkDir = require("symlink-dir");
const writeJsonFile = require("write-json-file");
const TARBALL_INTEGRITY_FILENAME = 'tarball-integrity';
const packageRequestLogger = logger_1.default('package-requester');
const pickBundledManifest = R.pick([
    'bin',
    'bundledDependencies',
    'bundleDependencies',
    'dependencies',
    'directories',
    'engines',
    'name',
    'optionalDependencies',
    'os',
    'peerDependencies',
    'peerDependenciesMeta',
    'scripts',
    'version'
]);
function default_1(resolve, fetchers, opts) {
    opts = opts || {};
    const networkConcurrency = opts.networkConcurrency || 16;
    const requestsQueue = new p_queue_1.default({
        concurrency: networkConcurrency,
    });
    requestsQueue['counter'] = 0; // tslint:disable-line
    requestsQueue['concurrency'] = networkConcurrency; // tslint:disable-line
    const fetch = fetcher.bind(null, fetchers);
    const fetchPackageToStore = fetchToStore.bind(null, {
        fetch,
        fetchingLocker: new Map(),
        requestsQueue,
        storeDir: opts.storeDir,
        storeIndex: opts.storeIndex,
        verifyStoreIntegrity: opts.verifyStoreIntegrity,
    });
    const requestPackage = resolveAndFetch.bind(null, {
        fetchPackageToStore,
        requestsQueue,
        resolve,
        storeDir: opts.storeDir,
        verifyStoreIntegrity: opts.verifyStoreIntegrity,
    });
    return Object.assign(requestPackage, { fetchPackageToStore, requestPackage });
}
exports.default = default_1;
async function resolveAndFetch(ctx, wantedDependency, options) {
    var _a, _b, _c;
    try {
        let latest;
        let manifest;
        let normalizedPref;
        let resolution = options.currentResolution;
        let pkgId = options.currentPackageId;
        const skipResolution = false; //resolution && !options.update
        let forceFetch = false;
        let updated = false;
        let resolvedVia;
        // When fetching is skipped, resolution cannot be skipped.
        // We need the package's manifest when doing `lockfile-only` installs.
        // When we don't fetch, the only way to get the package's manifest is via resolving it.
        //
        // The resolution step is never skipped for local dependencies.
        try {
            if (!skipResolution || options.skipFetch || ((_a = pkgId) === null || _a === void 0 ? void 0 : _a.startsWith('file:'))) {
                const resolveResult = await ctx.requestsQueue.add(() => ctx.resolve(wantedDependency, {
                    defaultTag: options.defaultTag,
                    importerDir: options.importerDir,
                    localPackages: options.localPackages,
                    lockfileDir: options.lockfileDir,
                    preferredVersions: options.preferredVersions,
                    registry: options.registry,
                }), { priority: options.downloadPriority });
                manifest = resolveResult.manifest;
                latest = resolveResult.latest;
                resolvedVia = resolveResult.resolvedVia;
                // If the integrity of a local tarball dependency has changed,
                // the local tarball should be unpacked, so a fetch to the store should be forced
                forceFetch = Boolean(options.currentResolution && ((_b = pkgId) === null || _b === void 0 ? void 0 : _b.startsWith('file:')) &&
                    options.currentResolution['integrity'] !== resolveResult.resolution['integrity']);
                if (!skipResolution || forceFetch) {
                    updated = pkgId !== resolveResult.id || !resolution || forceFetch;
                    // Keep the lockfile resolution when possible
                    // to keep the original shasum.
                    if (updated) {
                        resolution = resolveResult.resolution;
                    }
                    pkgId = resolveResult.id;
                    normalizedPref = resolveResult.normalizedPref;
                }
            }
        }
        catch (e) {
            console.error("Resolve error: ", e);
        }
        const id = pkgId;
        if (resolution.type === 'directory') {
            if (!manifest) {
                throw new Error(`Couldn't read package.json of local dependency ${wantedDependency.alias ? wantedDependency.alias + '@' : ''}${wantedDependency.pref}`);
            }
            return {
                body: {
                    id,
                    isLocal: true,
                    manifest,
                    normalizedPref,
                    resolution: resolution,
                    resolvedVia,
                    updated,
                },
            };
        }
        // We can skip fetching the package only if the manifest
        // is present after resolution
        if (options.skipFetch && manifest) {
            return {
                body: {
                    cacheByEngine: options.sideEffectsCache ? await getCacheByEngine(ctx.storeDir, id) : new Map(),
                    id,
                    inStoreLocation: path.join(ctx.storeDir, pkgid_to_filename_1.default(id, options.lockfileDir)),
                    isLocal: false,
                    latest,
                    manifest,
                    normalizedPref,
                    resolution,
                    resolvedVia,
                    updated,
                },
            };
        }
        const fetchResult = ctx.fetchPackageToStore({
            fetchRawManifest: updated || !manifest,
            force: forceFetch,
            lockfileDir: options.lockfileDir,
            pkgId: id,
            pkgName: (_c = manifest) === null || _c === void 0 ? void 0 : _c.name,
            resolution: resolution,
        });
        return {
            body: {
                cacheByEngine: options.sideEffectsCache ? await getCacheByEngine(ctx.storeDir, id) : new Map(),
                id,
                inStoreLocation: fetchResult.inStoreLocation,
                isLocal: false,
                latest,
                manifest,
                normalizedPref,
                resolution,
                resolvedVia,
                updated,
            },
            bundledManifest: fetchResult.bundledManifest,
            files: fetchResult.files,
            finishing: fetchResult.finishing,
        };
    }
    catch (err) {
        throw err;
    }
}
function fetchToStore(ctx, opts) {
    const targetRelative = pkgid_to_filename_1.default(opts.pkgId, opts.lockfileDir);
    const target = path.join(ctx.storeDir, targetRelative);
    if (!ctx.fetchingLocker.has(opts.pkgId)) {
        const bundledManifest = differed();
        const files = differed();
        const finishing = differed();
        doFetchToStore(bundledManifest, files, finishing); // tslint:disable-line
        if (opts.fetchRawManifest) {
            ctx.fetchingLocker.set(opts.pkgId, {
                bundledManifest: removeKeyOnFail(bundledManifest.promise),
                files: removeKeyOnFail(files.promise),
                finishing: removeKeyOnFail(finishing.promise),
                inStoreLocation: target,
            });
        }
        else {
            ctx.fetchingLocker.set(opts.pkgId, {
                files: removeKeyOnFail(files.promise),
                finishing: removeKeyOnFail(finishing.promise),
                inStoreLocation: target,
            });
        }
        // When files resolves, the cached result has to set fromStore to true, without
        // affecting previous invocations: so we need to replace the cache.
        //
        // Changing the value of fromStore is needed for correct reporting of `pnpm server`.
        // Otherwise, if a package was not in store when the server started, it will be always
        // reported as "downloaded" instead of "reused".
        files.promise.then(({ filenames, fromStore }) => {
            // If it's already in the store, we don't need to update the cache
            if (fromStore) {
                return;
            }
            const tmp = ctx.fetchingLocker.get(opts.pkgId);
            // If fetching failed then it was removed from the cache.
            // It is OK. In that case there is no need to update it.
            if (!tmp)
                return;
            ctx.fetchingLocker.set(opts.pkgId, {
                bundledManifest: tmp.bundledManifest,
                files: Promise.resolve({
                    filenames,
                    fromStore: true,
                }),
                finishing: tmp.finishing,
                inStoreLocation: tmp.inStoreLocation,
            });
        })
            .catch(() => {
            ctx.fetchingLocker.delete(opts.pkgId);
        });
    }
    const result = ctx.fetchingLocker.get(opts.pkgId);
    if (opts.fetchRawManifest && !result.bundledManifest) {
        result.bundledManifest = removeKeyOnFail(result.files.then(() => readBundledManifest(path.join(result.inStoreLocation, 'package'))));
    }
    return {
        bundledManifest: result.bundledManifest ? pShare(result.bundledManifest) : undefined,
        files: pShare(result.files),
        finishing: pShare(result.finishing),
        inStoreLocation: result.inStoreLocation,
    };
    function removeKeyOnFail(p) {
        return p.catch((err) => {
            ctx.fetchingLocker.delete(opts.pkgId);
            throw err;
        });
    }
    async function doFetchToStore(bundledManifest, files, finishing) {
        try {
            const isLocalTarballDep = opts.pkgId.startsWith('file:');
            const linkToUnpacked = path.join(target, 'package');
            // We can safely assume that if there is no data about the package in `store.json` then
            // it is not in the store yet.
            // In case there is record about the package in `store.json`, we check it in the file system just in case
            const targetExists = ctx.storeIndex[targetRelative] && await exists(path.join(linkToUnpacked, 'package.json'));
            if (!opts.force && targetExists &&
                (isLocalTarballDep === false ||
                    await tarballIsUpToDate(opts.resolution, target, opts.lockfileDir) // tslint:disable-line
                )) {
                // if target exists and it wasn't modified, then no need to refetch it
                const satisfiedIntegrity = ctx.verifyStoreIntegrity
                    ? await check_package_1.default(linkToUnpacked)
                    : await loadJsonFile(path.join(path.dirname(linkToUnpacked), 'integrity.json'));
                if (satisfiedIntegrity) {
                    files.resolve({
                        filenames: Object.keys(satisfiedIntegrity).filter((f) => !satisfiedIntegrity[f].isDir),
                        fromStore: true,
                    });
                    if (opts.fetchRawManifest) {
                        readBundledManifest(linkToUnpacked)
                            .then(bundledManifest.resolve)
                            .catch(bundledManifest.reject);
                    }
                    finishing.resolve(undefined);
                    return;
                }
                packageRequestLogger.warn({
                    message: `Refetching ${target} to store. It was either modified or had no integrity checksums`,
                    prefix: opts.lockfileDir,
                });
            }
            // We fetch into targetStage directory first and then fs.rename() it to the
            // target directory.
            let filesIndex;
            let tempLocation;
            await Promise.all([
                (async () => {
                    // Tarballs are requested first because they are bigger than metadata files.
                    // However, when one line is left available, allow it to be picked up by a metadata request.
                    // This is done in order to avoid situations when tarballs are downloaded in chunks
                    // As much tarballs should be downloaded simultaneously as possible.
                    const priority = (++ctx.requestsQueue['counter'] % ctx.requestsQueue['concurrency'] === 0 ? -1 : 1) * 1000; // tslint:disable-line
                    const fetchedPackage = await ctx.requestsQueue.add(() => ctx.fetch(opts.pkgId, opts.resolution, target, {
                        cachedTarballLocation: path.join(ctx.storeDir, opts.pkgId, 'packed.tgz'),
                        lockfileDir: opts.lockfileDir,
                        onProgress: (downloaded) => {
                            core_loggers_1.fetchingProgressLogger.debug({
                                downloaded,
                                packageId: opts.pkgId,
                                status: 'in_progress',
                            });
                        },
                        onStart: (size, attempt) => {
                            core_loggers_1.fetchingProgressLogger.debug({
                                attempt,
                                packageId: opts.pkgId,
                                size,
                                status: 'started',
                            });
                        },
                    }), { priority });
                    filesIndex = fetchedPackage.filesIndex;
                    tempLocation = fetchedPackage.tempLocation;
                })(),
                // removing only the folder with the unpacked files
                // not touching tarball and integrity.json
                targetExists && await rimraf(path.join(target, 'node_modules')),
            ]);
            // Ideally, files wouldn't care about when integrity is calculated.
            // However, we can only rename the temp folder once we know the package name.
            // And we cannot rename the temp folder till we're calculating integrities.
            if (ctx.verifyStoreIntegrity) {
                const fileIntegrities = await Promise.all(Object.keys(filesIndex)
                    .map((filename) => filesIndex[filename].generatingIntegrity
                    .then((fileIntegrity) => ({
                    [filename]: {
                        integrity: fileIntegrity,
                        size: filesIndex[filename].size,
                    },
                }))));
                const integrity = fileIntegrities
                    .reduce((acc, info) => {
                    Object.assign(acc, info);
                    return acc;
                }, {});
                await writeJsonFile(path.join(target, 'integrity.json'), integrity, { indent: undefined });
            }
            else {
                // TODO: save only filename: {size}
                await writeJsonFile(path.join(target, 'integrity.json'), filesIndex, { indent: undefined });
            }
            finishing.resolve(undefined);
            let pkgName = opts.pkgName;
            if (!pkgName || opts.fetchRawManifest) {
                const manifest = await read_package_json_1.fromDir(tempLocation);
                bundledManifest.resolve(pickBundledManifest(manifest));
                if (!pkgName) {
                    pkgName = manifest.name;
                }
            }
            const unpacked = path.join(target, 'node_modules', pkgName);
            await makeDir(path.dirname(unpacked));
            // rename(oldPath, newPath) is an atomic operation, so we do it at the
            // end
            await renameOverwrite(tempLocation, unpacked);
            await symlinkDir(unpacked, linkToUnpacked);
            if (isLocalTarballDep && opts.resolution['integrity']) { // tslint:disable-line:no-string-literal
                await fs.writeFile(path.join(target, TARBALL_INTEGRITY_FILENAME), opts.resolution['integrity'], 'utf8'); // tslint:disable-line:no-string-literal
            }
            ctx.storeIndex[targetRelative] = ctx.storeIndex[targetRelative] || [];
            files.resolve({
                filenames: Object.keys(filesIndex).filter((f) => !filesIndex[f].isDir),
                fromStore: false,
            });
        }
        catch (err) {
            files.reject(err);
            if (opts.fetchRawManifest) {
                bundledManifest.reject(err);
            }
        }
    }
}
async function readBundledManifest(dir) {
    return pickBundledManifest(await read_package_json_1.fromDir(dir));
}
async function tarballIsUpToDate(resolution, pkgInStoreLocation, lockfileDir) {
    let currentIntegrity;
    try {
        currentIntegrity = (await fs.readFile(path.join(pkgInStoreLocation, TARBALL_INTEGRITY_FILENAME), 'utf8'));
    }
    catch (err) {
        return false;
    }
    if (resolution.integrity && currentIntegrity !== resolution.integrity)
        return false;
    const tarball = path.join(lockfileDir, resolution.tarball.slice(5));
    const tarballStream = fs.createReadStream(tarball);
    try {
        return Boolean(await ssri.checkStream(tarballStream, currentIntegrity));
    }
    catch (err) {
        return false;
    }
}
// tslint:disable-next-line
function noop() { }
function differed() {
    let pResolve = noop;
    let pReject = noop;
    const promise = new Promise((resolve, reject) => {
        pResolve = resolve;
        pReject = reject;
    });
    return {
        promise,
        reject: pReject,
        resolve: pResolve,
    };
}
async function fetcher(fetcherByHostingType, packageId, resolution, target, opts) {
    const fetch = fetcherByHostingType[resolution.type || 'tarball'];
    if (!fetch) {
        throw new Error(`Fetching for dependency type "${resolution.type}" is not supported`);
    }
    try {
        return await fetch(resolution, target, opts);
    }
    catch (err) {
        packageRequestLogger.warn({
            message: `Fetching ${packageId} failed!`,
            prefix: opts.lockfileDir,
        });
        throw err;
    }
}
// TODO: cover with tests
async function getCacheByEngine(storeDir, id) {
    const map = new Map();
    const cacheRoot = path.join(storeDir, id, 'side_effects');
    if (!await fs.exists(cacheRoot)) {
        return map;
    }
    const dirContents = (await fs.readdir(cacheRoot)).map((content) => path.join(cacheRoot, content));
    await Promise.all(dirContents.map(async (dir) => {
        if (!(await fs.lstat(dir)).isDirectory()) {
            return;
        }
        const engineName = path.basename(dir);
        map[engineName] = path.join(dir, 'package');
    }));
    return map;
}
exports.getCacheByEngine = getCacheByEngine;

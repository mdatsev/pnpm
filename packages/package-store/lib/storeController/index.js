"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_locker_1 = require("@pnpm/fs-locker");
const logger_1 = require("@pnpm/logger");
const package_requester_1 = require("@pnpm/package-requester");
const pkgid_to_filename_1 = require("@pnpm/pkgid-to-filename");
const rimraf = require("@zkochan/rimraf");
const pFilter = require("p-filter");
const p_limit_1 = require("p-limit");
const path = require("path");
const exists = require("path-exists");
const R = require("ramda");
const storeIndex_1 = require("../fs/storeIndex");
const createImportPackage_1 = require("./createImportPackage");
async function default_1(resolve, fetchers, initOpts) {
    const storeDir = initOpts.storeDir;
    const unlock = initOpts.locks
        ? await fs_locker_1.default(initOpts.storeDir, {
            locks: initOpts.locks,
            stale: initOpts.lockStaleDuration || 60 * 1000,
            whenLocked: () => logger_1.globalWarn(`waiting for the store at "${initOpts.storeDir}" to be unlocked...`),
        })
        : null;
    const storeIndex = await storeIndex_1.read(initOpts.storeDir) || {};
    const packageRequester = package_requester_1.default(resolve, fetchers, {
        networkConcurrency: initOpts.networkConcurrency,
        storeDir: initOpts.storeDir,
        storeIndex,
        verifyStoreIntegrity: initOpts.verifyStoreIntegrity,
    });
    return {
        close: unlock ? async () => { await unlock(); } : () => Promise.resolve(undefined),
        closeSync: unlock ? () => unlock.sync() : () => undefined,
        fetchPackage: packageRequester.fetchPackageToStore,
        findPackageUsages,
        getPackageLocation,
        importPackage: createImportPackage_1.default(initOpts.packageImportMethod),
        prune,
        requestPackage: packageRequester.requestPackage,
        saveState: storeIndex_1.save.bind(null, initOpts.storeDir, storeIndex),
        saveStateSync: storeIndex_1.saveSync.bind(null, initOpts.storeDir, storeIndex),
        updateConnections: async (prefix, opts) => {
            await removeDependencies(prefix, opts.removeDependencies, { prune: opts.prune });
            await addDependencies(prefix, opts.addDependencies);
        },
        upload,
    };
    async function getPackageLocation(packageId, packageName, opts) {
        if (opts.targetEngine) {
            const sideEffectsCacheLocation = (await package_requester_1.getCacheByEngine(initOpts.storeDir, packageId))[opts.targetEngine];
            if (sideEffectsCacheLocation) {
                return {
                    dir: sideEffectsCacheLocation,
                    isBuilt: true,
                };
            }
        }
        return {
            dir: path.join(initOpts.storeDir, pkgid_to_filename_1.default(packageId, opts.lockfileDir), 'node_modules', packageName),
            isBuilt: false,
        };
    }
    async function removeDependencies(prefix, dependencyPkgIds, opts) {
        await Promise.all(dependencyPkgIds.map(async (notDependent) => {
            if (storeIndex[notDependent]) {
                storeIndex[notDependent].splice(storeIndex[notDependent].indexOf(prefix), 1);
                if (opts.prune && !storeIndex[notDependent].length) {
                    delete storeIndex[notDependent];
                    await rimraf(path.join(storeDir, notDependent));
                }
            }
        }));
    }
    async function addDependencies(prefix, dependencyPkgIds) {
        dependencyPkgIds.forEach((newDependent) => {
            storeIndex[newDependent] = storeIndex[newDependent] || [];
            if (!storeIndex[newDependent].includes(prefix)) {
                storeIndex[newDependent].push(prefix);
            }
        });
    }
    async function prune() {
        const removedProjects = await getRemovedProject(storeIndex);
        for (const pkgId in storeIndex) {
            if (storeIndex.hasOwnProperty(pkgId)) {
                storeIndex[pkgId] = R.difference(storeIndex[pkgId], removedProjects);
                if (!storeIndex[pkgId].length) {
                    delete storeIndex[pkgId];
                    await rimraf(path.join(storeDir, pkgId));
                    logger_1.globalInfo(`- ${pkgId}`);
                }
            }
        }
    }
    async function findPackageUsages(searchQueries) {
        const results = {};
        // FIXME Inefficient looping over all packages. Don't think there's a better way.
        // Note we can't directly resolve packages because user may not specify package version
        Object.keys(storeIndex).forEach(packageId => {
            searchQueries
                .filter((searchQuery) => packageId.indexOf(searchQuery) > -1)
                .forEach((searchQuery) => {
                results[searchQuery] = results[searchQuery] || [];
                results[searchQuery].push({
                    packageId,
                    usages: storeIndex[packageId],
                });
            });
        });
        return results;
    }
    async function upload(builtPkgLocation, opts) {
        const cachePath = path.join(storeDir, opts.packageId, 'side_effects', opts.engine, 'package');
        // TODO calculate integrity.json here
        const filenames = [];
        await createImportPackage_1.copyPkg(builtPkgLocation, cachePath, { filesResponse: { fromStore: true, filenames }, force: true });
    }
}
exports.default = default_1;
const limitExistsCheck = p_limit_1.default(10);
async function getRemovedProject(storeIndex) {
    const allProjects = R.uniq(R.unnest(Object.values(storeIndex)));
    return pFilter(allProjects, (projectPath) => limitExistsCheck(async () => {
        const modulesDir = path.join(projectPath, 'node_modules');
        return !await exists(modulesDir);
    }));
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_loggers_1 = require("@pnpm/core-loggers");
const filter_lockfile_1 = require("@pnpm/filter-lockfile");
const lockfile_utils_1 = require("@pnpm/lockfile-utils");
const logger_1 = require("@pnpm/logger");
const read_modules_dir_1 = require("@pnpm/read-modules-dir");
const types_1 = require("@pnpm/types");
const dp = require("dependency-path");
const vacuumCB = require("fs-vacuum");
const path = require("path");
const R = require("ramda");
const util_1 = require("util");
const removeDirectDependency_1 = require("./removeDirectDependency");
const vacuum = util_1.promisify(vacuumCB);
async function prune(importers, opts) {
    const wantedLockfile = filter_lockfile_1.default(opts.wantedLockfile, {
        include: opts.include,
        registries: opts.registries,
        skipped: opts.skipped,
    });
    await Promise.all(importers.map(async ({ binsDir, id, modulesDir, pruneDirectDependencies, removePackages, rootDir }) => {
        var _a;
        const currentImporter = opts.currentLockfile.importers[id] || {};
        const currentPkgs = R.toPairs(mergeDependencies(currentImporter));
        const wantedPkgs = R.toPairs(mergeDependencies(wantedLockfile.importers[id]));
        const allCurrentPackages = new Set((pruneDirectDependencies || ((_a = removePackages) === null || _a === void 0 ? void 0 : _a.length))
            ? (await read_modules_dir_1.default(modulesDir) || [])
            : []);
        const depsToRemove = new Set([
            ...(removePackages || []).filter((removePackage) => allCurrentPackages.has(removePackage)),
            ...R.difference(currentPkgs, wantedPkgs).map(([depName]) => depName),
        ]);
        if (pruneDirectDependencies) {
            if (allCurrentPackages.size > 0) {
                const newPkgsSet = new Set(wantedPkgs.map(([depName]) => depName));
                for (const currentPackage of Array.from(allCurrentPackages)) {
                    if (!newPkgsSet.has(currentPackage)) {
                        depsToRemove.add(currentPackage);
                    }
                }
            }
        }
        return Promise.all(Array.from(depsToRemove).map((depName) => {
            var _a, _b, _c;
            return removeDirectDependency_1.default({
                dependenciesField: ((_a = currentImporter.devDependencies) === null || _a === void 0 ? void 0 : _a[depName]) && 'devDependencies' ||
                    ((_b = currentImporter.optionalDependencies) === null || _b === void 0 ? void 0 : _b[depName]) && 'optionalDependencies' ||
                    ((_c = currentImporter.dependencies) === null || _c === void 0 ? void 0 : _c[depName]) && 'dependencies' ||
                    undefined,
                name: depName,
            }, {
                binsDir,
                dryRun: opts.dryRun,
                modulesDir,
                rootDir,
            });
        }));
    }));
    const selectedImporterIds = importers.map((importer) => importer.id).sort();
    // In case installation is done on a subset of importers,
    // we may only prune dependencies that are used only by that subset of importers.
    // Otherwise, we would break the node_modules.
    const currentPkgIdsByDepPaths = R.equals(selectedImporterIds, Object.keys(opts.currentLockfile.importers))
        ? getPkgsDepPaths(opts.registries, opts.currentLockfile.packages || {})
        : getPkgsDepPathsOwnedOnlyByImporters(selectedImporterIds, opts.registries, opts.currentLockfile, opts.include, opts.skipped);
    const wantedPkgIdsByDepPaths = getPkgsDepPaths(opts.registries, wantedLockfile.packages || {});
    const oldDepPaths = Object.keys(currentPkgIdsByDepPaths);
    const newDepPaths = Object.keys(wantedPkgIdsByDepPaths);
    const orphanDepPaths = R.difference(oldDepPaths, newDepPaths);
    const orphanPkgIds = new Set(R.props(orphanDepPaths, currentPkgIdsByDepPaths));
    core_loggers_1.statsLogger.debug({
        prefix: opts.lockfileDir,
        removed: orphanPkgIds.size,
    });
    if (!opts.dryRun) {
        if (orphanDepPaths.length) {
            if (opts.currentLockfile.packages && opts.hoistedModulesDir) {
                const modulesDir = opts.hoistedModulesDir;
                const binsDir = path.join(opts.hoistedModulesDir, '.bin');
                const prefix = path.join(opts.virtualStoreDir, '../..');
                await Promise.all(orphanDepPaths.map(async (orphanDepPath) => {
                    if (opts.hoistedAliases[orphanDepPath]) {
                        await Promise.all(opts.hoistedAliases[orphanDepPath].map((alias) => {
                            return removeDirectDependency_1.default({
                                name: alias,
                            }, {
                                binsDir,
                                modulesDir,
                                muteLogs: true,
                                rootDir: prefix,
                            });
                        }));
                    }
                    delete opts.hoistedAliases[orphanDepPath];
                }));
            }
            await Promise.all(orphanDepPaths.map(async (orphanDepPath) => {
                const pathToRemove = path.join(opts.virtualStoreDir, orphanDepPath, 'node_modules');
                core_loggers_1.removalLogger.debug(pathToRemove);
                try {
                    await vacuum(pathToRemove, {
                        base: opts.virtualStoreDir,
                        purge: true,
                    });
                }
                catch (err) {
                    logger_1.default.warn({
                        error: err,
                        message: `Failed to remove "${pathToRemove}"`,
                        prefix: opts.lockfileDir,
                    });
                }
            }));
        }
        const addedDepPaths = R.difference(newDepPaths, oldDepPaths);
        const addedPkgIds = new Set(R.props(addedDepPaths, wantedPkgIdsByDepPaths));
        await opts.storeController.updateConnections(path.dirname(opts.virtualStoreDir), {
            addDependencies: Array.from(addedPkgIds),
            prune: opts.pruneStore || false,
            removeDependencies: Array.from(orphanPkgIds),
        });
    }
    return new Set(orphanDepPaths);
}
exports.default = prune;
function mergeDependencies(lockfileImporter) {
    return R.mergeAll(types_1.DEPENDENCIES_FIELDS.map((depType) => lockfileImporter[depType] || {}));
}
function getPkgsDepPaths(registries, packages) {
    const pkgIdsByDepPath = {};
    for (const relDepPath of Object.keys(packages)) {
        const depPath = dp.resolve(registries, relDepPath);
        pkgIdsByDepPath[depPath] = lockfile_utils_1.packageIdFromSnapshot(relDepPath, packages[relDepPath], registries);
    }
    return pkgIdsByDepPath;
}
function getPkgsDepPathsOwnedOnlyByImporters(importerIds, registries, lockfile, include, skipped) {
    const selected = filter_lockfile_1.filterLockfileByImporters(lockfile, importerIds, {
        failOnMissingDependencies: false,
        include,
        registries,
        skipped,
    });
    const other = filter_lockfile_1.filterLockfileByImporters(lockfile, R.difference(Object.keys(lockfile.importers), importerIds), {
        failOnMissingDependencies: false,
        include,
        registries,
        skipped,
    });
    const packagesOfSelectedOnly = R.pickAll(R.difference(Object.keys(selected.packages), Object.keys(other.packages)), selected.packages);
    return getPkgsDepPaths(registries, packagesOfSelectedOnly);
}

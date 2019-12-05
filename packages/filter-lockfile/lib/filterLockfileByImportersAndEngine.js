"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("@pnpm/constants");
const error_1 = require("@pnpm/error");
const lockfile_utils_1 = require("@pnpm/lockfile-utils");
const logger_1 = require("@pnpm/logger");
const package_is_installable_1 = require("@pnpm/package-is-installable");
const dp = require("dependency-path");
const R = require("ramda");
const filterImporter_1 = require("./filterImporter");
const logger = logger_1.default('lockfile');
function filterByImportersAndEngine(lockfile, importerIds, opts) {
    const importerDeps = importerIds
        .map((importerId) => lockfile.importers[importerId])
        .map((importer) => ({
        ...(opts.include.dependencies && importer.dependencies || {}),
        ...(opts.include.devDependencies && importer.devDependencies || {}),
        ...(opts.include.optionalDependencies && importer.optionalDependencies || {}),
    }))
        .map(R.toPairs);
    const directDepPaths = R.unnest(importerDeps)
        .map(([pkgName, ref]) => dp.refToRelative(ref, pkgName))
        .filter((nodeId) => nodeId !== null);
    const packages = lockfile.packages &&
        pickPkgsWithAllDeps(lockfile.packages, directDepPaths, {
            currentEngine: opts.currentEngine,
            engineStrict: opts.engineStrict,
            failOnMissingDependencies: opts.failOnMissingDependencies,
            include: opts.include,
            includeIncompatiblePackages: opts.includeIncompatiblePackages === true,
            lockfileDir: opts.lockfileDir,
            registries: opts.registries,
            skipped: opts.skipped,
        }) || {};
    const importers = importerIds.reduce((acc, importerId) => {
        acc[importerId] = filterImporter_1.default(lockfile.importers[importerId], opts.include);
        if (acc[importerId].optionalDependencies) {
            for (const depName of Object.keys(acc[importerId].optionalDependencies || {})) {
                const relDepPath = dp.refToRelative(acc[importerId].optionalDependencies[depName], depName);
                if (relDepPath && !packages[relDepPath]) {
                    delete acc[importerId].optionalDependencies[depName];
                }
            }
        }
        return acc;
    }, { ...lockfile.importers });
    return {
        importers,
        lockfileVersion: lockfile.lockfileVersion,
        packages,
    };
}
exports.default = filterByImportersAndEngine;
function pickPkgsWithAllDeps(pkgSnapshots, relDepPaths, opts) {
    const pickedPackages = {};
    pkgAllDeps({ pkgSnapshots, pickedPackages }, relDepPaths, true, opts);
    return pickedPackages;
}
function pkgAllDeps(ctx, relDepPaths, parentIsInstallable, opts) {
    for (const relDepPath of relDepPaths) {
        if (ctx.pickedPackages[relDepPath])
            continue;
        const pkgSnapshot = ctx.pkgSnapshots[relDepPath];
        if (!pkgSnapshot && !relDepPath.startsWith('link:')) {
            const message = `No entry for "${relDepPath}" in ${constants_1.WANTED_LOCKFILE}`;
            if (opts.failOnMissingDependencies) {
                throw new error_1.default('LOCKFILE_MISSING_DEPENDENCY', message);
            }
            logger.debug(message);
            continue;
        }
        let installable;
        if (!parentIsInstallable) {
            installable = false;
            if (!ctx.pickedPackages[relDepPath]) {
                opts.skipped.add(relDepPath);
            }
        }
        else {
            const pkg = {
                ...lockfile_utils_1.nameVerFromPkgSnapshot(relDepPath, pkgSnapshot),
                cpu: pkgSnapshot.cpu,
                engines: pkgSnapshot.engines,
                os: pkgSnapshot.os,
            };
            // TODO: relDepPath is not the package ID. Should be fixed
            installable = opts.includeIncompatiblePackages || package_is_installable_1.default(pkgSnapshot.id || relDepPath, pkg, {
                engineStrict: opts.engineStrict,
                lockfileDir: opts.lockfileDir,
                nodeVersion: opts.currentEngine.nodeVersion,
                optional: pkgSnapshot.optional === true,
                pnpmVersion: opts.currentEngine.pnpmVersion,
            }) !== false;
            if (!installable) {
                if (!ctx.pickedPackages[relDepPath]) {
                    opts.skipped.add(relDepPath);
                }
            }
            else {
                opts.skipped.delete(relDepPath);
                ctx.pickedPackages[relDepPath] = pkgSnapshot;
            }
        }
        const nextRelDepPaths = R.toPairs({
            ...pkgSnapshot.dependencies,
            ...(opts.include.optionalDependencies && pkgSnapshot.optionalDependencies || {}),
        })
            .map(([pkgName, ref]) => dp.refToRelative(ref, pkgName))
            .filter((nodeId) => nodeId !== null);
        pkgAllDeps(ctx, nextRelDepPaths, installable, opts);
    }
}

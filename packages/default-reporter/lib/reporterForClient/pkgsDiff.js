"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const most = require("most");
const R = require("ramda");
exports.propertyByDependencyType = {
    dev: 'devDependencies',
    nodeModulesOnly: 'node_modules',
    optional: 'optionalDependencies',
    peer: 'peerDependencies',
    prod: 'dependencies',
};
function default_1(log$, opts) {
    const deprecationSet$ = log$.deprecation
        .filter((log) => log.prefix === opts.prefix)
        .scan((acc, log) => {
        acc.add(log.pkgId);
        return acc;
    }, new Set());
    const pkgsDiff$ = most.combine((rootLog, deprecationSet) => [rootLog, deprecationSet], log$.root.filter((log) => log.prefix === opts.prefix), deprecationSet$)
        .scan((pkgsDiff, args) => {
        const rootLog = args[0];
        const deprecationSet = args[1];
        if (rootLog['added']) {
            pkgsDiff[rootLog['added'].dependencyType || 'nodeModulesOnly'][`+${rootLog['added'].name}`] = {
                added: true,
                deprecated: deprecationSet.has(rootLog['added'].id),
                from: rootLog['added'].linkedFrom,
                latest: rootLog['added'].latest,
                name: rootLog['added'].name,
                realName: rootLog['added'].realName,
                version: rootLog['added'].version,
            };
            return pkgsDiff;
        }
        if (rootLog['removed']) {
            pkgsDiff[rootLog['removed'].dependencyType || 'nodeModulesOnly'][`-${rootLog['removed'].name}`] = {
                added: false,
                name: rootLog['removed'].name,
                version: rootLog['removed'].version,
            };
            return pkgsDiff;
        }
        return pkgsDiff;
    }, {
        dev: {},
        nodeModulesOnly: {},
        optional: {},
        peer: {},
        prod: {},
    });
    const packageManifest$ = most.fromPromise(most.merge(log$.packageManifest.filter((log) => log.prefix === opts.prefix), log$.summary.filter((log) => log.prefix === opts.prefix).constant({}))
        .take(2)
        .reduce(R.merge, {}));
    return most.combine((pkgsDiff, packageManifests) => {
        if (!packageManifests['initial'] || !packageManifests['updated'])
            return pkgsDiff;
        const initialPackageManifest = removeOptionalFromProdDeps(packageManifests['initial']);
        const updatedPackageManifest = removeOptionalFromProdDeps(packageManifests['updated']);
        for (const depType of ['peer', 'prod', 'optional', 'dev']) {
            const prop = exports.propertyByDependencyType[depType];
            const initialDeps = Object.keys(initialPackageManifest[prop] || {});
            const updatedDeps = Object.keys(updatedPackageManifest[prop] || {});
            const removedDeps = R.difference(initialDeps, updatedDeps);
            for (const removedDep of removedDeps) {
                if (!pkgsDiff[depType][`-${removedDep}`]) {
                    pkgsDiff[depType][`-${removedDep}`] = {
                        added: false,
                        name: removedDep,
                        version: initialPackageManifest[prop][removedDep],
                    };
                }
            }
            const addedDeps = R.difference(updatedDeps, initialDeps);
            for (const addedDep of addedDeps) {
                if (!pkgsDiff[depType][`+${addedDep}`]) {
                    pkgsDiff[depType][`+${addedDep}`] = {
                        added: true,
                        name: addedDep,
                        version: updatedPackageManifest[prop][addedDep],
                    };
                }
            }
        }
        return pkgsDiff;
    }, pkgsDiff$, packageManifest$);
}
exports.default = default_1;
function removeOptionalFromProdDeps(pkg) {
    if (!pkg.dependencies || !pkg.optionalDependencies)
        return pkg;
    for (const depName of Object.keys(pkg.dependencies)) {
        if (pkg.optionalDependencies[depName]) {
            delete pkg.dependencies[depName];
        }
    }
    return pkg;
}

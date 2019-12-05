"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function getNonDevWantedDependencies(pkg) {
    const bundledDeps = new Set(pkg.bundleDependencies || pkg.bundledDependencies || []);
    bundledDeps.add(pkg.name);
    const filterDeps = getNotBundledDeps.bind(null, bundledDeps);
    return getWantedDependenciesFromGivenSet(filterDeps({ ...pkg.optionalDependencies, ...pkg.dependencies }), {
        devDependencies: {},
        optionalDependencies: pkg.optionalDependencies || {},
    });
}
exports.default = getNonDevWantedDependencies;
function getWantedDependenciesFromGivenSet(deps, opts) {
    if (!deps)
        return [];
    return Object.keys(deps).map((alias) => ({
        alias,
        dev: !!opts.devDependencies[alias],
        optional: !!opts.optionalDependencies[alias],
        pref: deps[alias],
    }));
}
function getNotBundledDeps(bundledDeps, deps) {
    return Object.keys(deps)
        .filter((depName) => !bundledDeps.has(depName))
        .reduce((notBundledDeps, depName) => {
        notBundledDeps[depName] = deps[depName];
        return notBundledDeps;
    }, {});
}

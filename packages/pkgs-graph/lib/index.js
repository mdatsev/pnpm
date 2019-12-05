"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const npa = require("@zkochan/npm-package-arg");
const path = require("path");
const R = require("ramda");
const semver = require("semver");
function default_1(pkgs) {
    const pkgMap = createPkgMap(pkgs);
    const unmatched = [];
    const graph = Object.keys(pkgMap)
        .reduce((acc, pkgSpec) => {
        acc[pkgSpec] = {
            dependencies: createNode(pkgMap[pkgSpec]),
            package: pkgMap[pkgSpec],
        };
        return acc;
    }, {});
    return { graph, unmatched };
    function createNode(pkg) {
        const dependencies = Object.assign({}, pkg.manifest.devDependencies, pkg.manifest.optionalDependencies, pkg.manifest.dependencies);
        return Object.keys(dependencies)
            .map(depName => {
            let spec;
            let rawSpec = dependencies[depName];
            try {
                if (rawSpec.startsWith('workspace:')) {
                    rawSpec = rawSpec.substr(10);
                }
                spec = npa.resolve(depName, rawSpec, pkg.dir);
            }
            catch (err) {
                return '';
            }
            if (spec.type === 'directory') {
                const matchedPkg = R.values(pkgMap).find(pkg => path.relative(pkg.dir, spec.fetchSpec) === '');
                if (!matchedPkg) {
                    return '';
                }
                return matchedPkg.dir;
            }
            if (spec.type !== 'version' && spec.type !== 'range')
                return '';
            const pkgs = R.values(pkgMap).filter(pkg => pkg.manifest.name === depName);
            if (!pkgs.length)
                return '';
            const versions = pkgs.map(pkg => pkg.manifest.version);
            if (versions.includes(rawSpec)) {
                const matchedPkg = pkgs.find(pkg => pkg.manifest.name === depName && pkg.manifest.version === rawSpec);
                return matchedPkg.dir;
            }
            const matched = semver.maxSatisfying(versions, rawSpec);
            if (!matched) {
                unmatched.push({ pkgName: depName, range: rawSpec });
                return '';
            }
            const matchedPkg = pkgs.find(pkg => pkg.manifest.name === depName && pkg.manifest.version === matched);
            return matchedPkg.dir;
        })
            .filter(Boolean);
    }
}
exports.default = default_1;
function createPkgMap(pkgs) {
    const pkgMap = {};
    for (let pkg of pkgs) {
        pkgMap[pkg.dir] = pkg;
    }
    return pkgMap;
}
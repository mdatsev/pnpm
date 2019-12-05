"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const R = require("ramda");
const sortPackages = R.sortBy(R.prop('name'));
async function default_1(pkgs, opts) {
    return pkgs.map((pkg) => renderParseableForPackage(pkg, opts)).join('\n');
}
exports.default = default_1;
function renderParseableForPackage(pkg, opts) {
    const pkgs = sortPackages(flatten([
        ...(pkg.optionalDependencies || []),
        ...(pkg.dependencies || []),
        ...(pkg.devDependencies || []),
        ...(pkg.unsavedDependencies || []),
    ]));
    if (!opts.alwaysPrintRootPackage && !pkgs.length)
        return '';
    if (opts.long) {
        let firstLine = pkg.path;
        if (pkg.name) {
            firstLine += `:${pkg.name}`;
            if (pkg.version) {
                firstLine += `@${pkg.version}`;
            }
        }
        return [
            firstLine,
            ...pkgs.map((pkg) => `${pkg.path}:${pkg.name}@${pkg.version}`),
        ].join('\n');
    }
    return [
        pkg.path,
        ...pkgs.map((pkg) => pkg.path),
    ].join('\n');
}
function flatten(nodes) {
    var _a;
    let packages = [];
    for (const node of nodes) {
        packages.push(node);
        if ((_a = node.dependencies) === null || _a === void 0 ? void 0 : _a.length) {
            packages = packages.concat(flatten(node.dependencies));
        }
    }
    return packages;
}

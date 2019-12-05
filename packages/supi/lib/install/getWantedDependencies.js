"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("@pnpm/utils");
const guessPinnedVersionFromExistingSpec_1 = require("../guessPinnedVersionFromExistingSpec");
function getWantedDependencies(pkg, opts) {
    var _a;
    const depsToInstall = utils_1.getAllDependenciesFromPackage(pkg);
    return getWantedDependenciesFromGivenSet(depsToInstall, {
        devDependencies: pkg.devDependencies || {},
        optionalDependencies: pkg.optionalDependencies || {},
        updatePref: ((_a = opts) === null || _a === void 0 ? void 0 : _a.updateWorkspaceDependencies) === true
            ? updateWorkspacePref
            : (pref) => pref,
    });
}
exports.default = getWantedDependencies;
function updateWorkspacePref(pref) {
    return pref.startsWith('workspace:') ? 'workspace:*' : pref;
}
function getWantedDependenciesFromGivenSet(deps, opts) {
    if (!deps)
        return [];
    return Object.keys(deps).map((alias) => {
        const pref = opts.updatePref(deps[alias]);
        return {
            alias,
            dev: !!opts.devDependencies[alias],
            optional: !!opts.optionalDependencies[alias],
            pinnedVersion: guessPinnedVersionFromExistingSpec_1.default(deps[alias]),
            pref,
            raw: `${alias}@${pref}`,
        };
    });
}

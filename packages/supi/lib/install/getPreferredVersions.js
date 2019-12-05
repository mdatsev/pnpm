"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("@pnpm/utils");
const getVerSelType = require("version-selector-type");
function getPreferredVersionsFromPackage(pkg) {
    return getVersionSpecsByRealNames(utils_1.getAllDependenciesFromPackage(pkg));
}
exports.default = getPreferredVersionsFromPackage;
function getVersionSpecsByRealNames(deps) {
    return Object.keys(deps)
        .reduce((acc, depName) => {
        if (deps[depName].startsWith('npm:')) {
            const pref = deps[depName].substr(4);
            const index = pref.lastIndexOf('@');
            const spec = pref.substr(index + 1);
            const selector = getVerSelType(spec);
            if (selector) {
                acc[pref.substr(0, index)] = {
                    selector: selector.normalized,
                    type: selector.type,
                };
            }
        }
        else if (!deps[depName].includes(':')) { // we really care only about semver specs
            const selector = getVerSelType(deps[depName]);
            if (selector) {
                acc[depName] = {
                    selector: selector.normalized,
                    type: selector.type,
                };
            }
        }
        return acc;
    }, {});
}
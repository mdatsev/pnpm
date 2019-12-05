"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_loggers_1 = require("@pnpm/core-loggers");
const types_1 = require("@pnpm/types");
async function save(prefix, packageManifest, packageSpecs, opts) {
    packageSpecs.forEach((packageSpec) => {
        if (packageSpec.saveType) {
            const spec = packageSpec.pref || findSpec(packageSpec.alias, packageManifest);
            if (spec) {
                packageManifest[packageSpec.saveType] = packageManifest[packageSpec.saveType] || {};
                packageManifest[packageSpec.saveType][packageSpec.alias] = spec;
                types_1.DEPENDENCIES_FIELDS.filter((depField) => depField !== packageSpec.saveType).forEach((deptype) => {
                    if (packageManifest[deptype]) {
                        delete packageManifest[deptype][packageSpec.alias];
                    }
                });
                if (packageSpec.peer === true) {
                    packageManifest.peerDependencies = packageManifest.peerDependencies || {};
                    packageManifest.peerDependencies[packageSpec.alias] = spec;
                }
            }
        }
        else if (packageSpec.pref) {
            const usedDepType = guessDependencyType(packageSpec.alias, packageManifest) || 'dependencies';
            packageManifest[usedDepType] = packageManifest[usedDepType] || {};
            packageManifest[usedDepType][packageSpec.alias] = packageSpec.pref;
        }
    });
    core_loggers_1.packageManifestLogger.debug({
        prefix,
        updated: packageManifest,
    });
    return packageManifest;
}
exports.default = save;
function findSpec(alias, manifest) {
    const foundDepType = guessDependencyType(alias, manifest);
    return foundDepType && manifest[foundDepType][alias];
}
function guessDependencyType(alias, manifest) {
    return types_1.DEPENDENCIES_FIELDS
        .find((depField) => { var _a; return Boolean((_a = manifest[depField]) === null || _a === void 0 ? void 0 : _a[alias]); });
}
exports.guessDependencyType = guessDependencyType;

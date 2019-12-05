"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_loggers_1 = require("@pnpm/core-loggers");
const types_1 = require("@pnpm/types");
async function default_1(packageManifest, removedPackages, opts) {
    if (opts.saveType) {
        packageManifest[opts.saveType] = packageManifest[opts.saveType];
        if (!packageManifest[opts.saveType])
            return packageManifest;
        removedPackages.forEach((dependency) => {
            delete packageManifest[opts.saveType][dependency];
        });
    }
    else {
        types_1.DEPENDENCIES_FIELDS
            .filter((depField) => packageManifest[depField])
            .forEach((depField) => {
            removedPackages.forEach((dependency) => {
                delete packageManifest[depField][dependency];
            });
        });
    }
    if (packageManifest.peerDependencies) {
        for (const removedDependency of removedPackages) {
            delete packageManifest.peerDependencies[removedDependency];
        }
    }
    core_loggers_1.packageManifestLogger.debug({
        prefix: opts.prefix,
        updated: packageManifest,
    });
    return packageManifest;
}
exports.default = default_1;

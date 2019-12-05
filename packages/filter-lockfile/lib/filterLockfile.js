"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const R = require("ramda");
const filterImporter_1 = require("./filterImporter");
function filterLockfile(lockfile, opts) {
    let pairs = R.toPairs(lockfile.packages || {})
        .filter(([relDepPath, pkg]) => !opts.skipped.has(relDepPath));
    if (!opts.include.dependencies) {
        pairs = pairs.filter(([relDepPath, pkg]) => pkg.dev !== false || pkg.optional);
    }
    if (!opts.include.devDependencies) {
        pairs = pairs.filter(([relDepPath, pkg]) => pkg.dev !== true);
    }
    if (!opts.include.optionalDependencies) {
        pairs = pairs.filter(([relDepPath, pkg]) => !pkg.optional);
    }
    return {
        importers: Object.keys(lockfile.importers).reduce((acc, importerId) => {
            acc[importerId] = filterImporter_1.default(lockfile.importers[importerId], opts.include);
            return acc;
        }, {}),
        lockfileVersion: lockfile.lockfileVersion,
        packages: R.fromPairs(pairs),
    };
}
exports.default = filterLockfile;

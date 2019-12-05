"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const parsePref_1 = require("@pnpm/npm-resolver/lib/parsePref");
const semver = require("semver");
function wantedDepIsLocallyAvailable(localPackages, wantedDependency, opts) {
    const spec = parsePref_1.default(wantedDependency.pref, wantedDependency.alias, opts.defaultTag || 'latest', opts.registry);
    if (!spec || !localPackages[spec.name])
        return false;
    return pickMatchingLocalVersionOrNull(localPackages[spec.name], spec) !== null;
}
exports.default = wantedDepIsLocallyAvailable;
// TODO: move this function to separate package or import from @pnpm/npm-resolver
function pickMatchingLocalVersionOrNull(versions, spec) {
    const localVersions = Object.keys(versions);
    switch (spec.type) {
        case 'tag':
            return semver.maxSatisfying(localVersions, '*');
        case 'version':
            return versions[spec.fetchSpec] ? spec.fetchSpec : null;
        case 'range':
            return semver.maxSatisfying(localVersions, spec.fetchSpec, true);
        default:
            return null;
    }
}

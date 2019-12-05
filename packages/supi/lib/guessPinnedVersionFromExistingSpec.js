"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const semver_utils_1 = require("semver-utils");
function guessPinnedVersionFromExistingSpec(spec) {
    if (spec.startsWith('workspace:'))
        spec = spec.substr('workspace:'.length);
    if (spec === '*')
        return 'none';
    const parsedRange = semver_utils_1.parseRange(spec);
    if (parsedRange.length !== 1)
        return undefined;
    const versionObject = parsedRange[0];
    switch (versionObject.operator) {
        case '~': return 'minor';
        case '^': return 'major';
        case undefined:
            if (versionObject.patch)
                return 'patch';
            if (versionObject.minor)
                return 'minor';
    }
    return undefined;
}
exports.default = guessPinnedVersionFromExistingSpec;

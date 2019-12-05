"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function getPinnedVersion(opts) {
    if (opts.saveExact === true)
        return 'patch';
    return opts.savePrefix === '~' ? 'minor' : 'major';
}
exports.getPinnedVersion = getPinnedVersion;

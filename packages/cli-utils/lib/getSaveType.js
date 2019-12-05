"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function getSaveType(opts) {
    if (opts.saveDev)
        return 'devDependencies';
    if (opts.saveOptional)
        return 'optionalDependencies';
    if (opts.saveProd)
        return 'dependencies';
    return undefined;
}
exports.default = getSaveType;
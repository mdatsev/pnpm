"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const error_1 = require("@pnpm/error");
const semver = require("semver");
class UnsupportedEngineError extends error_1.default {
    constructor(packageId, wanted, current) {
        super('UNSUPPORTED_ENGINE', `Unsupported engine for ${packageId}: wanted: ${JSON.stringify(wanted)} (current: ${JSON.stringify(current)})`);
        this.packageId = packageId;
        this.wanted = wanted;
        this.current = current;
    }
}
exports.UnsupportedEngineError = UnsupportedEngineError;
function checkEngine(packageId, wantedEngine, currentEngine) {
    if (!wantedEngine)
        return null;
    const unsatisfiedWanted = {};
    if (wantedEngine.node && !semver.satisfies(currentEngine.node, wantedEngine.node)) {
        unsatisfiedWanted.node = wantedEngine.node;
    }
    if (wantedEngine.pnpm && !semver.satisfies(currentEngine.pnpm, wantedEngine.pnpm)) {
        unsatisfiedWanted.pnpm = wantedEngine.pnpm;
    }
    if (Object.keys(unsatisfiedWanted).length) {
        return new UnsupportedEngineError(packageId, unsatisfiedWanted, currentEngine);
    }
    return null;
}
exports.default = checkEngine;
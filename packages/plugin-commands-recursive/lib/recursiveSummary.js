"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const error_1 = require("@pnpm/error");
class RecursiveFailError extends error_1.default {
    constructor(command, recursiveSummary) {
        super('RECURSIVE_FAIL', `"${command}" failed in ${recursiveSummary.fails.length} packages`);
        this.fails = recursiveSummary.fails;
        this.passes = recursiveSummary.passes;
    }
}
function throwOnCommandFail(command, recursiveSummary) {
    if (recursiveSummary.fails.length) {
        throw new RecursiveFailError(command, recursiveSummary);
    }
}
exports.throwOnCommandFail = throwOnCommandFail;

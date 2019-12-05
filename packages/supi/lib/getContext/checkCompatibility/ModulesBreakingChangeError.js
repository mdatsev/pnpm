"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BreakingChangeError_1 = require("./BreakingChangeError");
class ModulesBreakingChangeError extends BreakingChangeError_1.default {
    constructor(opts) {
        super({
            additionalInformation: opts.additionalInformation,
            code: 'MODULES_BREAKING_CHANGE',
            message: `The node_modules structure at "${opts.modulesPath}" is not compatible with the current pnpm version. Run "pnpm install --force" to recreate node_modules.`,
            relatedIssue: opts.relatedIssue,
            relatedPR: opts.relatedPR,
        });
        this.modulesPath = opts.modulesPath;
    }
}
exports.default = ModulesBreakingChangeError;
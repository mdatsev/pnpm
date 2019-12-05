"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const error_1 = require("@pnpm/error");
class BreakingChangeError extends error_1.default {
    constructor(opts) {
        super(opts.code, opts.message);
        this.relatedIssue = opts.relatedIssue;
        this.relatedPR = opts.relatedPR;
        this.additionalInformation = opts.additionalInformation;
    }
}
exports.default = BreakingChangeError;

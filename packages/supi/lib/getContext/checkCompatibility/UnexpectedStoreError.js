"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const error_1 = require("@pnpm/error");
class UnexpectedStoreError extends error_1.default {
    constructor(opts) {
        super('UNEXPECTED_STORE', 'Unexpected store location');
        this.expectedStorePath = opts.expectedStorePath;
        this.actualStorePath = opts.actualStorePath;
        this.modulesDir = opts.modulesDir;
    }
}
exports.default = UnexpectedStoreError;

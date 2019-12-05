"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const error_1 = require("@pnpm/error");
class UnexpectedVirtualStoreDirError extends error_1.default {
    constructor(opts) {
        super('UNEXPECTED_VIRTUAL_STORE', 'Unexpected virtual store location');
        this.expected = opts.expected;
        this.actual = opts.actual;
        this.modulesDir = opts.modulesDir;
    }
}
exports.default = UnexpectedVirtualStoreDirError;

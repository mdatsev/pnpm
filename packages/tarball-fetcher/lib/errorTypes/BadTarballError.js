"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const error_1 = require("@pnpm/error");
class BadTarballError extends error_1.default {
    constructor(opts) {
        const message = `Actual size (${opts.receivedSize}) of tarball (${opts.tarballUrl}) did not match the one specified in \'Content-Length\' header (${opts.expectedSize})`;
        super('BAD_TARBALL_SIZE', message);
        this.expectedSize = opts.expectedSize;
        this.receivedSize = opts.receivedSize;
    }
}
exports.default = BadTarballError;

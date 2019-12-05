"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const default_resolver_1 = require("@pnpm/default-resolver");
const LRU = require("lru-cache");
function default_1(opts) {
    return default_resolver_1.default(Object.assign(opts, {
        fullMetadata: false,
        metaCache: new LRU({
            max: 10000,
            maxAge: 120 * 1000,
        }),
    }));
}
exports.default = default_1;

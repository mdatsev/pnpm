"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const git_fetcher_1 = require("@pnpm/git-fetcher");
const tarball_fetcher_1 = require("@pnpm/tarball-fetcher");
function default_1(opts) {
    return {
        ...tarball_fetcher_1.default(opts),
        ...git_fetcher_1.default(),
    };
}
exports.default = default_1;

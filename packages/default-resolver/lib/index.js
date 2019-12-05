"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const git_resolver_1 = require("@pnpm/git-resolver");
const local_resolver_1 = require("@pnpm/local-resolver");
const npm_resolver_1 = require("@pnpm/npm-resolver");
const tarball_resolver_1 = require("@pnpm/tarball-resolver");
function createResolver(pnpmOpts) {
    const resolveFromNpm = npm_resolver_1.default(pnpmOpts);
    const resolveFromGit = git_resolver_1.default(pnpmOpts);
    return async (wantedDependency, opts) => {
        const resolution = await resolveFromNpm(wantedDependency, opts)
            || wantedDependency.pref && (await tarball_resolver_1.default(wantedDependency)
                || await resolveFromGit(wantedDependency)
                || await local_resolver_1.default(wantedDependency, opts));
        if (!resolution) {
            throw new Error(`Cannot resolve ${wantedDependency.alias ? wantedDependency.alias + '@' : ''}${wantedDependency.pref} packages not supported`);
        }
        return resolution;
    };
}
exports.default = createResolver;
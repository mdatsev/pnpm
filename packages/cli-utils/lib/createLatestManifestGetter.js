"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const default_resolver_1 = require("@pnpm/default-resolver");
const utils_1 = require("@pnpm/utils");
const LRU = require("lru-cache");
const mem = require("mem");
function createLatestManifestGetter(opts) {
    const resolve = default_resolver_1.default(Object.assign(opts, {
        fullMetadata: true,
        metaCache: new LRU({
            max: 10000,
            maxAge: 120 * 1000,
        }),
    }));
    return mem(getLatestManifest.bind(null, resolve, opts));
}
exports.createLatestManifestGetter = createLatestManifestGetter;
async function getLatestManifest(resolve, opts, packageName) {
    const resolution = await resolve({ alias: packageName, pref: 'latest' }, {
        importerDir: opts.dir,
        lockfileDir: opts.lockfileDir,
        preferredVersions: {},
        registry: utils_1.pickRegistryForPackage(opts.registries, packageName),
    });
    return resolution && resolution.manifest || null;
}
exports.getLatestManifest = getLatestManifest;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const error_1 = require("@pnpm/error");
const logger_1 = require("@pnpm/logger");
const getRegistryName = require("encode-registry");
const loadJsonFile = require("load-json-file");
const p_limit_1 = require("p-limit");
const path = require("path");
const url = require("url");
const writeJsonFile = require("write-json-file");
const pickPackageFromMeta_1 = require("./pickPackageFromMeta");
const toRaw_1 = require("./toRaw");
/**
 * prevents simultaneous operations on the meta.json
 * otherwise it would cause EPERM exceptions
 */
const metafileOperationLimits = {};
exports.default = async (ctx, spec, opts) => {
    var _a, _b;
    opts = opts || {};
    const cachedMeta = ctx.metaCache.get(spec.name);
    if (cachedMeta) {
        return {
            meta: cachedMeta,
            pickedPackage: pickPackageFromMeta_1.default(spec, opts.preferredVersionSelector, cachedMeta),
        };
    }
    const registryName = getRegistryName(opts.registry);
    const pkgMirror = path.join(ctx.storeDir, registryName, spec.name);
    const limit = metafileOperationLimits[pkgMirror] = metafileOperationLimits[pkgMirror] || p_limit_1.default(1);
    let metaCachedInStore;
    if (ctx.offline || ctx.preferOffline) {
        metaCachedInStore = await limit(() => loadMeta(pkgMirror, ctx.metaFileName));
        if (ctx.offline) {
            if (metaCachedInStore)
                return {
                    meta: metaCachedInStore,
                    pickedPackage: pickPackageFromMeta_1.default(spec, opts.preferredVersionSelector, metaCachedInStore),
                };
            throw new error_1.default('NO_OFFLINE_META', `Failed to resolve ${toRaw_1.default(spec)} in package mirror ${pkgMirror}`);
        }
        if (metaCachedInStore) {
            const pickedPackage = pickPackageFromMeta_1.default(spec, opts.preferredVersionSelector, metaCachedInStore);
            if (pickedPackage) {
                return {
                    meta: metaCachedInStore,
                    pickedPackage,
                };
            }
        }
    }
    if (spec.type === 'version') {
        metaCachedInStore = metaCachedInStore || await limit(() => loadMeta(pkgMirror, ctx.metaFileName));
        // use the cached meta only if it has the required package version
        // otherwise it is probably out of date
        if ((_b = (_a = metaCachedInStore) === null || _a === void 0 ? void 0 : _a.versions) === null || _b === void 0 ? void 0 : _b[spec.fetchSpec]) {
            return {
                meta: metaCachedInStore,
                pickedPackage: metaCachedInStore.versions[spec.fetchSpec],
            };
        }
    }
    try {
        const meta = await fromRegistry(ctx.fetch, spec.name, opts.registry, opts.auth);
        meta.cachedAt = Date.now();
        // only save meta to cache, when it is fresh
        ctx.metaCache.set(spec.name, meta);
        if (!opts.dryRun) {
            // tslint:disable-next-line:no-floating-promises
            limit(() => saveMeta(pkgMirror, meta, ctx.metaFileName));
        }
        return {
            meta,
            pickedPackage: pickPackageFromMeta_1.default(spec, opts.preferredVersionSelector, meta),
        };
    }
    catch (err) {
        const meta = await loadMeta(pkgMirror, ctx.metaFileName); // TODO: add test for this usecase
        if (!meta)
            throw err;
        logger_1.default.error(err);
        logger_1.default.debug({ message: `Using cached meta from ${pkgMirror}` });
        return {
            meta,
            pickedPackage: pickPackageFromMeta_1.default(spec, opts.preferredVersionSelector, meta),
        };
    }
};
class RegistryResponseError extends error_1.default {
    constructor(opts) {
        super(`REGISTRY_META_RESPONSE_${opts.response.status}`, `${opts.response.status} ${opts.response.statusText}: ${opts.package} (via ${opts.uri})`);
        this.package = opts.package;
        this.response = opts.response;
        this.uri = opts.uri;
    }
}
async function fromRegistry(fetch, pkgName, registry, auth) {
    const uri = toUri(pkgName, registry);
    const response = await fetch(uri, { auth });
    if (response.status > 400) {
        throw new RegistryResponseError({
            package: pkgName,
            response,
            uri,
        });
    }
    return response.json();
}
async function loadMeta(pkgMirror, metaFileName) {
    try {
        return await loadJsonFile(path.join(pkgMirror, metaFileName));
    }
    catch (err) {
        return null;
    }
}
function saveMeta(pkgMirror, meta, metaFileName) {
    return writeJsonFile(path.join(pkgMirror, metaFileName), meta);
}
function toUri(pkgName, registry) {
    let encodedName;
    if (pkgName[0] === '@') {
        encodedName = `@${encodeURIComponent(pkgName.substr(1))}`;
    }
    else {
        encodedName = encodeURIComponent(pkgName);
    }
    return url.resolve(registry, encodedName);
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const error_1 = require("@pnpm/error");
const getCredentialsByURI = require("credentials-by-uri");
const fetch_from_npm_registry_1 = require("fetch-from-npm-registry");
const mem = require("mem");
const normalize = require("normalize-path");
const path = require("path");
const semver = require("semver");
const ssri = require("ssri");
const createNpmPkgId_1 = require("./createNpmPkgId");
const parsePref_1 = require("./parsePref");
const pickPackage_1 = require("./pickPackage");
const toRaw_1 = require("./toRaw");
class NoMatchingVersionError extends error_1.default {
    constructor(opts) {
        super('NO_MATCHING_VERSION', `No matching version found for ${toRaw_1.default(opts.spec)}`);
        this.packageMeta = opts.packageMeta;
    }
}
// This file contains meta information
// about all the packages published by the same name, not just the manifest
// of one package/version
const META_FILENAME = 'index.json';
const FULL_META_FILENAME = 'index-full.json';
function createResolver(opts) {
    if (typeof opts.rawConfig !== 'object') { // tslint:disable-line
        throw new TypeError('`opts.rawConfig` is required and needs to be an object');
    }
    if (typeof opts.rawConfig['registry'] !== 'string') { // tslint:disable-line
        throw new TypeError('`opts.rawConfig.registry` is required and needs to be a string');
    }
    if (typeof opts.metaCache !== 'object') { // tslint:disable-line
        throw new TypeError('`opts.metaCache` is required and needs to be an object');
    }
    if (typeof opts.storeDir !== 'string') { // tslint:disable-line
        throw new TypeError('`opts.storeDir` is required and needs to be a string');
    }
    const fetch = fetch_from_npm_registry_1.default({
        ca: opts.ca,
        cert: opts.cert,
        fullMetadata: opts.fullMetadata,
        key: opts.key,
        localAddress: opts.localAddress,
        proxy: opts.httpsProxy || opts.proxy,
        retry: {
            factor: opts.fetchRetryFactor,
            maxTimeout: opts.fetchRetryMaxtimeout,
            minTimeout: opts.fetchRetryMintimeout,
            retries: opts.fetchRetries,
        },
        strictSSL: opts.strictSsl,
        userAgent: opts.userAgent,
    });
    return resolveNpm.bind(null, {
        getCredentialsByURI: mem((registry) => getCredentialsByURI(registry, opts.rawConfig)),
        pickPackage: pickPackage_1.default.bind(null, {
            fetch,
            metaCache: opts.metaCache,
            metaFileName: opts.fullMetadata ? FULL_META_FILENAME : META_FILENAME,
            offline: opts.offline,
            preferOffline: opts.preferOffline,
            storeDir: opts.storeDir,
        }),
    });
}
exports.default = createResolver;
async function resolveNpm(ctx, wantedDependency, opts) {
    var _a, _b;
    const defaultTag = opts.defaultTag || 'latest';
    const resolvedFromWorkspace = tryResolveFromWorkspace(wantedDependency, {
        defaultTag,
        importerDir: opts.importerDir,
        localPackages: opts.localPackages,
        registry: opts.registry,
    });
    if (resolvedFromWorkspace) {
        return resolvedFromWorkspace;
    }
    const spec = wantedDependency.pref
        ? parsePref_1.default(wantedDependency.pref, wantedDependency.alias, defaultTag, opts.registry)
        : defaultTagForAlias(wantedDependency.alias, defaultTag);
    if (!spec)
        return null;
    const auth = ctx.getCredentialsByURI(opts.registry);
    let pickResult;
    try {
        pickResult = await ctx.pickPackage(spec, {
            auth,
            dryRun: opts.dryRun === true,
            preferredVersionSelector: (_a = opts.preferredVersions) === null || _a === void 0 ? void 0 : _a[spec.name],
            registry: opts.registry,
        });
    }
    catch (err) {
        if (opts.localPackages) {
            const resolvedFromLocal = tryResolveFromLocalPackages(opts.localPackages, spec, opts.importerDir);
            if (resolvedFromLocal)
                return resolvedFromLocal;
        }
        throw err;
    }
    const pickedPackage = pickResult.pickedPackage;
    const meta = pickResult.meta;
    if (!pickedPackage) {
        if (opts.localPackages) {
            const resolvedFromLocal = tryResolveFromLocalPackages(opts.localPackages, spec, opts.importerDir);
            if (resolvedFromLocal)
                return resolvedFromLocal;
        }
        throw new NoMatchingVersionError({ spec, packageMeta: meta });
    }
    if ((_b = opts.localPackages) === null || _b === void 0 ? void 0 : _b[pickedPackage.name]) {
        if (opts.localPackages[pickedPackage.name][pickedPackage.version]) {
            return {
                ...resolveFromLocalPackage(opts.localPackages[pickedPackage.name][pickedPackage.version], spec.normalizedPref, opts.importerDir),
                latest: meta['dist-tags'].latest,
            };
        }
        const localVersion = pickMatchingLocalVersionOrNull(opts.localPackages[pickedPackage.name], spec);
        if (localVersion && semver.gt(localVersion, pickedPackage.version)) {
            return {
                ...resolveFromLocalPackage(opts.localPackages[pickedPackage.name][localVersion], spec.normalizedPref, opts.importerDir),
                latest: meta['dist-tags'].latest,
            };
        }
    }
    const id = createNpmPkgId_1.default(pickedPackage.dist.tarball, pickedPackage.name, pickedPackage.version);
    const resolution = {
        integrity: getIntegrity(pickedPackage.dist),
        registry: opts.registry,
        tarball: pickedPackage.dist.tarball,
    };
    return {
        id,
        latest: meta['dist-tags'].latest,
        manifest: pickedPackage,
        normalizedPref: spec.normalizedPref,
        resolution,
        resolvedVia: 'npm-registry',
    };
}
function tryResolveFromWorkspace(wantedDependency, opts) {
    var _a;
    if (!((_a = wantedDependency.pref) === null || _a === void 0 ? void 0 : _a.startsWith('workspace:'))) {
        return null;
    }
    const pref = wantedDependency.pref.substr(10);
    const spec = parsePref_1.default(pref, wantedDependency.alias, opts.defaultTag, opts.registry);
    if (!spec)
        throw new Error(`Invalid workspace: spec (${wantedDependency.pref})`);
    if (!opts.localPackages) {
        throw new Error('Cannot resolve package from workspace because opts.localPackages is not defined');
    }
    if (!opts.importerDir) {
        throw new Error('Cannot resolve package from workspace because opts.importerDir is not defined');
    }
    const resolvedFromLocal = tryResolveFromLocalPackages(opts.localPackages, spec, opts.importerDir);
    if (!resolvedFromLocal) {
        throw new error_1.default('NO_MATCHING_VERSION_INSIDE_WORKSPACE', `No matching version found for ${wantedDependency.alias}@${pref} inside the workspace`);
    }
    return resolvedFromLocal;
}
function tryResolveFromLocalPackages(localPackages, spec, importerDir) {
    if (!localPackages[spec.name])
        return null;
    const localVersion = pickMatchingLocalVersionOrNull(localPackages[spec.name], spec);
    if (!localVersion)
        return null;
    return resolveFromLocalPackage(localPackages[spec.name][localVersion], spec.normalizedPref, importerDir);
}
function pickMatchingLocalVersionOrNull(versions, spec) {
    const localVersions = Object.keys(versions);
    switch (spec.type) {
        case 'tag':
            return semver.maxSatisfying(localVersions, '*');
        case 'version':
            return versions[spec.fetchSpec] ? spec.fetchSpec : null;
        case 'range':
            return semver.maxSatisfying(localVersions, spec.fetchSpec, {
                includePrerelease: true,
                loose: true,
            });
        default:
            return null;
    }
}
function resolveFromLocalPackage(localPackage, normalizedPref, importerDir) {
    return {
        id: `link:${normalize(path.relative(importerDir, localPackage.dir))}`,
        manifest: localPackage.manifest,
        normalizedPref,
        resolution: {
            directory: localPackage.dir,
            type: 'directory',
        },
        resolvedVia: 'local-filesystem',
    };
}
function defaultTagForAlias(alias, defaultTag) {
    return {
        fetchSpec: defaultTag,
        name: alias,
        type: 'tag',
    };
}
function getIntegrity(dist) {
    if (dist.integrity) {
        return dist.integrity;
    }
    return ssri.fromHex(dist.shasum, 'sha1').toString();
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const error_1 = require("@pnpm/error");
const logger_1 = require("@pnpm/logger");
const getCredentialsByURI = require("credentials-by-uri");
const mem = require("mem");
const fs = require("mz/fs");
const path = require("path");
const pathTemp = require("path-temp");
const rimraf = require("rimraf");
const ssri = require("ssri");
const unpackStream = require("unpack-stream");
const createDownloader_1 = require("./createDownloader");
function default_1(opts) {
    const download = createDownloader_1.default({
        alwaysAuth: opts.alwaysAuth || false,
        ca: opts.ca,
        cert: opts.cert,
        fsIsCaseSensitive: typeof opts.fsIsCaseSensitive === 'boolean'
            ? opts.fsIsCaseSensitive
            : false,
        key: opts.key,
        localAddress: opts.localAddress,
        proxy: opts.httpsProxy || opts.proxy,
        registry: opts.registry,
        retry: {
            factor: opts.fetchRetryFactor,
            maxTimeout: opts.fetchRetryMaxtimeout,
            minTimeout: opts.fetchRetryMintimeout,
            retries: opts.fetchRetries,
        },
        // TODO: cover with tests this option
        // https://github.com/pnpm/pnpm/issues/1062
        strictSSL: typeof opts.strictSsl === 'boolean'
            ? opts.strictSsl
            : true,
        userAgent: opts.userAgent,
    });
    return {
        tarball: fetchFromTarball.bind(null, {
            fetchFromRemoteTarball: fetchFromRemoteTarball.bind(null, {
                download,
                getCredentialsByURI: mem((registry) => getCredentialsByURI(registry, opts.rawConfig)),
                ignoreFile: opts.ignoreFile,
                offline: opts.offline,
            }),
            ignore: opts.ignoreFile,
        }),
    };
}
exports.default = default_1;
function fetchFromTarball(ctx, resolution, target, opts) {
    if (resolution.tarball.startsWith('file:')) {
        const tarball = path.join(opts.lockfileDir, resolution.tarball.slice(5));
        return fetchFromLocalTarball(tarball, target, {
            ignore: ctx.ignore,
            integrity: resolution.integrity,
        });
    }
    return ctx.fetchFromRemoteTarball(target, resolution, opts);
}
async function fetchFromRemoteTarball(ctx, unpackTo, dist, opts) {
    try {
        return await fetchFromLocalTarball(opts.cachedTarballLocation, unpackTo, {
            integrity: dist.integrity,
        });
    }
    catch (err) {
        // ignore errors for missing files or broken/partial archives
        switch (err.code) {
            case 'Z_BUF_ERROR':
                if (ctx.offline) {
                    throw new error_1.default('CORRUPTED_TARBALL', `The cached tarball at "${opts.cachedTarballLocation}" is corrupted. Cannot redownload it as offline mode was requested.`);
                }
                logger_1.globalWarn(`Redownloading corrupted cached tarball: ${opts.cachedTarballLocation}`);
                break;
            case 'EINTEGRITY':
                if (ctx.offline) {
                    throw new error_1.default('BAD_TARBALL_CHECKSUM', `The cached tarball at "${opts.cachedTarballLocation}" did not pass the integrity check. Cannot redownload it as offline mode was requested.`);
                }
                logger_1.globalWarn(`The cached tarball at "${opts.cachedTarballLocation}" did not pass the integrity check. Redownloading.`);
                break;
            case 'ENOENT':
                if (ctx.offline) {
                    throw new error_1.default('NO_OFFLINE_TARBALL', `Could not find ${opts.cachedTarballLocation} in local registry mirror`);
                }
                break;
            default:
                throw err;
        }
        const auth = dist.registry ? ctx.getCredentialsByURI(dist.registry) : undefined;
        return ctx.download(dist.tarball, opts.cachedTarballLocation, {
            auth,
            ignore: ctx.ignoreFile,
            integrity: dist.integrity,
            onProgress: opts.onProgress,
            onStart: opts.onStart,
            registry: dist.registry,
            unpackTo,
        });
    }
}
async function fetchFromLocalTarball(tarball, dir, opts) {
    const tarballStream = fs.createReadStream(tarball);
    const tempLocation = pathTemp(dir);
    try {
        const filesIndex = (await Promise.all([
            unpackStream.local(tarballStream, tempLocation, {
                ignore: opts.ignore,
            }),
            opts.integrity && ssri.checkStream(tarballStream, opts.integrity),
        ]))[0];
        return { filesIndex, tempLocation };
    }
    catch (err) {
        rimraf(tempLocation, () => {
            // ignore errors
        });
        err.attempts = 1;
        err.resource = tarball;
        throw err;
    }
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const error_1 = require("@pnpm/error");
const logger_1 = require("@pnpm/logger");
const fetch_from_npm_registry_1 = require("fetch-from-npm-registry");
const fs = require("graceful-fs");
const makeDir = require("make-dir");
const path = require("path");
const pathTemp = require("path-temp");
const retry = require("retry");
const rimraf = require("rimraf");
const ssri = require("ssri");
const unpackStream = require("unpack-stream");
const urlLib = require("url");
const errorTypes_1 = require("./errorTypes");
const ignorePackageFileLogger = logger_1.default('_ignore-package-file');
class TarballFetchError extends error_1.default {
    constructor(uri, response) {
        super('TARBALL_FETCH', `${response.status} ${response.statusText}: ${uri}`);
        this.httpStatusCode = response.status;
        this.uri = uri;
        this.response = response;
    }
}
class TarballIntegrityError extends error_1.default {
    constructor(opts) {
        super('TARBALL_INTEGRITY', `Got unexpected checksum for "${opts.url}". Wanted "${opts.expected}". Got "${opts.found}".`);
        this.found = opts.found;
        this.expected = opts.expected;
        this.algorithm = opts.algorithm;
        this.sri = opts.sri;
        this.url = opts.url;
    }
}
exports.default = (gotOpts) => {
    const fetchFromNpmRegistry = fetch_from_npm_registry_1.default(gotOpts);
    const retryOpts = {
        factor: 10,
        maxTimeout: 6e4,
        minTimeout: 1e4,
        retries: 2,
        ...gotOpts.retry
    };
    return async function download(url, saveto, opts) {
        const saveToDir = path.dirname(saveto);
        await makeDir(saveToDir);
        // If a tarball is hosted on a different place than the manifest, only send
        // credentials on `alwaysAuth`
        const shouldAuth = opts.auth && (opts.auth.alwaysAuth ||
            !opts.registry ||
            urlLib.parse(url).host === urlLib.parse(opts.registry).host);
        const op = retry.operation(retryOpts);
        return new Promise((resolve, reject) => {
            op.attempt((currentAttempt) => {
                fetch(currentAttempt)
                    .then(resolve)
                    .catch((err) => {
                    if (err.httpStatusCode === 403) {
                        reject(err);
                        return;
                    }
                    if (op.retry(err)) {
                        return;
                    }
                    reject(op.mainError());
                });
            });
        });
        async function fetch(currentAttempt) {
            try {
                const res = await fetchFromNpmRegistry(url, { auth: shouldAuth && opts.auth || undefined }); // tslint:disable-line
                if (res.status !== 200) {
                    throw new TarballFetchError(url, res);
                }
                const contentLength = res.headers.has('content-length') && res.headers.get('content-length');
                const size = typeof contentLength === 'string'
                    ? parseInt(contentLength, 10)
                    : null;
                if (opts.onStart) {
                    opts.onStart(size, currentAttempt);
                }
                const onProgress = opts.onProgress;
                let downloaded = 0;
                res.body.on('data', (chunk) => {
                    downloaded += chunk.length;
                    if (onProgress)
                        onProgress(downloaded);
                });
                const tempTarballLocation = pathTemp(saveToDir);
                const writeStream = fs.createWriteStream(tempTarballLocation);
                return await new Promise((resolve, reject) => {
                    const stream = res.body
                        .on('error', reject)
                        .pipe(writeStream)
                        .on('error', reject);
                    const tempLocation = pathTemp(opts.unpackTo);
                    const ignore = gotOpts.fsIsCaseSensitive ? opts.ignore : createIgnorer(url, opts.ignore);
                    Promise.all([
                        opts.integrity && safeCheckStream(res.body, opts.integrity, url) || true,
                        unpackStream.local(res.body, tempLocation, {
                            generateIntegrity: opts.generatePackageIntegrity,
                            ignore,
                        }),
                        waitTillClosed({ stream, size, getDownloaded: () => downloaded, url }),
                    ])
                        .then(([integrityCheckResult, filesIndex]) => {
                        if (integrityCheckResult !== true) {
                            throw integrityCheckResult;
                        }
                        fs.rename(tempTarballLocation, saveto, () => {
                            // ignore errors
                        });
                        resolve({ tempLocation, filesIndex: filesIndex });
                    })
                        .catch((err) => {
                        rimraf(tempTarballLocation, () => {
                            // ignore errors
                        });
                        rimraf(tempLocation, () => {
                            // Just ignoring this error
                            // A redundant stage folder won't break anything
                        });
                        reject(err);
                    });
                });
            }
            catch (err) {
                err.attempts = currentAttempt;
                err.resource = url;
                throw err;
            }
        }
    };
};
function createIgnorer(tarballUrl, ignore) {
    const lowercaseFiles = new Set();
    if (ignore) {
        return (filename) => {
            const lowercaseFilename = filename.toLowerCase();
            if (lowercaseFiles.has(lowercaseFilename)) {
                ignorePackageFileLogger.debug({
                    reason: 'case-insensitive-duplicate',
                    skippedFilename: filename,
                    tarballUrl,
                });
                return true;
            }
            lowercaseFiles.add(lowercaseFilename);
            return ignore(filename);
        };
    }
    return (filename) => {
        const lowercaseFilename = filename.toLowerCase();
        if (lowercaseFiles.has(lowercaseFilename)) {
            ignorePackageFileLogger.debug({
                reason: 'case-insensitive-duplicate',
                skippedFilename: filename,
                tarballUrl,
            });
            return true;
        }
        lowercaseFiles.add(lowercaseFilename);
        return false;
    };
}
async function safeCheckStream(stream, integrity, url) {
    try {
        await ssri.checkStream(stream, integrity);
        return true;
    }
    catch (err) {
        return new TarballIntegrityError({
            algorithm: err['algorithm'],
            expected: err['expected'],
            found: err['found'],
            sri: err['sri'],
            url,
        });
    }
}
function waitTillClosed(opts) {
    return new Promise((resolve, reject) => {
        opts.stream.on('close', () => {
            const downloaded = opts.getDownloaded();
            if (opts.size !== null && opts.size !== downloaded) {
                const err = new errorTypes_1.BadTarballError({
                    expectedSize: opts.size,
                    receivedSize: downloaded,
                    tarballUrl: opts.url,
                });
                reject(err);
                return;
            }
            resolve();
        });
    });
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fetch_1 = require("@pnpm/fetch");
const p_limit_1 = require("p-limit");
const pShare = require("promise-share");
const uuid = require("uuid");
function default_1(initOpts) {
    const remotePrefix = initOpts.remotePrefix;
    const limitedFetch = limitFetch.bind(null, p_limit_1.default(initOpts.concurrency || 100));
    return new Promise((resolve, reject) => {
        resolve({
            close: async () => { return; },
            fetchPackage: fetchPackage.bind(null, remotePrefix, limitedFetch),
            findPackageUsages: async (searchQueries) => {
                return await limitedFetch(`${remotePrefix}/findPackageUsages`, { searchQueries });
            },
            getPackageLocation: async (packageId, packageName, opts) => {
                return await limitedFetch(`${remotePrefix}/getPackageLocation`, {
                    opts,
                    packageId,
                    packageName,
                });
            },
            importPackage: async (from, to, opts) => {
                await limitedFetch(`${remotePrefix}/importPackage`, {
                    from,
                    opts,
                    to,
                });
            },
            prune: async () => {
                await limitedFetch(`${remotePrefix}/prune`, {});
            },
            requestPackage: requestPackage.bind(null, remotePrefix, limitedFetch),
            saveState: async () => {
                await limitedFetch(`${remotePrefix}/saveState`, {});
            },
            stop: async () => { await limitedFetch(`${remotePrefix}/stop`, {}); },
            updateConnections: async (prefix, opts) => {
                await limitedFetch(`${remotePrefix}/updateConnections`, {
                    opts,
                    prefix,
                });
            },
            upload: async (builtPkgLocation, opts) => {
                await limitedFetch(`${remotePrefix}/upload`, {
                    builtPkgLocation,
                    opts,
                });
            },
        });
    });
}
exports.default = default_1;
function limitFetch(limit, url, body) {
    return limit(async () => {
        // TODO: the http://unix: should be also supported by the fetcher
        // but it fails with node-fetch-unix as of v2.3.0
        if (url.startsWith('http://unix:')) {
            url = url.replace('http://unix:', 'unix:');
        }
        const response = await fetch_1.default(url, {
            body: JSON.stringify(body),
            headers: { 'Content-Type': 'application/json' },
            method: 'POST',
            retry: {
                retries: 100,
            },
        });
        if (!response.ok) {
            throw await response.json();
        }
        const json = await response.json();
        if (json.error) {
            throw json.error;
        }
        return json;
    });
}
function requestPackage(remotePrefix, limitedFetch, // tslint:disable-line
wantedDependency, options) {
    const msgId = uuid.v4();
    return limitedFetch(`${remotePrefix}/requestPackage`, {
        msgId,
        options,
        wantedDependency,
    })
        .then((packageResponseBody) => {
        const fetchingBundledManifest = !packageResponseBody['fetchingBundledManifestInProgress'] // tslint:disable-line
            ? undefined
            : limitedFetch(`${remotePrefix}/rawManifestResponse`, {
                msgId,
            });
        delete packageResponseBody['fetchingBundledManifestInProgress']; // tslint:disable-line
        if (options.skipFetch) {
            return {
                body: packageResponseBody,
                bundledManifest: fetchingBundledManifest && pShare(fetchingBundledManifest),
            };
        }
        const fetchingFiles = limitedFetch(`${remotePrefix}/packageFilesResponse`, {
            msgId,
        });
        return {
            body: packageResponseBody,
            bundledManifest: fetchingBundledManifest && pShare(fetchingBundledManifest),
            files: pShare(fetchingFiles),
            finishing: pShare(Promise.all([fetchingBundledManifest, fetchingFiles]).then(() => undefined)),
        };
    });
}
function fetchPackage(remotePrefix, limitedFetch, // tslint:disable-line
options) {
    const msgId = uuid.v4();
    return limitedFetch(`${remotePrefix}/fetchPackage`, {
        msgId,
        options,
    })
        .then((fetchResponseBody) => {
        const fetchingBundledManifest = options.fetchRawManifest
            ? limitedFetch(`${remotePrefix}/rawManifestResponse`, { msgId })
            : undefined;
        const fetchingFiles = limitedFetch(`${remotePrefix}/packageFilesResponse`, {
            msgId,
        });
        return {
            bundledManifest: fetchingBundledManifest && pShare(fetchingBundledManifest),
            files: pShare(fetchingFiles),
            finishing: pShare(Promise.all([fetchingBundledManifest, fetchingFiles]).then(() => undefined)),
            inStoreLocation: fetchResponseBody.inStoreLocation,
        };
    });
}

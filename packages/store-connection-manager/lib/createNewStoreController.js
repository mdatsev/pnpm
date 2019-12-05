"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const default_fetcher_1 = require("@pnpm/default-fetcher");
const logger_1 = require("@pnpm/logger");
const package_store_1 = require("@pnpm/package-store");
const dir_is_case_sensitive_1 = require("dir-is-case-sensitive");
const makeDir = require("make-dir");
const path = require("path");
const createResolver_1 = require("./createResolver");
exports.default = async (opts) => {
    // TODO: either print a warning or just log if --no-lock is used
    const sopts = Object.assign(opts, {
        locks: opts.lock ? path.join(opts.storeDir, '_locks') : undefined,
        registry: opts.registry || 'https://registry.npmjs.org/',
    });
    const resolve = createResolver_1.default(sopts);
    await makeDir(sopts.storeDir);
    const fsIsCaseSensitive = await dir_is_case_sensitive_1.default(sopts.storeDir);
    logger_1.default.debug({
        // An undefined field would cause a crash of the logger
        // so converting it to null
        isCaseSensitive: typeof fsIsCaseSensitive === 'boolean'
            ? fsIsCaseSensitive : null,
        store: sopts.storeDir,
    });
    const fetchers = default_fetcher_1.default({ ...sopts, fsIsCaseSensitive });
    return {
        ctrl: await package_store_1.default(resolve, fetchers, {
            locks: sopts.locks,
            lockStaleDuration: sopts.lockStaleDuration,
            networkConcurrency: sopts.networkConcurrency,
            packageImportMethod: sopts.packageImportMethod,
            storeDir: sopts.storeDir,
            verifyStoreIntegrity: typeof sopts.verifyStoreIntegrity === 'boolean' ?
                sopts.verifyStoreIntegrity : true,
        }),
        dir: sopts.storeDir,
    };
};

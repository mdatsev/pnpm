"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cli_utils_1 = require("@pnpm/cli-utils");
const error_1 = require("@pnpm/error");
const logger_1 = require("@pnpm/logger");
const server_1 = require("@pnpm/server");
const store_path_1 = require("@pnpm/store-path");
const delay_1 = require("delay");
const fs = require("mz/fs");
const path = require("path");
const createNewStoreController_1 = require("./createNewStoreController");
exports.createNewStoreController = createNewStoreController_1.default;
const runServerInBackground_1 = require("./runServerInBackground");
const serverConnectionInfoDir_1 = require("./serverConnectionInfoDir");
exports.serverConnectionInfoDir = serverConnectionInfoDir_1.default;
async function createOrConnectStoreControllerCached(storeControllerCache, opts) {
    const storeDir = await store_path_1.default(opts.dir, opts.storeDir);
    if (!storeControllerCache.has(storeDir)) {
        storeControllerCache.set(storeDir, createOrConnectStoreController(opts));
    }
    return await storeControllerCache.get(storeDir);
}
exports.createOrConnectStoreControllerCached = createOrConnectStoreControllerCached;
async function createOrConnectStoreController(opts) {
    const storeDir = await store_path_1.default(opts.dir, opts.storeDir);
    const connectionInfoDir = serverConnectionInfoDir_1.default(storeDir);
    const serverJsonPath = path.join(connectionInfoDir, 'server.json');
    let serverJson = await tryLoadServerJson({ serverJsonPath, shouldRetryOnNoent: false });
    if (serverJson !== null) {
        if (serverJson.pnpmVersion !== cli_utils_1.packageManager.version) {
            logger_1.default.warn({
                message: `The store server runs on pnpm v${serverJson.pnpmVersion}. It is recommended to connect with the same version (current is v${cli_utils_1.packageManager.version})`,
                prefix: opts.dir,
            });
        }
        logger_1.default.info({
            message: 'A store server is running. All store manipulations are delegated to it.',
            prefix: opts.dir,
        });
        return {
            ctrl: await server_1.connectStoreController(serverJson.connectionOptions),
            dir: storeDir,
        };
    }
    if (opts.useRunningStoreServer) {
        throw new error_1.default('NO_STORE_SERVER', 'No store server is running.');
    }
    if (opts.useStoreServer) {
        runServerInBackground_1.default(storeDir);
        serverJson = await tryLoadServerJson({ serverJsonPath, shouldRetryOnNoent: true });
        logger_1.default.info({
            message: 'A store server has been started. To stop it, use \`pnpm server stop\`',
            prefix: opts.dir,
        });
        return {
            ctrl: await server_1.connectStoreController(serverJson.connectionOptions),
            dir: storeDir,
        };
    }
    return createNewStoreController_1.default(Object.assign(opts, {
        storeDir,
    }));
}
exports.createOrConnectStoreController = createOrConnectStoreController;
async function tryLoadServerJson(options) {
    let beforeFirstAttempt = true;
    const startHRTime = process.hrtime();
    while (true) {
        if (!beforeFirstAttempt) {
            const elapsedHRTime = process.hrtime(startHRTime);
            // Time out after 10 seconds of waiting for the server to start, assuming something went wrong.
            // E.g. server got a SIGTERM or was otherwise abruptly terminated, server has a bug or a third
            // party is interfering.
            if (elapsedHRTime[0] >= 10) {
                // Delete the file in an attempt to recover from this bad state.
                try {
                    await fs.unlink(options.serverJsonPath);
                }
                catch (error) {
                    if (error.code !== 'ENOENT') {
                        throw error;
                    }
                    // Either the server.json was manually removed or another process already removed it.
                }
                return null;
            }
            // Poll for server startup every 200 milliseconds.
            await delay_1.default(200);
        }
        beforeFirstAttempt = false;
        let serverJsonStr;
        try {
            serverJsonStr = await fs.readFile(options.serverJsonPath, 'utf8');
        }
        catch (error) {
            if (error.code !== 'ENOENT') {
                throw error;
            }
            if (!options.shouldRetryOnNoent) {
                return null;
            }
            continue;
        }
        let serverJson;
        try {
            serverJson = JSON.parse(serverJsonStr);
        }
        catch (error) {
            // Server is starting or server.json was modified by a third party.
            // We assume the best case and retry.
            continue;
        }
        if (serverJson === null) {
            // Our server should never write null to server.json, even though it is valid json.
            throw new Error('server.json was modified by a third party');
        }
        return serverJson;
    }
}
exports.tryLoadServerJson = tryLoadServerJson;

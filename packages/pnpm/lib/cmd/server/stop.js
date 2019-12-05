"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = require("@pnpm/logger");
const server_1 = require("@pnpm/server");
const store_connection_manager_1 = require("@pnpm/store-connection-manager");
const store_path_1 = require("@pnpm/store-path");
const delay_1 = require("delay");
const path = require("path");
const processExists = require("process-exists");
const killcb = require("tree-kill");
const util_1 = require("util");
const kill = util_1.promisify(killcb);
exports.default = async (opts) => {
    const storeDir = await store_path_1.default(opts.dir, opts.storeDir);
    const connectionInfoDir = store_connection_manager_1.serverConnectionInfoDir(storeDir);
    const serverJson = await store_connection_manager_1.tryLoadServerJson({
        serverJsonPath: path.join(connectionInfoDir, 'server.json'),
        shouldRetryOnNoent: false,
    });
    if (serverJson === null) {
        logger_1.globalInfo(`Nothing to stop. No server is running for the store at ${storeDir}`);
        return;
    }
    const storeController = await server_1.connectStoreController(serverJson.connectionOptions);
    await storeController.stop();
    if (await serverGracefullyStops(serverJson.pid)) {
        logger_1.globalInfo('Server gracefully stopped');
        return;
    }
    logger_1.globalWarn('Graceful shutdown failed');
    await kill(serverJson.pid, 'SIGINT');
    logger_1.globalInfo('Server process terminated');
};
async function serverGracefullyStops(pid) {
    if (!await processExists(pid))
        return true;
    await delay_1.default(5000);
    return !await processExists(pid);
}

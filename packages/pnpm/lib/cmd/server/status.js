"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = require("@pnpm/logger");
const store_connection_manager_1 = require("@pnpm/store-connection-manager");
const store_path_1 = require("@pnpm/store-path");
const common_tags_1 = require("common-tags");
const path = require("path");
exports.default = async (opts) => {
    const storeDir = await store_path_1.default(opts.dir, opts.storeDir);
    const connectionInfoDir = store_connection_manager_1.serverConnectionInfoDir(storeDir);
    const serverJson = await store_connection_manager_1.tryLoadServerJson({
        serverJsonPath: path.join(connectionInfoDir, 'server.json'),
        shouldRetryOnNoent: false,
    });
    if (serverJson === null) {
        logger_1.globalInfo(`No server is running for the store at ${storeDir}`);
        return;
    }
    console.log(common_tags_1.stripIndents `
    store: ${storeDir}
    process id: ${serverJson.pid}
    remote prefix: ${serverJson.connectionOptions.remotePrefix}
  `);
};

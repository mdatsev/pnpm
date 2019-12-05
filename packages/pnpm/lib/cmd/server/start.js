"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cli_utils_1 = require("@pnpm/cli-utils");
const error_1 = require("@pnpm/error");
const logger_1 = require("@pnpm/logger");
const server_1 = require("@pnpm/server");
const store_connection_manager_1 = require("@pnpm/store-connection-manager");
const store_path_1 = require("@pnpm/store-path");
const Diable = require("diable");
const getPort = require("get-port");
const isWindows = require("is-windows");
const makeDir = require("make-dir");
const fs = require("mz/fs");
const path = require("path");
const onExit = require("signal-exit");
const storeServerLogger = logger_1.default('store-server');
exports.default = async (opts) => {
    var _a;
    if (opts.protocol === 'ipc' && opts.port) {
        throw new Error('Port cannot be selected when server communicates via IPC');
    }
    if (opts.background && !Diable.isDaemon()) {
        Diable();
    }
    const storeDir = await store_path_1.default(opts.dir, opts.storeDir);
    const connectionInfoDir = store_connection_manager_1.serverConnectionInfoDir(storeDir);
    const serverJsonPath = path.join(connectionInfoDir, 'server.json');
    await makeDir(connectionInfoDir);
    // Open server.json with exclusive write access to ensure only one process can successfully
    // start the server. Note: NFS does not support exclusive writing, but do we really care?
    // Source: https://github.com/moxystudio/node-proper-lockfile#user-content-comparison
    let fd;
    try {
        fd = await fs.open(serverJsonPath, 'wx');
    }
    catch (error) {
        if (error.code !== 'EEXIST') {
            throw error;
        }
        throw new error_1.default('SERVER_MANIFEST_LOCKED', `Canceling startup of server (pid ${process.pid}) because another process got exclusive access to server.json`);
    }
    let server = null;
    onExit(() => {
        if (server !== null) {
            // Note that server.close returns a Promise, but we cannot wait for it because we may be
            // inside the 'exit' even of process.
            server.close(); // tslint:disable-line:no-floating-promises
        }
        if (fd !== null) {
            try {
                fs.closeSync(fd);
            }
            catch (error) {
                storeServerLogger.error(error, `Got error while closing file descriptor of server.json, but the process is already exiting`);
            }
        }
        try {
            fs.unlinkSync(serverJsonPath);
        }
        catch (error) {
            if (error.code !== 'ENOENT') {
                storeServerLogger.error(error, `Got error unlinking server.json, but the process is already exiting`);
            }
        }
    });
    const store = await store_connection_manager_1.createNewStoreController(Object.assign(opts, {
        storeDir,
    }));
    const protocol = (_a = opts.protocol, (_a !== null && _a !== void 0 ? _a : (opts.port ? 'tcp' : 'auto')));
    const serverOptions = await getServerOptions(connectionInfoDir, { protocol, port: opts.port });
    const connectionOptions = {
        remotePrefix: serverOptions.path
            ? `http://unix:${serverOptions.path}:`
            : `http://${serverOptions.hostname}:${serverOptions.port}`,
    };
    server = server_1.createServer(store.ctrl, {
        ...serverOptions,
        ignoreStopRequests: opts.ignoreStopRequests,
        ignoreUploadRequests: opts.ignoreUploadRequests,
    });
    // Make sure to populate server.json after the server has started, so clients know that the server is
    // listening if a server.json with valid JSON content exists.
    const serverJson = {
        connectionOptions,
        pid: process.pid,
        pnpmVersion: cli_utils_1.packageManager.version,
    };
    const serverJsonStr = JSON.stringify(serverJson, undefined, 2); // undefined and 2 are for formatting.
    const serverJsonBuffer = Buffer.from(serverJsonStr, 'utf8');
    // fs.write on NodeJS 4 requires the parameters offset and length to be set:
    // https://nodejs.org/docs/latest-v4.x/api/fs.html#fs_fs_write_fd_buffer_offset_length_position_callback
    await fs.write(fd, serverJsonBuffer, 0, serverJsonBuffer.byteLength);
    const fdForClose = fd;
    // Set fd to null so we only attempt to close it once.
    fd = null;
    await fs.close(fdForClose);
};
async function getServerOptions(connectionInfoDir, opts) {
    switch (opts.protocol) {
        case 'tcp':
            return getTcpOptions();
        case 'ipc':
            if (isWindows()) {
                throw new Error('IPC protocol is not supported on Windows currently');
            }
            return getIpcOptions();
        case 'auto':
            if (isWindows()) {
                return getTcpOptions();
            }
            return getIpcOptions();
        default:
            throw new Error(`Protocol ${opts.protocol} is not supported`);
    }
    async function getTcpOptions() {
        return {
            hostname: 'localhost',
            port: opts.port || await getPort({ port: 5813 }),
        };
    }
    function getIpcOptions() {
        return {
            path: path.join(connectionInfoDir, 'socket'),
        };
    }
}

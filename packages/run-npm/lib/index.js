"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const spawn = require("cross-spawn");
const path = require("path");
const PATH = require("path-name");
function runNpm(args) {
    return runScriptSync('npm', args, {
        cwd: process.cwd(),
        stdio: 'inherit',
        userAgent: undefined,
    });
}
exports.default = runNpm;
function runScriptSync(command, args, opts) {
    opts = Object.assign({}, opts);
    return spawn.sync(command, args, Object.assign({}, opts, {
        env: createEnv(opts),
    }));
}
exports.runScriptSync = runScriptSync;
function createEnv(opts) {
    const env = Object.create(process.env);
    env[PATH] = [
        path.join(opts.cwd, 'node_modules', '.bin'),
        path.dirname(process.execPath),
        process.env[PATH],
    ].join(path.delimiter);
    if (opts.userAgent) {
        env.npm_config_user_agent = opts.userAgent;
    }
    return env;
}

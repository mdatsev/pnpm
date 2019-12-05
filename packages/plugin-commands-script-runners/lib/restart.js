"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const renderHelp = require("render-help");
const run_1 = require("./run");
const start_1 = require("./start");
const stop_1 = require("./stop");
function types() {
    return {};
}
exports.types = types;
exports.commandNames = ['restart'];
function help() {
    return renderHelp({
        description: `Restarts a package. Runs a package's "stop", "restart", and "start" scripts, and associated pre- and post- scripts.`,
        usages: ['pnpm restart [-- <args>...]'],
    });
}
exports.help = help;
async function handler(args, opts) {
    await stop_1.handler(args, opts);
    await run_1.handler(['restart', ...args], opts);
    await start_1.handler(args, opts);
}
exports.handler = handler;

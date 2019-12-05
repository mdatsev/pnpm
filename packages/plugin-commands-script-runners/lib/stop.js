"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cli_utils_1 = require("@pnpm/cli-utils");
const renderHelp = require("render-help");
const run_1 = require("./run");
function types() {
    return {};
}
exports.types = types;
exports.commandNames = ['stop'];
function help() {
    return renderHelp({
        description: `Runs a package's "stop" script, if one was provided.`,
        url: cli_utils_1.docsUrl('stop'),
        usages: ['pnpm stop [-- <args>...]'],
    });
}
exports.help = help;
async function handler(args, opts) {
    return run_1.handler(['stop', ...args], opts);
}
exports.handler = handler;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cli_utils_1 = require("@pnpm/cli-utils");
const common_tags_1 = require("common-tags");
const renderHelp = require("render-help");
const run_1 = require("./run");
function types() {
    return {};
}
exports.types = types;
exports.commandNames = ['start'];
function help() {
    return renderHelp({
        description: common_tags_1.oneLine `
      Runs an arbitrary command specified in the package's "start" property of its "scripts" object.
      If no "start" property is specified on the "scripts" object, it will run node server.js.`,
        url: cli_utils_1.docsUrl('start'),
        usages: ['pnpm start [-- <args>...]'],
    });
}
exports.help = help;
async function handler(args, opts) {
    return run_1.handler(['start', ...args], opts);
}
exports.handler = handler;

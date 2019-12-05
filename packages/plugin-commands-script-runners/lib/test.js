"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cli_utils_1 = require("@pnpm/cli-utils");
const common_cli_options_help_1 = require("@pnpm/common-cli-options-help");
const config_1 = require("@pnpm/config");
const common_tags_1 = require("common-tags");
const R = require("ramda");
const renderHelp = require("render-help");
const run_1 = require("./run");
function types() {
    return R.pick([
        'recursive',
    ], config_1.types);
}
exports.types = types;
exports.commandNames = ['test', 't', 'tst'];
function help() {
    return renderHelp({
        aliases: ['t', 'tst'],
        description: `Runs a package's "test" script, if one was provided.`,
        descriptionLists: [
            {
                title: 'Options',
                list: [
                    {
                        description: common_tags_1.oneLine `
              Run the tests in every package found in subdirectories
              or every workspace package, when executed inside a workspace.
              For options that may be used with \`-r\`, see "pnpm help recursive"`,
                        name: '--recursive',
                        shortAlias: '-r',
                    },
                ],
            },
            common_cli_options_help_1.FILTERING,
        ],
        url: cli_utils_1.docsUrl('test'),
        usages: ['pnpm test [-- <args>...]'],
    });
}
exports.help = help;
async function handler(args, opts) {
    return run_1.handler(['test', ...args], opts);
}
exports.handler = handler;

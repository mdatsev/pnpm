"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cli_utils_1 = require("@pnpm/cli-utils");
const common_cli_options_help_1 = require("@pnpm/common-cli-options-help");
const config_1 = require("@pnpm/config");
const error_1 = require("@pnpm/error");
const common_tags_1 = require("common-tags");
const R = require("ramda");
const renderHelp = require("render-help");
const start_1 = require("./start");
const status_1 = require("./status");
const stop_1 = require("./stop");
function types() {
    return R.pick([
        'background',
        'ignore-stop-requests',
        'ignore-upload-requests',
        'port',
        'protocol',
        'store',
        'store-dir',
    ], config_1.types);
}
exports.types = types;
exports.commandNames = ['server'];
function help() {
    return renderHelp({
        description: 'Manage a store server',
        descriptionLists: [
            {
                title: 'Commands',
                list: [
                    {
                        description: common_tags_1.oneLine `
              Starts a service that does all interactions with the store.
              Other commands will delegate any store-related tasks to this service`,
                        name: 'start',
                    },
                    {
                        description: 'Stops the store server',
                        name: 'stop',
                    },
                    {
                        description: 'Prints information about the running server',
                        name: 'status',
                    },
                ],
            },
            {
                title: 'Start options',
                list: [
                    {
                        description: 'Runs the server in the background',
                        name: '--background',
                    },
                    {
                        description: 'The communication protocol used by the server',
                        name: '--protocol <auto|tcp|ipc>',
                    },
                    {
                        description: 'The port number to use, when TCP is used for communication',
                        name: '--port <number>',
                    },
                    common_cli_options_help_1.OPTIONS.storeDir,
                    {
                        description: 'Maximum number of concurrent network requests',
                        name: '--network-concurrency <number>',
                    },
                    {
                        description: "If false, doesn't check whether packages in the store were mutated",
                        name: '--[no-]verify-store-integrity',
                    },
                    {
                        name: '--[no-]lock',
                    },
                    {
                        description: 'Disallows stopping the server using \`pnpm server stop\`',
                        name: '--ignore-stop-requests',
                    },
                    {
                        description: 'Disallows creating new side effect cache during install',
                        name: '--ignore-upload-requests',
                    },
                    ...common_cli_options_help_1.UNIVERSAL_OPTIONS,
                ],
            },
        ],
        url: cli_utils_1.docsUrl('server'),
        usages: ['pnpm server <command>'],
    });
}
exports.help = help;
async function handler(input, opts) {
    switch (input[0]) {
        case 'start':
            return start_1.default(opts);
        case 'status':
            return status_1.default(opts);
        case 'stop':
            return stop_1.default(opts);
        default:
            help();
            if (input[0]) {
                throw new error_1.default('INVALID_SERVER_COMMAND', `"server ${input[0]}" is not a pnpm command. See "pnpm help server".`);
            }
    }
}
exports.handler = handler;

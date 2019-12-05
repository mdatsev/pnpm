"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cli_utils_1 = require("@pnpm/cli-utils");
const plugin_commands_installation_1 = require("@pnpm/plugin-commands-installation");
const plugin_commands_script_runners_1 = require("@pnpm/plugin-commands-script-runners");
const renderHelp = require("render-help");
exports.types = plugin_commands_installation_1.install.types;
exports.commandNames = ['install-test', 'it'];
function help() {
    return renderHelp({
        aliases: ['it'],
        description: 'Runs a \`pnpm install\` followed immediately by a \`pnpm test\`. It takes exactly the same arguments as \`pnpm install\`.',
        url: cli_utils_1.docsUrl('install-test'),
        usages: ['pnpm install-test'],
    });
}
exports.help = help;
async function handler(input, opts) {
    await plugin_commands_installation_1.install.handler(input, opts);
    await plugin_commands_script_runners_1.test.handler(input, opts);
}
exports.handler = handler;

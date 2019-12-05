"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cli_utils_1 = require("@pnpm/cli-utils");
const common_cli_options_help_1 = require("@pnpm/common-cli-options-help");
const config_1 = require("@pnpm/config");
const common_tags_1 = require("common-tags");
const R = require("ramda");
const renderHelp = require("render-help");
const install_1 = require("./install");
function types() {
    return R.pick([
        'depth',
        'dev',
        'engine-strict',
        'force',
        'global-dir',
        'global-pnpmfile',
        'global',
        'ignore-pnpmfile',
        'ignore-scripts',
        'latest',
        'lockfile-dir',
        'lockfile-directory',
        'lockfile-only',
        'lockfile',
        'offline',
        'only',
        'optional',
        'package-import-method',
        'pnpmfile',
        'prefer-offline',
        'production',
        'recursive',
        'registry',
        'reporter',
        'resolution-strategy',
        'save',
        'save-exact',
        'shamefully-flatten',
        'shamefully-hoist',
        'shared-workspace-lockfile',
        'side-effects-cache-readonly',
        'side-effects-cache',
        'store',
        'store-dir',
        'use-running-store-server',
    ], config_1.types);
}
exports.types = types;
exports.commandNames = ['update', 'up', 'upgrade'];
function help() {
    return renderHelp({
        aliases: ['up', 'upgrade'],
        descriptionLists: [
            {
                title: 'Options',
                list: [
                    {
                        description: common_tags_1.oneLine `Update in every package found in subdirectories
              or every workspace package, when executed inside a workspace.
              For options that may be used with \`-r\`, see "pnpm help recursive"`,
                        name: '--recursive',
                        shortAlias: '-r',
                    },
                    {
                        description: 'Update globally installed packages',
                        name: '--global',
                        shortAlias: '-g',
                    },
                    {
                        description: 'How deep should levels of dependencies be inspected. 0 is default, which means top-level dependencies',
                        name: '--depth <number>',
                    },
                    {
                        description: 'Ignore version ranges in package.json',
                        name: '--latest',
                        shortAlias: '-L',
                    },
                    common_cli_options_help_1.OPTIONS.globalDir,
                    ...common_cli_options_help_1.UNIVERSAL_OPTIONS,
                ],
            },
            common_cli_options_help_1.FILTERING,
        ],
        url: cli_utils_1.docsUrl('update'),
        usages: ['pnpm update [-g] [<pkg>...]'],
    });
}
exports.help = help;
async function handler(input, opts) {
    return install_1.handler(input, { ...opts, update: true, allowNew: false });
}
exports.handler = handler;

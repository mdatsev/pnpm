"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cli_utils_1 = require("@pnpm/cli-utils");
const common_cli_options_help_1 = require("@pnpm/common-cli-options-help");
const config_1 = require("@pnpm/config");
const common_tags_1 = require("common-tags");
const R = require("ramda");
const renderHelp = require("render-help");
const list_1 = require("./list");
function types() {
    return R.pick([
        'dev',
        'global-dir',
        'global',
        'json',
        'long',
        'only',
        'optional',
        'parseable',
        'production',
        'recursive',
    ], config_1.types);
}
exports.types = types;
exports.commandNames = ['why'];
function help() {
    return renderHelp({
        description: common_tags_1.stripIndent `
      Shows the packages that depend on <pkg>
      For example: pnpm why babel-* eslint-*`,
        descriptionLists: [
            {
                title: 'Options',
                list: [
                    {
                        description: common_tags_1.oneLine `Perform command on every package in subdirectories
              or on every workspace package, when executed inside a workspace.
              For options that may be used with \`-r\`, see "pnpm help recursive"`,
                        name: '--recursive',
                        shortAlias: '-r',
                    },
                    {
                        description: 'Show extended information',
                        name: '--long',
                    },
                    {
                        description: 'Show parseable output instead of tree view',
                        name: '--parseable',
                    },
                    {
                        description: 'Show information in JSON format',
                        name: '--json',
                    },
                    {
                        description: 'List packages in the global install prefix instead of in the current project',
                        name: '--global',
                        shortAlias: '-g',
                    },
                    {
                        description: 'Display only the dependency tree for packages in \`dependencies\`',
                        name: '--prod, --production',
                    },
                    {
                        description: 'Display only the dependency tree for packages in \`devDependencies\`',
                        name: '--dev',
                    },
                    common_cli_options_help_1.OPTIONS.globalDir,
                    ...common_cli_options_help_1.UNIVERSAL_OPTIONS,
                ],
            },
            common_cli_options_help_1.FILTERING,
        ],
        url: cli_utils_1.docsUrl('why'),
        usages: [
            'pnpm why <pkg> ...',
        ],
    });
}
exports.help = help;
exports.handler = list_1.handler;

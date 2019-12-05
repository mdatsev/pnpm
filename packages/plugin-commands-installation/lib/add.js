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
        'child-concurrency',
        'engine-strict',
        'force',
        'global-dir',
        'global-pnpmfile',
        'global',
        'hoist',
        'hoist-pattern',
        'ignore-pnpmfile',
        'ignore-scripts',
        'ignore-workspace-root-check',
        'independent-leaves',
        'link-workspace-packages',
        'lock',
        'lockfile-dir',
        'lockfile-directory',
        'lockfile-only',
        'lockfile',
        'package-import-method',
        'pnpmfile',
        'prefer-offline',
        'production',
        'recursive',
        'registry',
        'reporter',
        'resolution-strategy',
        'save-dev',
        'save-exact',
        'save-optional',
        'save-peer',
        'save-prod',
        'save-workspace-protocol',
        'shamefully-flatten',
        'shamefully-hoist',
        'shared-workspace-lockfile',
        'side-effects-cache-readonly',
        'side-effects-cache',
        'store',
        'store-dir',
        'strict-peer-dependencies',
        'offline',
        'only',
        'optional',
        'use-running-store-server',
        'use-store-server',
        'verify-store-integrity',
        'virtual-store-dir',
    ], config_1.types);
}
exports.types = types;
exports.commandNames = ['add'];
function help() {
    return renderHelp({
        description: 'Installs a package and any packages that it depends on.',
        descriptionLists: [
            {
                title: 'Options',
                list: [
                    {
                        description: 'Save package to your \`dependencies\`. The default behavior',
                        name: '--save-prod',
                        shortAlias: '-P',
                    },
                    {
                        description: 'Save package to your \`devDependencies\`',
                        name: '--save-dev',
                        shortAlias: '-D',
                    },
                    {
                        description: 'Save package to your \`optionalDependencies\`',
                        name: '--save-optional',
                        shortAlias: '-O',
                    },
                    {
                        description: 'Save package to your \`peerDependencies\` and \`devDependencies\`',
                        name: '--save-peer',
                    },
                    {
                        description: 'Install exact version',
                        name: '--[no-]save-exact',
                        shortAlias: '-E',
                    },
                    {
                        description: 'Save packages from the workspace with a "workspace:" protocol. True by default',
                        name: '--[no-]save-workspace-protocol',
                    },
                    {
                        description: 'Install as a global package',
                        name: '--global',
                        shortAlias: '-g',
                    },
                    {
                        description: common_tags_1.oneLine `Run installation recursively in every package found in subdirectories
              or in every workspace package, when executed inside a workspace.
              For options that may be used with \`-r\`, see "pnpm help recursive"`,
                        name: '--recursive',
                        shortAlias: '-r',
                    },
                    common_cli_options_help_1.OPTIONS.ignoreScripts,
                    common_cli_options_help_1.OPTIONS.offline,
                    common_cli_options_help_1.OPTIONS.preferOffline,
                    common_cli_options_help_1.OPTIONS.storeDir,
                    common_cli_options_help_1.OPTIONS.virtualStoreDir,
                    common_cli_options_help_1.OPTIONS.globalDir,
                    ...common_cli_options_help_1.UNIVERSAL_OPTIONS,
                ],
            },
            common_cli_options_help_1.FILTERING,
        ],
        url: cli_utils_1.docsUrl('add'),
        usages: [
            'pnpm add <name>',
            'pnpm add <name>@<tag>',
            'pnpm add <name>@<version>',
            'pnpm add <name>@<version range>',
            'pnpm add <git host>:<git user>/<repo name>',
            'pnpm add <git repo url>',
            'pnpm add <tarball file>',
            'pnpm add <tarball url>',
            'pnpm add <dir>',
        ],
    });
}
exports.help = help;
async function handler(input, opts, invocation) {
    return install_1.handler(input, opts, invocation);
}
exports.handler = handler;

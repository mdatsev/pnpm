"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cli_utils_1 = require("@pnpm/cli-utils");
const common_cli_options_help_1 = require("@pnpm/common-cli-options-help");
const config_1 = require("@pnpm/config");
const find_workspace_packages_1 = require("@pnpm/find-workspace-packages");
const pnpmfile_1 = require("@pnpm/pnpmfile");
const store_connection_manager_1 = require("@pnpm/store-connection-manager");
const common_tags_1 = require("common-tags");
const R = require("ramda");
const renderHelp = require("render-help");
const supi_1 = require("supi");
function types() {
    return R.pick([
        'force',
        'global-dir',
        'global-pnpmfile',
        'global',
        'lockfile-dir',
        'lockfile-directory',
        'lockfile-only',
        'lockfile',
        'package-import-method',
        'pnpmfile',
        'recursive',
        'reporter',
        'resolution-strategy',
        'shared-workspace-lockfile',
        'store',
        'store-dir',
        'virtual-store-dir',
    ], config_1.types);
}
exports.types = types;
function help() {
    return renderHelp({
        aliases: ['rm', 'r', 'uninstall', 'un'],
        description: `Removes packages from \`node_modules\` and from the project's \`packages.json\`.`,
        descriptionLists: [
            {
                title: 'Options',
                list: [
                    {
                        description: common_tags_1.oneLine `
              Remove from every package found in subdirectories
              or from every workspace package, when executed inside a workspace.
              For options that may be used with \`-r\`, see "pnpm help recursive"
            `,
                        name: '--recursive',
                        shortAlias: '-r',
                    },
                    common_cli_options_help_1.OPTIONS.globalDir,
                    ...common_cli_options_help_1.UNIVERSAL_OPTIONS,
                ],
            },
            common_cli_options_help_1.FILTERING,
        ],
        url: cli_utils_1.docsUrl('remove'),
        usages: ['pnpm remove <pkg>[@<version>]...'],
    });
}
exports.help = help;
exports.commandNames = ['remove', 'uninstall', 'r', 'rm', 'un'];
async function handler(input, opts) {
    const store = await store_connection_manager_1.createOrConnectStoreController(opts);
    const removeOpts = Object.assign(opts, {
        storeController: store.ctrl,
        storeDir: store.dir,
    });
    if (!opts.ignorePnpmfile) {
        removeOpts['hooks'] = pnpmfile_1.requireHooks(opts.lockfileDir || opts.dir, opts);
    }
    removeOpts['localPackages'] = opts.linkWorkspacePackages && opts.workspaceDir
        ? find_workspace_packages_1.arrayOfLocalPackagesToMap(await find_workspace_packages_1.default(opts.workspaceDir, opts))
        : undefined;
    const currentManifest = await cli_utils_1.readImporterManifest(opts.dir, opts);
    const [mutationResult] = await supi_1.mutateModules([
        {
            binsDir: opts.bin,
            dependencyNames: input,
            manifest: currentManifest.manifest,
            mutation: 'uninstallSome',
            rootDir: opts.dir,
        },
    ], removeOpts);
    await currentManifest.writeImporterManifest(mutationResult.manifest);
}
exports.handler = handler;

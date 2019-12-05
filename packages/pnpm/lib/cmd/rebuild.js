"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cli_utils_1 = require("@pnpm/cli-utils");
const common_cli_options_help_1 = require("@pnpm/common-cli-options-help");
const config_1 = require("@pnpm/config");
const store_connection_manager_1 = require("@pnpm/store-connection-manager");
const common_tags_1 = require("common-tags");
const R = require("ramda");
const renderHelp = require("render-help");
const supi_1 = require("supi");
function types() {
    return R.pick([
        'recursive',
    ], config_1.types);
}
exports.types = types;
exports.commandNames = ['rebuild', 'rb'];
function help() {
    return renderHelp({
        aliases: ['rb'],
        description: 'Rebuild a package.',
        descriptionLists: [
            {
                title: 'Options',
                list: [
                    {
                        description: common_tags_1.oneLine `Rebuild every package found in subdirectories
              or every workspace package, when executed inside a workspace.
              For options that may be used with \`-r\`, see "pnpm help recursive"`,
                        name: '--recursive',
                        shortAlias: '-r',
                    },
                    {
                        description: 'Rebuild packages that were not build during installation. Packages are not build when installing with the --ignore-scripts flag',
                        name: '--pending',
                    },
                    ...common_cli_options_help_1.UNIVERSAL_OPTIONS,
                ],
            },
            common_cli_options_help_1.FILTERING,
        ],
        url: cli_utils_1.docsUrl('rebuild'),
        usages: ['pnpm rebuild [<pkg> ...]'],
    });
}
exports.help = help;
async function handler(args, opts, command) {
    const store = await store_connection_manager_1.createOrConnectStoreController(opts);
    const rebuildOpts = Object.assign(opts, {
        storeController: store.ctrl,
        storeDir: store.dir,
    });
    if (args.length === 0) {
        await supi_1.rebuild([
            {
                buildIndex: 0,
                manifest: await cli_utils_1.readImporterManifestOnly(rebuildOpts.dir, opts),
                rootDir: rebuildOpts.dir,
            },
        ], rebuildOpts);
    }
    await supi_1.rebuildPkgs([
        {
            manifest: await cli_utils_1.readImporterManifestOnly(rebuildOpts.dir, opts),
            rootDir: rebuildOpts.dir,
        },
    ], args, rebuildOpts);
}
exports.handler = handler;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cli_utils_1 = require("@pnpm/cli-utils");
const common_cli_options_help_1 = require("@pnpm/common-cli-options-help");
const store_connection_manager_1 = require("@pnpm/store-connection-manager");
const common_tags_1 = require("common-tags");
const renderHelp = require("render-help");
const supi_1 = require("supi");
const install_1 = require("./install");
exports.types = install_1.types;
exports.commandNames = ['unlink', 'dislink'];
function help() {
    return renderHelp({
        aliases: ['dislink'],
        description: 'Removes the link created by \`pnpm link\` and reinstalls package if it is saved in \`package.json\`',
        descriptionLists: [
            {
                title: 'Options',
                list: [
                    {
                        description: common_tags_1.oneLine `
              Unlink in every package found in subdirectories
              or in every workspace package, when executed inside a workspace.
              For options that may be used with \`-r\`, see "pnpm help recursive"`,
                        name: '--recursive',
                        shortAlias: '-r',
                    },
                    ...common_cli_options_help_1.UNIVERSAL_OPTIONS,
                ],
            },
        ],
        url: cli_utils_1.docsUrl('unlink'),
        usages: [
            'pnpm unlink (in package dir)',
            'pnpm unlink <pkg>...',
        ],
    });
}
exports.help = help;
async function handler(input, opts) {
    const store = await store_connection_manager_1.createOrConnectStoreController(opts);
    const unlinkOpts = Object.assign(opts, {
        storeController: store.ctrl,
        storeDir: store.dir,
    });
    if (!input || !input.length) {
        return supi_1.mutateModules([
            {
                dependencyNames: input,
                manifest: await cli_utils_1.readImporterManifestOnly(opts.dir, opts),
                mutation: 'unlinkSome',
                rootDir: opts.dir,
            },
        ], unlinkOpts);
    }
    return supi_1.mutateModules([
        {
            manifest: await cli_utils_1.readImporterManifestOnly(opts.dir, opts),
            mutation: 'unlink',
            rootDir: opts.dir,
        },
    ], unlinkOpts);
}
exports.handler = handler;

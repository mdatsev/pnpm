"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cli_utils_1 = require("@pnpm/cli-utils");
const common_cli_options_help_1 = require("@pnpm/common-cli-options-help");
const config_1 = require("@pnpm/config");
const store_connection_manager_1 = require("@pnpm/store-connection-manager");
const R = require("ramda");
const renderHelp = require("render-help");
const supi_1 = require("supi");
function types() {
    return R.pick([
        'production',
    ], config_1.types);
}
exports.types = types;
exports.commandNames = ['prune'];
function help() {
    return renderHelp({
        description: 'Removes extraneous packages',
        descriptionLists: [
            {
                title: 'Options',
                list: [
                    {
                        description: 'Remove the packages specified in \`devDependencies\`',
                        name: '--prod, --production',
                    },
                    ...common_cli_options_help_1.UNIVERSAL_OPTIONS,
                ],
            },
        ],
        url: cli_utils_1.docsUrl('prune'),
        usages: ['pnpm prune [--production]'],
    });
}
exports.help = help;
async function handler(input, opts) {
    const store = await store_connection_manager_1.createOrConnectStoreController(opts);
    return supi_1.mutateModules([
        {
            buildIndex: 0,
            manifest: await cli_utils_1.readImporterManifestOnly(process.cwd(), opts),
            mutation: 'install',
            pruneDirectDependencies: true,
            rootDir: process.cwd(),
        },
    ], {
        ...opts,
        pruneStore: true,
        storeController: store.ctrl,
        storeDir: store.dir,
    });
}
exports.handler = handler;

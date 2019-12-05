"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cli_utils_1 = require("@pnpm/cli-utils");
const config_1 = require("@pnpm/config");
const error_1 = require("@pnpm/error");
const logger_1 = require("@pnpm/logger");
const store_connection_manager_1 = require("@pnpm/store-connection-manager");
const store_path_1 = require("@pnpm/store-path");
const archy = require("archy");
const common_tags_1 = require("common-tags");
const R = require("ramda");
const renderHelp = require("render-help");
const supi_1 = require("supi");
function types() {
    return R.pick([
        'registry',
        'store',
        'store-dir',
    ], config_1.types);
}
exports.types = types;
exports.commandNames = ['store'];
function help() {
    return renderHelp({
        description: 'Reads and performs actions on pnpm store that is on the current filesystem.',
        descriptionLists: [
            {
                title: 'Commands',
                list: [
                    {
                        description: common_tags_1.oneLine `
              Checks for modified packages in the store.
              Returns exit code 0 if the content of the package is the same as it was at the time of unpacking
            `,
                        name: 'status',
                    },
                    {
                        description: 'Adds new packages to the store. Example: pnpm store add express@4 typescript@2.1.0',
                        name: 'add <pkg>...',
                    },
                    {
                        description: 'Lists all pnpm projects on the current filesystem that depend on the specified packages. Example: pnpm store usages flatmap-stream',
                        name: 'usages <pkg>...',
                    },
                    {
                        description: common_tags_1.oneLine `
              Removes unreferenced (extraneous, orphan) packages from the store.
              Pruning the store is not harmful, but might slow down future installations.
              Visit the documentation for more information on unreferenced packages and why they occur
            `,
                        name: 'prune',
                    },
                ],
            },
        ],
        url: cli_utils_1.docsUrl('store'),
        usages: ['pnpm store <command>'],
    });
}
exports.help = help;
class StoreStatusError extends error_1.default {
    constructor(modified) {
        super('MODIFIED_DEPENDENCY', '');
        this.modified = modified;
    }
}
async function handler(input, opts) {
    let store;
    switch (input[0]) {
        case 'status':
            return statusCmd(opts);
        case 'prune':
            store = await store_connection_manager_1.createOrConnectStoreController(opts);
            const storePruneOptions = Object.assign(opts, {
                storeController: store.ctrl,
                storeDir: store.dir,
            });
            return supi_1.storePrune(storePruneOptions);
        case 'add':
            store = await store_connection_manager_1.createOrConnectStoreController(opts);
            return supi_1.storeAdd(input.slice(1), {
                prefix: opts.dir,
                registries: opts.registries,
                reporter: opts.reporter,
                storeController: store.ctrl,
                tag: opts.tag,
            });
        case 'usages':
            store = await store_connection_manager_1.createOrConnectStoreController(opts);
            const packageSelectors = input.slice(1);
            const packageUsagesBySelectors = await supi_1.storeUsages(packageSelectors, {
                reporter: opts.reporter,
                storeController: store.ctrl,
            });
            prettyPrintUsages(packageSelectors, packageUsagesBySelectors);
            return;
        default:
            return help();
            if (input[0]) {
                throw new error_1.default('INVALID_STORE_COMMAND', `"store ${input[0]}" is not a pnpm command. See "pnpm help store".`);
            }
    }
}
exports.handler = handler;
async function statusCmd(opts) {
    const modifiedPkgs = await supi_1.storeStatus(Object.assign(opts, {
        storeDir: await store_path_1.default(opts.dir, opts.storeDir),
    }));
    if (!modifiedPkgs || !modifiedPkgs.length) {
        logger_1.default.info({
            message: 'Packages in the store are untouched',
            prefix: opts.dir,
        });
        return;
    }
    throw new StoreStatusError(modifiedPkgs);
}
/**
 * Uses archy to output package usages in a directory-tree like format.
 * @param packageUsages a list of PackageUsage, one per query
 */
function prettyPrintUsages(selectors, packageUsagesBySelectors) {
    // Create nodes for top level usage response
    const packageUsageNodes = selectors.map((selector) => {
        // Create label for root node
        const label = `Package: ${selector}`;
        if (!packageUsagesBySelectors[selector].length) {
            // If not found in store, just output string
            return {
                label,
                nodes: [
                    'Not found in store'
                ]
            };
        }
        // This package was found in the store, create children for all package ids
        const foundPackagesNodes = packageUsagesBySelectors[selector].map((foundPackage) => {
            const label = `Package in store: ${foundPackage.packageId}`;
            // Now create children for all locations this package id is used
            const locations = foundPackage.usages;
            const locationNodes = locations.map(location => {
                return {
                    label: 'Project with dependency: ' + location
                };
            });
            // Now create node for the package found in the store
            return {
                label,
                nodes: locationNodes.length === 0 ? ['No pnpm projects using this package'] : locationNodes
            };
        });
        // Now create node for the original query
        return {
            label,
            nodes: foundPackagesNodes
        };
    });
    const rootTrees = packageUsageNodes.map(node => archy(node));
    rootTrees.forEach(tree => logger_1.globalInfo(tree));
}

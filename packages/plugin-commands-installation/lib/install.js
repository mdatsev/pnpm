"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cli_utils_1 = require("@pnpm/cli-utils");
const common_cli_options_help_1 = require("@pnpm/common-cli-options-help");
const config_1 = require("@pnpm/config");
const constants_1 = require("@pnpm/constants");
const error_1 = require("@pnpm/error");
const find_workspace_packages_1 = require("@pnpm/find-workspace-packages");
const recursive_1 = require("@pnpm/plugin-commands-recursive/lib/recursive");
const pnpmfile_1 = require("@pnpm/pnpmfile");
const store_connection_manager_1 = require("@pnpm/store-connection-manager");
const common_tags_1 = require("common-tags");
const R = require("ramda");
const renderHelp = require("render-help");
const supi_1 = require("supi");
const OVERWRITE_UPDATE_OPTIONS = {
    allowNew: true,
    update: false,
};
function types() {
    return R.pick([
        'child-concurrency',
        'dev',
        'engine-strict',
        'frozen-lockfile',
        'force',
        'global-dir',
        'global-pnpmfile',
        'global',
        'hoist',
        'hoist-pattern',
        'ignore-pnpmfile',
        'ignore-scripts',
        'independent-leaves',
        'link-workspace-packages',
        'lock',
        'lockfile-dir',
        'lockfile-directory',
        'lockfile-only',
        'lockfile',
        'package-import-method',
        'pnpmfile',
        'prefer-frozen-lockfile',
        'prefer-offline',
        'production',
        'recursive',
        'registry',
        'reporter',
        'resolution-strategy',
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
exports.commandNames = ['install', 'i'];
function help() {
    return renderHelp({
        aliases: ['i'],
        description: common_tags_1.oneLine `Installs all dependencies of the project in the current working directory.
      When executed inside a workspace, installs all dependencies of all workspace packages.`,
        descriptionLists: [
            {
                title: 'Options',
                list: [
                    {
                        description: common_tags_1.oneLine `
              Run installation recursively in every package found in subdirectories.
              For options that may be used with \`-r\`, see "pnpm help recursive"`,
                        name: '--recursive',
                        shortAlias: '-r',
                    },
                    common_cli_options_help_1.OPTIONS.ignoreScripts,
                    common_cli_options_help_1.OPTIONS.offline,
                    common_cli_options_help_1.OPTIONS.preferOffline,
                    common_cli_options_help_1.OPTIONS.globalDir,
                    {
                        description: "Packages in \`devDependencies\` won't be installed",
                        name: '--production, --only prod[uction]',
                    },
                    {
                        description: 'Only \`devDependencies\` are installed regardless of the \`NODE_ENV\`',
                        name: '--only dev[elopment]',
                    },
                    {
                        description: `Don't read or generate a \`${constants_1.WANTED_LOCKFILE}\` file`,
                        name: '--no-lockfile',
                    },
                    {
                        description: `Dependencies are not downloaded. Only \`${constants_1.WANTED_LOCKFILE}\` is updated`,
                        name: '--lockfile-only',
                    },
                    {
                        description: "Don't generate a lockfile and fail if an update is needed",
                        name: '--frozen-lockfile',
                    },
                    {
                        description: `If the available \`${constants_1.WANTED_LOCKFILE}\` satisfies the \`package.json\` then perform a headless installation`,
                        name: '--prefer-frozen-lockfile',
                    },
                    {
                        description: `The directory in which the ${constants_1.WANTED_LOCKFILE} of the package will be created. Several projects may share a single lockfile`,
                        name: '--lockfile-dir <dir>',
                    },
                    {
                        description: 'Dependencies inside node_modules have access only to their listed dependencies',
                        name: '--no-hoist',
                    },
                    {
                        description: 'The subdeps will be hoisted into the root node_modules. Your code will have access to them',
                        name: '--shamefully-hoist',
                    },
                    {
                        description: common_tags_1.oneLine `
              Hoist all dependencies matching the pattern to \`node_modules/.pnpm/node_modules\`.
              The default pattern is * and matches everything. Hoisted packages can be required
              by any dependencies, so it is an emulation of a flat node_modules`,
                        name: '--hoist-pattern <pattern>',
                    },
                    common_cli_options_help_1.OPTIONS.storeDir,
                    common_cli_options_help_1.OPTIONS.virtualStoreDir,
                    {
                        description: 'Maximum number of concurrent network requests',
                        name: '--network-concurrency <number>',
                    },
                    {
                        description: 'Controls the number of child processes run parallelly to build node modules',
                        name: '--child-concurrency <number>',
                    },
                    {
                        description: 'Disable pnpm hooks defined in pnpmfile.js',
                        name: '--ignore-pnpmfile',
                    },
                    {
                        description: 'Symlinks leaf dependencies directly from the global store',
                        name: '--independent-leaves',
                    },
                    {
                        description: "If false, doesn't check whether packages in the store were mutated",
                        name: '--[no-]verify-store-integrity',
                    },
                    {
                        name: '--[no-]lock',
                    },
                    {
                        description: 'Fail on missing or invalid peer dependencies',
                        name: '--strict-peer-dependencies',
                    },
                    {
                        description: 'Starts a store server in the background. The store server will keep running after installation is done. To stop the store server, run \`pnpm server stop\`',
                        name: '--use-store-server',
                    },
                    {
                        description: 'Only allows installation with a store server. If no store server is running, installation will fail',
                        name: '--use-running-store-server',
                    },
                    {
                        description: 'Clones/hardlinks or copies packages. The selected method depends from the file system',
                        name: '--package-import-method auto',
                    },
                    {
                        description: 'Hardlink packages from the store',
                        name: '--package-import-method hardlink',
                    },
                    {
                        description: 'Copy packages from the store',
                        name: '--package-import-method copy',
                    },
                    {
                        description: 'Clone (aka copy-on-write) packages from the store',
                        name: '--package-import-method clone',
                    },
                    {
                        description: 'The default resolution strategy. Speed is preferred over deduplication',
                        name: '--resolution-strategy fast',
                    },
                    {
                        description: 'Already installed dependencies are preferred even if newer versions satisfy a range',
                        name: '--resolution-strategy fewer-dependencies',
                    },
                    ...common_cli_options_help_1.UNIVERSAL_OPTIONS,
                ],
            },
            {
                title: 'Output',
                list: [
                    {
                        description: 'No output is logged to the console, except fatal errors',
                        name: '--silent, --reporter silent',
                        shortAlias: '-s',
                    },
                    {
                        description: 'The default reporter when the stdout is TTY',
                        name: '--reporter default',
                    },
                    {
                        description: 'The output is always appended to the end. No cursor manipulations are performed',
                        name: '--reporter append-only',
                    },
                    {
                        description: 'The most verbose reporter. Prints all logs in ndjson format',
                        name: '--reporter ndjson',
                    },
                ],
            },
            common_cli_options_help_1.FILTERING,
            {
                title: 'Experimental options',
                list: [
                    {
                        description: 'Use or cache the results of (pre/post)install hooks',
                        name: '--side-effects-cache',
                    },
                    {
                        description: 'Only use the side effects cache if present, do not create it for new packages',
                        name: '--side-effects-cache-readonly',
                    },
                ],
            },
        ],
        url: cli_utils_1.docsUrl('install'),
        usages: ['pnpm install [options]'],
    });
}
exports.help = help;
async function handler(input, opts, invocation) {
    // `pnpm install ""` is going to be just `pnpm install`
    input = input.filter(Boolean);
    const dir = opts.dir || process.cwd();
    const localPackages = opts.linkWorkspacePackages && opts.workspaceDir
        ? find_workspace_packages_1.arrayOfLocalPackagesToMap(await find_workspace_packages_1.default(opts.workspaceDir, opts))
        : undefined;
    const store = await store_connection_manager_1.createOrConnectStoreController(opts);
    const installOpts = {
        ...opts,
        // In case installation is done in a multi-package repository
        // The dependencies should be built first,
        // so ignoring scripts for now
        ignoreScripts: !!localPackages || opts.ignoreScripts,
        localPackages,
        storeController: store.ctrl,
        storeDir: store.dir,
        forceHoistPattern: typeof opts.rawLocalConfig['hoist-pattern'] !== 'undefined' || typeof opts.rawLocalConfig['hoist'] !== 'undefined',
        forceIndependentLeaves: typeof opts.rawLocalConfig['independent-leaves'] !== 'undefined',
        forceShamefullyHoist: typeof opts.rawLocalConfig['shamefully-hoist'] !== 'undefined',
    };
    if (!opts.ignorePnpmfile) {
        installOpts['hooks'] = pnpmfile_1.requireHooks(opts.lockfileDir || dir, opts);
    }
    let { manifest, writeImporterManifest } = await cli_utils_1.tryReadImporterManifest(opts.dir, opts);
    if (manifest === null) {
        if (opts.update) {
            throw new error_1.default('NO_IMPORTER_MANIFEST', 'No package.json found');
        }
        manifest = {};
    }
    if (opts.update && opts.latest) {
        if (!input || !input.length) {
            input = cli_utils_1.updateToLatestSpecsFromManifest(manifest, opts.include);
        }
        else {
            input = cli_utils_1.createLatestSpecs(input, manifest);
        }
        delete installOpts.include;
    }
    if (!input || !input.length) {
        if (invocation === 'add') {
            throw new error_1.default('MISSING_PACKAGE_NAME', '`pnpm add` requires the package name');
        }
        const updatedManifest = await supi_1.install(manifest, installOpts);
        if (opts.update === true && opts.save !== false) {
            await writeImporterManifest(updatedManifest);
        }
    }
    else {
        const [updatedImporter] = await supi_1.mutateModules([
            {
                allowNew: opts.allowNew,
                binsDir: installOpts.bin,
                dependencySelectors: input,
                manifest,
                mutation: 'installSome',
                peer: opts.savePeer,
                pinnedVersion: cli_utils_1.getPinnedVersion(opts),
                rootDir: installOpts.dir,
                targetDependenciesField: cli_utils_1.getSaveType(installOpts),
            },
        ], installOpts);
        if (opts.save !== false) {
            await writeImporterManifest(updatedImporter.manifest);
        }
    }
    if (opts.linkWorkspacePackages && opts.workspaceDir) {
        // TODO: reuse somehow the previous read of packages
        // this is not optimal
        const allWorkspacePkgs = await find_workspace_packages_1.default(opts.workspaceDir, opts);
        await recursive_1.recursive(allWorkspacePkgs, [], {
            ...opts,
            ...OVERWRITE_UPDATE_OPTIONS,
            ignoredPackages: new Set([dir]),
            packageSelectors: [
                {
                    pattern: dir,
                    scope: 'dependencies',
                    selectBy: 'location',
                },
            ],
            workspaceDir: opts.workspaceDir,
        }, 'install', 'install');
        if (opts.ignoreScripts)
            return;
        await supi_1.rebuild([
            {
                buildIndex: 0,
                manifest: await cli_utils_1.readImporterManifestOnly(opts.dir, opts),
                rootDir: opts.dir,
            },
        ], {
            ...opts,
            pending: true,
            storeController: store.ctrl,
            storeDir: store.dir,
        });
    }
}
exports.handler = handler;

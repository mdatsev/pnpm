"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cli_utils_1 = require("@pnpm/cli-utils");
const common_cli_options_help_1 = require("@pnpm/common-cli-options-help");
const config_1 = require("@pnpm/config");
const constants_1 = require("@pnpm/constants");
const core_loggers_1 = require("@pnpm/core-loggers");
const error_1 = require("@pnpm/error");
const find_workspace_packages_1 = require("@pnpm/find-workspace-packages");
const logger_1 = require("@pnpm/logger");
const pnpmfile_1 = require("@pnpm/pnpmfile");
const store_connection_manager_1 = require("@pnpm/store-connection-manager");
const camelcaseKeys = require("camelcase-keys");
const common_tags_1 = require("common-tags");
const graphSequencer = require("graph-sequencer");
const isSubdir = require("is-subdir");
const mem = require("mem");
const fs = require("mz/fs");
const pFilter = require("p-filter");
const p_limit_1 = require("p-limit");
const path = require("path");
const pkgs_graph_1 = require("pkgs-graph");
const R = require("ramda");
const readIniFile = require("read-ini-file");
const renderHelp = require("render-help");
const supi_1 = require("supi");
const exec_1 = require("./exec");
const filter_1 = require("./filter");
const list_1 = require("./list");
const outdated_1 = require("./outdated");
const parsePackageSelectors_1 = require("./parsePackageSelectors");
const recursiveSummary_1 = require("./recursiveSummary");
const run_1 = require("./run");
const supportedRecursiveCommands = new Set([
    'add',
    'install',
    'remove',
    'update',
    'unlink',
    'list',
    'why',
    'outdated',
    'rebuild',
    'run',
    'test',
    'exec',
]);
function getCommandFullName(commandName) {
    switch (commandName) {
        case 'i':
            return 'install';
        case 'r':
        case 'rm':
        case 'un':
        case 'uninstall':
            return 'remove';
        case 'up':
        case 'upgrade':
            return 'update';
        case 'dislink':
            return 'unlink';
        case 'ls':
        case 'la':
        case 'll':
            return 'list';
        case 'rb':
            return 'rebuild';
        case 'run-script':
            return 'run';
        case 't':
        case 'tst':
            return 'test';
    }
    return commandName;
}
function types() {
    return {
        recursive: Boolean,
        ...R.pick([
            'bail',
            'link-workspace-packages',
            'reporter',
            'shared-workspace-lockfile',
            'sort',
            'workspace-concurrency',
        ], config_1.types),
    };
}
exports.types = types;
exports.commandNames = ['recursive', 'multi', 'm'];
function help() {
    return renderHelp({
        description: common_tags_1.oneLine `
      Concurrently performs some actions in all subdirectories with a \`package.json\` (excluding node_modules).
      A \`pnpm-workspace.yaml\` file may be used to control what directories are searched for packages.`,
        descriptionLists: [
            {
                title: 'Commands',
                list: [
                    {
                        name: 'install',
                    },
                    {
                        name: 'add',
                    },
                    {
                        name: 'update',
                    },
                    {
                        description: 'Uninstall a dependency from each package',
                        name: 'remove <pkg>...',
                    },
                    {
                        description: 'Removes links to local packages and reinstalls them from the registry.',
                        name: 'unlink',
                    },
                    {
                        description: 'List dependencies in each package.',
                        name: 'list [<pkg>...]',
                    },
                    {
                        description: 'List packages that depend on <pkg>.',
                        name: 'why <pkg>...',
                    },
                    {
                        description: 'Check for outdated dependencies in every package.',
                        name: 'outdated [<pkg>...]',
                    },
                    {
                        description: common_tags_1.oneLine `
              This runs an arbitrary command from each package's "scripts" object.
              If a package doesn't have the command, it is skipped.
              If none of the packages have the command, the command fails.`,
                        name: 'run <command> [-- <args>...]',
                    },
                    {
                        description: `This runs each package's "test" script, if one was provided.`,
                        name: 'test [-- <args>...]',
                    },
                    {
                        description: common_tags_1.oneLine `
              This command runs the "npm build" command on each package.
              This is useful when you install a new version of node,
              and must recompile all your C++ addons with the new binary.`,
                        name: 'rebuild [[<@scope>/<name>]...]',
                    },
                    {
                        description: `Run a command in each package.`,
                        name: 'exec -- <command> [args...]',
                    },
                ],
            },
            {
                title: 'Options',
                list: [
                    {
                        description: 'Continues executing other tasks even if a task threw an error.',
                        name: '--no-bail',
                    },
                    {
                        description: 'Set the maximum number of concurrency. Default is 4. For unlimited concurrency use Infinity.',
                        name: '--workspace-concurrency <number>',
                    },
                    {
                        description: common_tags_1.oneLine `
              Locally available packages are linked to node_modules instead of being downloaded from the registry.
              Convenient to use in a multi-package repository.`,
                        name: '--link-workspace-packages',
                    },
                    {
                        description: 'Sort packages topologically (dependencies before dependents). Pass --no-sort to disable.',
                        name: '--sort',
                    },
                    {
                        description: common_tags_1.oneLine `
              Creates a single ${constants_1.WANTED_LOCKFILE} file in the root of the workspace.
              A shared lockfile also means that all dependencies of all workspace packages will be in a single node_modules.`,
                        name: '--shared-workspace-lockfile',
                    },
                ],
            },
            common_cli_options_help_1.FILTERING,
        ],
        url: cli_utils_1.docsUrl('recursive'),
        usages: [
            'pnpm recursive [command] [flags] [--filter <package selector>]',
            'pnpm multi [command] [flags] [--filter <package selector>]',
            'pnpm m [command] [flags] [--filter <package selector>]'
        ],
    });
}
exports.help = help;
async function handler(input, opts) {
    var _a;
    if (opts.workspaceConcurrency < 1) {
        throw new error_1.default('INVALID_WORKSPACE_CONCURRENCY', 'Workspace concurrency should be at least 1');
    }
    const cmd = input.shift();
    if (!cmd) {
        help();
        return undefined;
    }
    const cmdFullName = getCommandFullName(cmd);
    if (!supportedRecursiveCommands.has(cmdFullName)) {
        help();
        throw new error_1.default('INVALID_RECURSIVE_COMMAND', `"recursive ${cmdFullName}" is not a pnpm command. See "pnpm help recursive".`);
    }
    const workspaceDir = (_a = opts.workspaceDir, (_a !== null && _a !== void 0 ? _a : process.cwd()));
    const allWorkspacePkgs = await find_workspace_packages_1.default(workspaceDir, opts);
    if (!allWorkspacePkgs.length) {
        logger_1.default.info({ message: `No packages found in "${workspaceDir}"`, prefix: workspaceDir });
        return undefined;
    }
    if (opts.filter) {
        // TODO: maybe @pnpm/config should return this in a parsed form already?
        // We don't use opts.prefix in this case because opts.prefix searches for a package.json in parent directories and
        // selects the directory where it finds one
        opts['packageSelectors'] = opts.filter.map((f) => parsePackageSelectors_1.default(f, process.cwd())); // tslint:disable-line
    }
    const atLeastOnePackageMatched = await recursive(allWorkspacePkgs, input, { ...opts, workspaceDir }, cmdFullName, cmd);
    if (typeof atLeastOnePackageMatched === 'string') {
        return atLeastOnePackageMatched;
    }
    if (atLeastOnePackageMatched === false) {
        logger_1.default.info({ message: `No packages matched the filters in "${workspaceDir}"`, prefix: workspaceDir });
    }
    return undefined;
}
exports.handler = handler;
async function recursive(allPkgs, input, opts, cmdFullName, cmd) {
    if (allPkgs.length === 0) {
        // It might make sense to throw an exception in this case
        return false;
    }
    const pkgGraphResult = pkgs_graph_1.default(allPkgs);
    let pkgs;
    if (opts.packageSelectors && opts.packageSelectors.length) {
        pkgGraphResult.graph = filter_1.filterGraph(pkgGraphResult.graph, opts.packageSelectors);
        pkgs = allPkgs.filter(({ dir }) => pkgGraphResult.graph[dir]);
    }
    else {
        pkgs = allPkgs;
    }
    const allPackagesAreSelected = pkgs.length === allPkgs.length;
    if (pkgs.length === 0) {
        return false;
    }
    const manifestsByPath = {};
    for (const { dir, manifest, writeImporterManifest } of pkgs) {
        manifestsByPath[dir] = { manifest, writeImporterManifest };
    }
    core_loggers_1.scopeLogger.debug({
        selected: pkgs.length,
        total: allPkgs.length,
        workspacePrefix: opts.workspaceDir,
    });
    const throwOnFail = recursiveSummary_1.throwOnCommandFail.bind(null, `pnpm recursive ${cmd}`);
    switch (cmdFullName) {
        case 'why':
        case 'list':
            return list_1.default(pkgs, input, cmd, opts); // tslint:disable-line:no-any
        case 'outdated':
            return outdated_1.default(pkgs, input, cmd, opts); // tslint:disable-line:no-any
        case 'add':
            if (!input || !input.length) {
                throw new error_1.default('MISSING_PACKAGE_NAME', '`pnpm recursive add` requires the package name');
            }
            break;
    }
    const chunks = opts.sort
        ? sortPackages(pkgGraphResult.graph)
        : [Object.keys(pkgGraphResult.graph).sort()];
    switch (cmdFullName) {
        case 'test':
            throwOnFail(await run_1.default(chunks, pkgGraphResult.graph, ['test', ...input], cmd, opts)); // tslint:disable-line:no-any
            return true;
        case 'run':
            throwOnFail(await run_1.default(chunks, pkgGraphResult.graph, input, cmd, { ...opts, allPackagesAreSelected })); // tslint:disable-line:no-any
            return true;
        case 'update':
            opts = { ...opts, update: true, allowNew: false }; // tslint:disable-line:no-any
            break;
        case 'exec':
            throwOnFail(await exec_1.default(chunks, pkgGraphResult.graph, input, cmd, opts)); // tslint:disable-line:no-any
            return true;
    }
    const store = await store_connection_manager_1.createOrConnectStoreController(opts);
    // It is enough to save the store.json file once,
    // once all installations are done.
    // That's why saveState that is passed to the install engine
    // does nothing.
    const saveState = store.ctrl.saveState;
    const storeController = {
        ...store.ctrl,
        saveState: async () => undefined,
    };
    const localPackages = opts.linkWorkspacePackages && cmdFullName !== 'unlink'
        ? find_workspace_packages_1.arrayOfLocalPackagesToMap(allPkgs)
        : {};
    const installOpts = Object.assign(opts, {
        localPackages,
        ownLifecycleHooksStdio: 'pipe',
        peer: opts.savePeer,
        pruneLockfileImporters: (!opts.ignoredPackages || opts.ignoredPackages.size === 0)
            && pkgs.length === allPkgs.length,
        storeController,
        storeDir: store.dir,
        forceHoistPattern: typeof opts.rawLocalConfig['hoist-pattern'] !== 'undefined' || typeof opts.rawLocalConfig['hoist'] !== 'undefined',
        forceIndependentLeaves: typeof opts.rawLocalConfig['independent-leaves'] !== 'undefined',
        forceShamefullyHoist: typeof opts.rawLocalConfig['shamefully-hoist'] !== 'undefined',
    });
    const result = {
        fails: [],
        passes: 0,
    };
    const memReadLocalConfig = mem(readLocalConfig);
    async function getImporters() {
        const importers = [];
        await Promise.all(chunks.map((prefixes, buildIndex) => {
            if (opts.ignoredPackages) {
                prefixes = prefixes.filter((prefix) => !opts.ignoredPackages.has(prefix));
            }
            return Promise.all(prefixes.map(async (prefix) => {
                importers.push({
                    buildIndex,
                    manifest: manifestsByPath[prefix].manifest,
                    rootDir: prefix,
                });
            }));
        }));
        return importers;
    }
    const updateToLatest = opts.update && opts.latest;
    const include = opts.include;
    if (updateToLatest) {
        delete opts.include;
    }
    if (cmdFullName !== 'rebuild') {
        // For a workspace with shared lockfile
        if (opts.lockfileDir && ['add', 'install', 'remove', 'update'].includes(cmdFullName)) {
            if (opts.hoistPattern) {
                logger_1.default.info({ message: 'Only the root workspace package is going to have hoisted dependencies in node_modules', prefix: opts.lockfileDir });
            }
            let importers = await getImporters();
            const isFromWorkspace = isSubdir.bind(null, opts.lockfileDir);
            importers = await pFilter(importers, async ({ rootDir }) => isFromWorkspace(await fs.realpath(rootDir)));
            if (importers.length === 0)
                return true;
            const hooks = opts.ignorePnpmfile ? {} : pnpmfile_1.requireHooks(opts.lockfileDir, opts);
            const mutation = cmdFullName === 'remove' ? 'uninstallSome' : (input.length === 0 && !updateToLatest ? 'install' : 'installSome');
            const writeImporterManifests = [];
            const mutatedImporters = [];
            await Promise.all(importers.map(async ({ buildIndex, rootDir }) => {
                const localConfig = await memReadLocalConfig(rootDir);
                const { manifest, writeImporterManifest } = manifestsByPath[rootDir];
                let currentInput = [...input];
                if (updateToLatest) {
                    if (!currentInput || !currentInput.length) {
                        currentInput = cli_utils_1.updateToLatestSpecsFromManifest(manifest, include);
                    }
                    else {
                        currentInput = cli_utils_1.createLatestSpecs(currentInput, manifest);
                        if (!currentInput.length) {
                            installOpts.pruneLockfileImporters = false;
                            return;
                        }
                    }
                }
                writeImporterManifests.push(writeImporterManifest);
                switch (mutation) {
                    case 'uninstallSome':
                        mutatedImporters.push({
                            dependencyNames: currentInput,
                            manifest,
                            mutation,
                            rootDir,
                            targetDependenciesField: cli_utils_1.getSaveType(opts),
                        });
                        return;
                    case 'installSome':
                        mutatedImporters.push({
                            allowNew: cmdFullName === 'install' || cmdFullName === 'add',
                            dependencySelectors: currentInput,
                            manifest,
                            mutation,
                            peer: opts.savePeer,
                            pinnedVersion: cli_utils_1.getPinnedVersion({
                                saveExact: typeof localConfig.saveExact === 'boolean' ? localConfig.saveExact : opts.saveExact,
                                savePrefix: typeof localConfig.savePrefix === 'string' ? localConfig.savePrefix : opts.savePrefix,
                            }),
                            rootDir,
                            targetDependenciesField: cli_utils_1.getSaveType(opts),
                        });
                        return;
                    case 'install':
                        mutatedImporters.push({
                            buildIndex,
                            manifest,
                            mutation,
                            rootDir,
                        });
                        return;
                }
            }));
            const mutatedPkgs = await supi_1.mutateModules(mutatedImporters, {
                ...installOpts,
                hooks,
                storeController: store.ctrl,
            });
            if (opts.save !== false) {
                await Promise.all(mutatedPkgs
                    .map(({ manifest }, index) => writeImporterManifests[index](manifest)));
            }
            return true;
        }
        let pkgPaths = chunks.length === 0
            ? chunks[0]
            : Object.keys(pkgGraphResult.graph).sort();
        const limitInstallation = p_limit_1.default(opts.workspaceConcurrency);
        await Promise.all(pkgPaths.map((rootDir) => limitInstallation(async () => {
            const hooks = opts.ignorePnpmfile ? {} : pnpmfile_1.requireHooks(rootDir, opts);
            try {
                if (opts.ignoredPackages && opts.ignoredPackages.has(rootDir)) {
                    return;
                }
                const { manifest, writeImporterManifest } = manifestsByPath[rootDir];
                let currentInput = [...input];
                if (updateToLatest) {
                    if (!currentInput || !currentInput.length) {
                        currentInput = cli_utils_1.updateToLatestSpecsFromManifest(manifest, include);
                    }
                    else {
                        currentInput = cli_utils_1.createLatestSpecs(currentInput, manifest);
                        if (!currentInput.length)
                            return;
                    }
                }
                let action; // tslint:disable-line:no-any
                switch (cmdFullName) {
                    case 'unlink':
                        action = (currentInput.length === 0 ? unlink : unlinkPkgs.bind(null, currentInput));
                        break;
                    case 'remove':
                        action = (manifest, opts) => supi_1.mutateModules([
                            {
                                dependencyNames: currentInput,
                                manifest,
                                mutation: 'uninstallSome',
                                rootDir,
                            },
                        ], opts);
                        break;
                    default:
                        action = currentInput.length === 0
                            ? supi_1.install
                            : (manifest, opts) => supi_1.addDependenciesToPackage(manifest, currentInput, opts); // tslint:disable-line:no-any
                        break;
                }
                const localConfig = await memReadLocalConfig(rootDir);
                const newManifest = await action(manifest, {
                    ...installOpts,
                    ...localConfig,
                    bin: path.join(rootDir, 'node_modules', '.bin'),
                    dir: rootDir,
                    hooks,
                    ignoreScripts: true,
                    pinnedVersion: cli_utils_1.getPinnedVersion({
                        saveExact: typeof localConfig.saveExact === 'boolean' ? localConfig.saveExact : opts.saveExact,
                        savePrefix: typeof localConfig.savePrefix === 'string' ? localConfig.savePrefix : opts.savePrefix,
                    }),
                    rawConfig: {
                        ...installOpts.rawConfig,
                        ...localConfig,
                    },
                    storeController,
                });
                if (opts.save !== false) {
                    await writeImporterManifest(newManifest);
                }
                result.passes++;
            }
            catch (err) {
                logger_1.default.info(err);
                if (!opts.bail) {
                    result.fails.push({
                        error: err,
                        message: err.message,
                        prefix: rootDir,
                    });
                    return;
                }
                err['prefix'] = rootDir; // tslint:disable-line:no-string-literal
                throw err;
            }
        })));
        await saveState();
    }
    if (cmdFullName === 'rebuild' ||
        !opts.lockfileOnly && !opts.ignoreScripts && (cmdFullName === 'add' ||
            cmdFullName === 'install' ||
            cmdFullName === 'update' ||
            cmdFullName === 'unlink')) {
        const action = (cmdFullName !== 'rebuild' || input.length === 0
            ? supi_1.rebuild
            : (importers, opts) => supi_1.rebuildPkgs(importers, input, opts) // tslint:disable-line
        );
        if (opts.lockfileDir) {
            const importers = await getImporters();
            await action(importers, {
                ...installOpts,
                pending: cmdFullName !== 'rebuild' || opts.pending === true,
            });
            return true;
        }
        const limitRebuild = p_limit_1.default(opts.workspaceConcurrency);
        for (const chunk of chunks) {
            await Promise.all(chunk.map((rootDir) => limitRebuild(async () => {
                try {
                    if (opts.ignoredPackages && opts.ignoredPackages.has(rootDir)) {
                        return;
                    }
                    const localConfig = await memReadLocalConfig(rootDir);
                    await action([
                        {
                            buildIndex: 0,
                            manifest: manifestsByPath[rootDir].manifest,
                            rootDir,
                        },
                    ], {
                        ...installOpts,
                        ...localConfig,
                        dir: rootDir,
                        pending: cmdFullName !== 'rebuild' || opts.pending === true,
                        rawConfig: {
                            ...installOpts.rawConfig,
                            ...localConfig,
                        },
                    });
                    result.passes++;
                }
                catch (err) {
                    logger_1.default.info(err);
                    if (!opts.bail) {
                        result.fails.push({
                            error: err,
                            message: err.message,
                            prefix: rootDir,
                        });
                        return;
                    }
                    err['prefix'] = rootDir; // tslint:disable-line:no-string-literal
                    throw err;
                }
            })));
        }
    }
    throwOnFail(result);
    return true;
}
exports.recursive = recursive;
async function unlink(manifest, opts) {
    return supi_1.mutateModules([
        {
            manifest,
            mutation: 'unlink',
            rootDir: opts.dir,
        },
    ], opts);
}
async function unlinkPkgs(dependencyNames, manifest, opts) {
    return supi_1.mutateModules([
        {
            dependencyNames,
            manifest,
            mutation: 'unlinkSome',
            rootDir: opts.dir,
        },
    ], opts);
}
function sortPackages(pkgGraph) {
    const keys = Object.keys(pkgGraph);
    const setOfKeys = new Set(keys);
    const graph = new Map(keys.map((pkgPath) => [
        pkgPath,
        pkgGraph[pkgPath].dependencies.filter(
        /* remove cycles of length 1 (ie., package 'a' depends on 'a').  They
        confuse the graph-sequencer, but can be ignored when ordering packages
        topologically.

        See the following example where 'b' and 'c' depend on themselves:

          graphSequencer({graph: new Map([
            ['a', ['b', 'c']],
            ['b', ['b']],
            ['c', ['b', 'c']]]
          ),
          groups: [['a', 'b', 'c']]})

        returns chunks:

            [['b'],['a'],['c']]

        But both 'b' and 'c' should be executed _before_ 'a', because 'a' depends on
        them.  It works (and is considered 'safe' if we run:)

          graphSequencer({graph: new Map([
            ['a', ['b', 'c']],
            ['b', []],
            ['c', ['b']]]
          ), groups: [['a', 'b', 'c']]})

        returning:

            [['b'], ['c'], ['a']]

        */
        d => d !== pkgPath &&
            /* remove unused dependencies that we can ignore due to a filter expression.
    
            Again, the graph sequencer used to behave weirdly in the following edge case:
    
              graphSequencer({graph: new Map([
                ['a', ['b', 'c']],
                ['d', ['a']],
                ['e', ['a', 'b', 'c']]]
              ),
              groups: [['a', 'e', 'e']]})
    
            returns chunks:
    
                [['d'],['a'],['e']]
    
            But we really want 'a' to be executed first.
            */
            setOfKeys.has(d))
    ]));
    const graphSequencerResult = graphSequencer({
        graph,
        groups: [keys],
    });
    return graphSequencerResult.chunks;
}
async function readLocalConfig(prefix) {
    try {
        const ini = await readIniFile(path.join(prefix, '.npmrc'));
        const config = camelcaseKeys(ini);
        if (config.shamefullyFlatten) {
            config.hoistPattern = '*';
            // TODO: print a warning
        }
        if (config.hoist === false) {
            config.hoistPattern = '';
        }
        return config;
    }
    catch (err) {
        if (err.code !== 'ENOENT')
            throw err;
        return {};
    }
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cli_utils_1 = require("@pnpm/cli-utils");
const common_cli_options_help_1 = require("@pnpm/common-cli-options-help");
const config_1 = require("@pnpm/config");
const find_workspace_packages_1 = require("@pnpm/find-workspace-packages");
const store_connection_manager_1 = require("@pnpm/store-connection-manager");
const p_limit_1 = require("p-limit");
const path = require("path");
const pathAbsolute = require("path-absolute");
const R = require("ramda");
const renderHelp = require("render-help");
const supi_1 = require("supi");
const installLimit = p_limit_1.default(4);
function types() {
    return R.pick([
        'global-dir',
        'global',
        'only',
        'package-import-method',
        'production',
        'registry',
        'reporter',
        'resolution-strategy',
        'save-dev',
        'save-exact',
        'save-optional',
    ], config_1.types);
}
exports.types = types;
exports.commandNames = ['link', 'ln'];
function help() {
    return renderHelp({
        aliases: ['ln'],
        descriptionLists: [
            {
                title: 'Options',
                list: [
                    ...common_cli_options_help_1.UNIVERSAL_OPTIONS,
                ],
            },
        ],
        url: cli_utils_1.docsUrl('link'),
        usages: [
            'pnpm link (in package dir)',
            'pnpm link <pkg>',
            'pnpm link <dir>',
        ],
    });
}
exports.help = help;
async function handler(input, opts) {
    var _a, _b;
    const cwd = (_b = (_a = opts) === null || _a === void 0 ? void 0 : _a.dir, (_b !== null && _b !== void 0 ? _b : process.cwd()));
    const storeControllerCache = new Map();
    let workspacePackages;
    let localPackages;
    if (opts.linkWorkspacePackages && opts.workspaceDir) {
        workspacePackages = await find_workspace_packages_1.default(opts.workspaceDir, opts);
        localPackages = find_workspace_packages_1.arrayOfLocalPackagesToMap(workspacePackages);
    }
    else {
        localPackages = {};
    }
    const store = await store_connection_manager_1.createOrConnectStoreControllerCached(storeControllerCache, opts);
    const linkOpts = Object.assign(opts, {
        localPackages,
        storeController: store.ctrl,
        storeDir: store.dir,
        targetDependenciesField: cli_utils_1.getSaveType(opts),
    });
    // pnpm link
    if (!input || !input.length) {
        const { manifest, writeImporterManifest } = await cli_utils_1.tryReadImporterManifest(opts.globalDir, opts);
        const newManifest = await supi_1.linkToGlobal(cwd, {
            ...linkOpts,
            // A temporary workaround. global bin/prefix are always defined when --global is set
            globalBin: linkOpts.globalBin,
            globalDir: linkOpts.globalDir,
            manifest: manifest || {},
        });
        await writeImporterManifest(newManifest);
        return;
    }
    const [pkgPaths, pkgNames] = R.partition((inp) => inp.startsWith('.'), input);
    if (pkgNames.length) {
        let globalPkgNames;
        if (opts.workspaceDir) {
            workspacePackages = await find_workspace_packages_1.default(opts.workspaceDir, opts);
            const pkgsFoundInWorkspace = workspacePackages.filter((pkg) => pkgNames.includes(pkg.manifest.name));
            pkgsFoundInWorkspace.forEach((pkgFromWorkspace) => pkgPaths.push(pkgFromWorkspace.dir));
            if (pkgsFoundInWorkspace.length && !linkOpts.targetDependenciesField) {
                linkOpts.targetDependenciesField = 'dependencies';
            }
            globalPkgNames = pkgNames.filter((pkgName) => !pkgsFoundInWorkspace.some((pkgFromWorkspace) => pkgFromWorkspace.manifest.name === pkgName));
        }
        else {
            globalPkgNames = pkgNames;
        }
        const globalPkgPath = pathAbsolute(opts.globalDir);
        globalPkgNames.forEach((pkgName) => pkgPaths.push(path.join(globalPkgPath, 'node_modules', pkgName)));
    }
    await Promise.all(pkgPaths.map((dir) => installLimit(async () => {
        const s = await store_connection_manager_1.createOrConnectStoreControllerCached(storeControllerCache, opts);
        await supi_1.install(await cli_utils_1.readImporterManifestOnly(dir, opts), {
            ...await cli_utils_1.getConfig({ ...opts.cliArgs, 'dir': dir }, {
                command: ['link'],
                excludeReporter: true,
            }),
            localPackages,
            storeController: s.ctrl,
            storeDir: s.dir,
        });
    })));
    const { manifest, writeImporterManifest } = await cli_utils_1.readImporterManifest(cwd, opts);
    // When running `pnpm link --production ../source`
    // only the `source` project should be pruned using the --production flag.
    // The target directory should keep its existing dependencies.
    // Except the ones that are replaced by the link.
    delete linkOpts.include;
    const newManifest = await supi_1.link(pkgPaths, path.join(cwd, 'node_modules'), {
        ...linkOpts,
        manifest,
    });
    await writeImporterManifest(newManifest);
    await Promise.all(Array.from(storeControllerCache.values())
        .map(async (storeControllerPromise) => {
        const storeControllerHolder = await storeControllerPromise;
        await storeControllerHolder.ctrl.close();
    }));
}
exports.handler = handler;

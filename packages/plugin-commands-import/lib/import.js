"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cli_utils_1 = require("@pnpm/cli-utils");
const constants_1 = require("@pnpm/constants");
const error_1 = require("@pnpm/error");
const read_importer_manifest_1 = require("@pnpm/read-importer-manifest");
const store_connection_manager_1 = require("@pnpm/store-connection-manager");
const rimraf = require("@zkochan/rimraf");
const loadJsonFile = require("load-json-file");
const path = require("path");
const renderHelp = require("render-help");
const supi_1 = require("supi");
function types() {
    return {};
}
exports.types = types;
function help() {
    return renderHelp({
        description: `Generates ${constants_1.WANTED_LOCKFILE} from an npm package-lock.json (or npm-shrinkwrap.json) file.`,
        url: cli_utils_1.docsUrl('import'),
        usages: ['pnpm import'],
    });
}
exports.help = help;
exports.commandNames = ['import'];
async function handler(input, opts) {
    // Removing existing pnpm lockfile
    // it should not influence the new one
    await rimraf(path.join(opts.dir, constants_1.WANTED_LOCKFILE));
    const npmPackageLock = await readNpmLockfile(opts.dir);
    const versionsByPackageNames = {};
    getAllVersionsByPackageNames(npmPackageLock, versionsByPackageNames);
    const preferredVersions = getPreferredVersions(versionsByPackageNames);
    const store = await store_connection_manager_1.createOrConnectStoreController(opts);
    const installOpts = {
        ...opts,
        lockfileOnly: true,
        preferredVersions,
        storeController: store.ctrl,
        storeDir: store.dir,
    };
    await supi_1.install(await read_importer_manifest_1.readImporterManifestOnly(opts.dir), installOpts);
}
exports.handler = handler;
async function readNpmLockfile(dir) {
    try {
        return await loadJsonFile(path.join(dir, 'package-lock.json'));
    }
    catch (err) {
        if (err['code'] !== 'ENOENT')
            throw err; // tslint:disable-line:no-string-literal
    }
    try {
        return await loadJsonFile(path.join(dir, 'npm-shrinkwrap.json'));
    }
    catch (err) {
        if (err['code'] !== 'ENOENT')
            throw err; // tslint:disable-line:no-string-literal
    }
    throw new error_1.default('NPM_LOCKFILE_NOT_FOUND', 'No package-lock.json or npm-shrinkwrap.json found');
}
function getPreferredVersions(versionsByPackageNames) {
    const preferredVersions = {};
    for (const packageName of Object.keys(versionsByPackageNames)) {
        if (versionsByPackageNames[packageName].size === 1) {
            preferredVersions[packageName] = {
                selector: Array.from(versionsByPackageNames[packageName])[0],
                type: 'version',
            };
        }
        else {
            preferredVersions[packageName] = {
                selector: Array.from(versionsByPackageNames[packageName]).join(' || '),
                type: 'range',
            };
        }
    }
    return preferredVersions;
}
function getAllVersionsByPackageNames(npmPackageLock, versionsByPackageNames) {
    if (!npmPackageLock.dependencies)
        return;
    for (const packageName of Object.keys(npmPackageLock.dependencies)) {
        if (!versionsByPackageNames[packageName]) {
            versionsByPackageNames[packageName] = new Set();
        }
        versionsByPackageNames[packageName].add(npmPackageLock.dependencies[packageName].version);
    }
    for (const packageName of Object.keys(npmPackageLock.dependencies)) {
        getAllVersionsByPackageNames(npmPackageLock.dependencies[packageName], versionsByPackageNames);
    }
}

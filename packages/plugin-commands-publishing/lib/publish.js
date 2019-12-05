"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cli_utils_1 = require("@pnpm/cli-utils");
const config_1 = require("@pnpm/config");
const error_1 = require("@pnpm/error");
const read_importer_manifest_1 = require("@pnpm/read-importer-manifest");
const run_npm_1 = require("@pnpm/run-npm");
const rimraf = require("@zkochan/rimraf");
const cpFile = require("cp-file");
const fg = require("fast-glob");
const fs = require("mz/fs");
const path = require("path");
const R = require("ramda");
const renderHelp = require("render-help");
const writeJsonFile = require("write-json-file");
function types() {
    return R.pick([
        'access',
        'otp',
        'tag',
    ], config_1.types);
}
exports.types = types;
exports.commandNames = ['publish'];
function help() {
    return renderHelp({
        description: 'Publishes a package to the npm registry.',
        url: cli_utils_1.docsUrl('publish'),
        usages: ['pnpm publish [<tarball>|<dir>] [--tag <tag>] [--access <public|restricted>]'],
    });
}
exports.help = help;
async function handler(args, opts, command) {
    if (args.length && args[0].endsWith('.tgz')) {
        await run_npm_1.default(['publish', ...args]);
        return;
    }
    const dir = args.length && args[0] || process.cwd();
    let _status;
    await fakeRegularManifest({
        dir,
        engineStrict: opts.engineStrict,
        workspaceDir: opts.workspaceDir || dir,
    }, async () => {
        const { status } = await run_npm_1.default(['publish', ...opts.argv.original.slice(1)]);
        _status = status;
    });
    if (_status !== 0) {
        process.exit(_status);
    }
}
exports.handler = handler;
const LICENSE_GLOB = 'LICEN{S,C}E{,.*}';
const findLicenses = fg.bind(fg, [LICENSE_GLOB]);
// property keys that are copied from publishConfig into the manifest
const PUBLISH_CONFIG_WHITELIST = new Set([
    // manifest fields that may make sense to overwrite
    'bin',
    // https://github.com/stereobooster/package.json#package-bundlers
    'main',
    'module',
    'typings',
    'types',
    'exports',
    'browser',
    'esnext',
    'es2015',
    'unpkg',
    'umd:main',
]);
async function fakeRegularManifest(opts, fn) {
    // If a workspace package has no License of its own,
    // license files from the root of the workspace are used
    const copiedLicenses = opts.dir !== opts.workspaceDir && (await findLicenses({ cwd: opts.dir })).length === 0
        ? await copyLicenses(opts.workspaceDir, opts.dir) : [];
    const { fileName, manifest, writeImporterManifest } = await cli_utils_1.readImporterManifest(opts.dir, opts);
    const publishManifest = await makePublishManifest(opts.dir, manifest);
    const replaceManifest = fileName !== 'package.json' || !R.equals(manifest, publishManifest);
    if (replaceManifest) {
        await rimraf(path.join(opts.dir, fileName));
        await writeJsonFile(path.join(opts.dir, 'package.json'), publishManifest);
    }
    await fn();
    if (replaceManifest) {
        await rimraf(path.join(opts.dir, 'package.json'));
        await writeImporterManifest(manifest, true);
    }
    await Promise.all(copiedLicenses.map((copiedLicense) => fs.unlink(copiedLicense)));
}
exports.fakeRegularManifest = fakeRegularManifest;
async function makePublishManifest(dir, originalManifest) {
    const publishManifest = {
        ...originalManifest,
        dependencies: await makePublishDependencies(dir, originalManifest.dependencies),
        optionalDependencies: await makePublishDependencies(dir, originalManifest.optionalDependencies),
    };
    const { publishConfig } = originalManifest;
    if (publishConfig) {
        Object.keys(publishConfig)
            .filter(key => PUBLISH_CONFIG_WHITELIST.has(key))
            .forEach(key => {
            publishManifest[key] = publishConfig[key];
        });
    }
    return publishManifest;
}
async function makePublishDependencies(dir, dependencies) {
    if (!dependencies)
        return dependencies;
    const publishDependencies = R.fromPairs(await Promise.all(R.toPairs(dependencies)
        .map(async ([depName, depSpec]) => [
        depName,
        await makePublishDependency(depName, depSpec, dir),
    ])));
    return publishDependencies;
}
async function makePublishDependency(depName, depSpec, dir) {
    if (!depSpec.startsWith('workspace:')) {
        return depSpec;
    }
    if (depSpec === 'workspace:*') {
        const { manifest } = await read_importer_manifest_1.tryReadImporterManifest(path.join(dir, 'node_modules', depName));
        if (!manifest || !manifest.version) {
            throw new error_1.default('CANNOT_RESOLVE_WORKSPACE_PROTOCOL', `Cannot resolve workspace protocol of dependency "${depName}" ` +
                `because this dependency is not installed. Try running "pnpm install".`);
        }
        return manifest.version;
    }
    return depSpec.substr(10);
}
async function copyLicenses(sourceDir, destDir) {
    const licenses = await findLicenses({ cwd: sourceDir });
    if (licenses.length === 0)
        return [];
    const copiedLicenses = [];
    await Promise.all(licenses
        .map((licenseRelPath) => path.join(sourceDir, licenseRelPath))
        .map((licensePath) => {
        const licenseCopyDest = path.join(destDir, path.basename(licensePath));
        copiedLicenses.push(licenseCopyDest);
        return cpFile(licensePath, licenseCopyDest);
    }));
    return copiedLicenses;
}

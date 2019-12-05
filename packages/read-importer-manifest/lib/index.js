"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const error_1 = require("@pnpm/error");
const write_importer_manifest_1 = require("@pnpm/write-importer-manifest");
const detectIndent = require("detect-indent");
const equal = require("fast-deep-equal");
const fs = require("fs");
const isWindows = require("is-windows");
const path = require("path");
const read_yaml_file_1 = require("read-yaml-file");
const sortKeys = require("sort-keys");
const util_1 = require("util");
const readFile_1 = require("./readFile");
const stat = util_1.promisify(fs.stat);
async function readImporterManifest(importerDir) {
    const result = await tryReadImporterManifest(importerDir);
    if (result.manifest !== null) {
        return result;
    }
    throw new error_1.default('NO_IMPORTER_MANIFEST_FOUND', `No package.json (or package.yaml, or package.json5) was found in "${importerDir}".`);
}
exports.default = readImporterManifest;
async function readImporterManifestOnly(importerDir) {
    const { manifest } = await readImporterManifest(importerDir);
    return manifest;
}
exports.readImporterManifestOnly = readImporterManifestOnly;
async function tryReadImporterManifest(importerDir) {
    try {
        const manifestPath = path.join(importerDir, 'package.json');
        const { data, text } = await readFile_1.readJsonFile(manifestPath);
        const { indent } = detectIndent(text);
        return {
            fileName: 'package.json',
            manifest: data,
            writeImporterManifest: createManifestWriter({
                indent,
                initialManifest: data,
                manifestPath,
            }),
        };
    }
    catch (err) {
        if (err.code !== 'ENOENT')
            throw err;
    }
    try {
        const manifestPath = path.join(importerDir, 'package.json5');
        const { data, text } = await readFile_1.readJson5File(manifestPath);
        const { indent } = detectIndent(text);
        return {
            fileName: 'package.json5',
            manifest: data,
            writeImporterManifest: createManifestWriter({
                indent,
                initialManifest: data,
                manifestPath,
            }),
        };
    }
    catch (err) {
        if (err.code !== 'ENOENT')
            throw err;
    }
    try {
        const manifestPath = path.join(importerDir, 'package.yaml');
        const manifest = await readPackageYaml(manifestPath);
        return {
            fileName: 'package.yaml',
            manifest,
            writeImporterManifest: createManifestWriter({ initialManifest: manifest, manifestPath }),
        };
    }
    catch (err) {
        if (err.code !== 'ENOENT')
            throw err;
    }
    if (isWindows()) {
        // ENOTDIR isn't used on Windows, but pnpm expects it.
        let s;
        try {
            s = await stat(importerDir);
        }
        catch (err) {
            // Ignore
        }
        if (s && !s.isDirectory()) {
            const err = new Error(`"${importerDir}" is not a directory`);
            err['code'] = 'ENOTDIR'; // tslint:disable-line
            throw err;
        }
    }
    const filePath = path.join(importerDir, 'package.json');
    return {
        fileName: 'package.json',
        manifest: null,
        writeImporterManifest: (manifest) => write_importer_manifest_1.default(filePath, manifest),
    };
}
exports.tryReadImporterManifest = tryReadImporterManifest;
async function readExactImporterManifest(manifestPath) {
    const base = path.basename(manifestPath).toLowerCase();
    switch (base) {
        case 'package.json': {
            const { data, text } = await readFile_1.readJsonFile(manifestPath);
            const { indent } = detectIndent(text);
            return {
                manifest: data,
                writeImporterManifest: createManifestWriter({
                    indent,
                    initialManifest: data,
                    manifestPath,
                }),
            };
        }
        case 'package.json5': {
            const { data, text } = await readFile_1.readJson5File(manifestPath);
            const { indent } = detectIndent(text);
            return {
                manifest: data,
                writeImporterManifest: createManifestWriter({
                    indent,
                    initialManifest: data,
                    manifestPath,
                }),
            };
        }
        case 'package.yaml': {
            const manifest = await readPackageYaml(manifestPath);
            return {
                manifest,
                writeImporterManifest: createManifestWriter({ initialManifest: manifest, manifestPath }),
            };
        }
    }
    throw new Error(`Not supported manifest name "${base}"`);
}
exports.readExactImporterManifest = readExactImporterManifest;
async function readPackageYaml(filePath) {
    try {
        return await read_yaml_file_1.default(filePath);
    }
    catch (err) {
        if (err.name !== 'YAMLException')
            throw err;
        err.message += `\nin ${filePath}`;
        err['code'] = 'ERR_PNPM_YAML_PARSE';
        throw err;
    }
}
function createManifestWriter(opts) {
    const initialManifest = normalize(JSON.parse(JSON.stringify(opts.initialManifest)));
    return async (updatedManifest, force) => {
        updatedManifest = normalize(updatedManifest);
        if (force === true || !equal(initialManifest, updatedManifest)) {
            return write_importer_manifest_1.default(opts.manifestPath, updatedManifest, { indent: opts.indent });
        }
    };
}
const dependencyKeys = new Set([
    'dependencies',
    'devDependencies',
    'optionalDependencies',
    'peerDependencies',
]);
function normalize(manifest) {
    const result = {};
    for (const key of Object.keys(manifest)) {
        if (!dependencyKeys.has(key)) {
            result[key] = manifest[key];
        }
        else if (Object.keys(manifest[key]).length !== 0) {
            result[key] = sortKeys(manifest[key]);
        }
    }
    return result;
}

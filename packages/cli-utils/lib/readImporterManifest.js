"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const read_importer_manifest_1 = require("@pnpm/read-importer-manifest"), utils = read_importer_manifest_1;
const packageIsInstallable_1 = require("./packageIsInstallable");
async function readImporterManifest(importerDir, opts) {
    const { fileName, manifest, writeImporterManifest } = await read_importer_manifest_1.default(importerDir);
    packageIsInstallable_1.packageIsInstallable(importerDir, manifest, opts); // tslint:disable-line:no-any
    return { fileName, manifest, writeImporterManifest };
}
exports.readImporterManifest = readImporterManifest;
async function readImporterManifestOnly(importerDir, opts) {
    const manifest = await utils.readImporterManifestOnly(importerDir);
    packageIsInstallable_1.packageIsInstallable(importerDir, manifest, opts); // tslint:disable-line:no-any
    return manifest;
}
exports.readImporterManifestOnly = readImporterManifestOnly;
async function tryReadImporterManifest(importerDir, opts) {
    const { fileName, manifest, writeImporterManifest } = await utils.tryReadImporterManifest(importerDir);
    if (!manifest)
        return { fileName, manifest, writeImporterManifest };
    packageIsInstallable_1.packageIsInstallable(importerDir, manifest, opts); // tslint:disable-line:no-any
    return { fileName, manifest, writeImporterManifest };
}
exports.tryReadImporterManifest = tryReadImporterManifest;

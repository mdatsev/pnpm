"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const error_1 = require("@pnpm/error");
const read_importer_manifest_1 = require("@pnpm/read-importer-manifest");
const fs = require("graceful-fs");
const ssri = require("ssri");
const parsePref_1 = require("./parsePref");
/**
 * Resolves a package hosted on the local filesystem
 */
async function resolveLocal(wantedDependency, opts) {
    const spec = parsePref_1.default(wantedDependency.pref, opts.importerDir, opts.lockfileDir || opts.importerDir);
    if (!spec)
        return null;
    if (spec.type === 'file') {
        return {
            id: spec.id,
            normalizedPref: spec.normalizedPref,
            resolution: {
                integrity: await getFileIntegrity(spec.fetchSpec),
                tarball: spec.id,
            },
            resolvedVia: 'local-filesystem',
        };
    }
    let localDependencyManifest;
    try {
        localDependencyManifest = await read_importer_manifest_1.readImporterManifestOnly(spec.fetchSpec);
    }
    catch (internalErr) {
        switch (internalErr.code) {
            case 'ENOTDIR': {
                throw new error_1.default('NOT_PACKAGE_DIRECTORY', `Could not install from "${spec.fetchSpec}" as it is not a directory.`);
            }
            case 'ENOENT': {
                throw new error_1.default('DIRECTORY_HAS_NO_PACKAGE_JSON', `Could not install from "${spec.fetchSpec}" as it does not contain a package.json file.`);
            }
            default: {
                throw internalErr;
            }
        }
    }
    return {
        id: spec.id,
        manifest: localDependencyManifest,
        normalizedPref: spec.normalizedPref,
        resolution: {
            directory: spec.dependencyPath,
            type: 'directory',
        },
        resolvedVia: 'local-filesystem',
    };
}
exports.default = resolveLocal;
async function getFileIntegrity(filename) {
    return (await ssri.fromStream(fs.createReadStream(filename))).toString();
}

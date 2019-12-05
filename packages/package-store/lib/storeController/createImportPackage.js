"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_loggers_1 = require("@pnpm/core-loggers");
const logger_1 = require("@pnpm/logger");
const makeDir = require("make-dir");
const fs = require("mz/fs");
const ncpCB = require("ncp");
const p_limit_1 = require("p-limit");
const path = require("path");
const exists = require("path-exists");
const pathTemp = require("path-temp");
const renameOverwrite = require("rename-overwrite");
const util_1 = require("util");
const importIndexedDir_1 = require("../fs/importIndexedDir");
const ncp = util_1.promisify(ncpCB);
const limitLinking = p_limit_1.default(16);
exports.default = (packageImportMethod) => {
    const importPackage = createImportPackage(packageImportMethod);
    return (from, to, opts) => limitLinking(() => importPackage(from, to, opts));
};
function createImportPackage(packageImportMethod) {
    // this works in the following way:
    // - hardlink: hardlink the packages, no fallback
    // - clone: clone the packages, no fallback
    // - auto: try to clone or hardlink the packages, if it fails, fallback to copy
    // - copy: copy the packages, do not try to link them first
    switch (packageImportMethod || 'auto') {
        case 'clone':
            return clonePkg;
        case 'hardlink':
            return hardlinkPkg;
        case 'auto': {
            return createAutoImporter();
        }
        case 'copy':
            return copyPkg;
        default:
            throw new Error(`Unknown package import method ${packageImportMethod}`);
    }
}
function createAutoImporter() {
    let auto = initialAuto;
    return auto;
    async function initialAuto(from, to, opts) {
        try {
            await clonePkg(from, to, opts);
            auto = clonePkg;
            return;
        }
        catch (err) {
            // ignore
        }
        try {
            await hardlinkPkg(from, to, opts);
            auto = hardlinkPkg;
            return;
        }
        catch (err) {
            if (!err.message.startsWith('EXDEV: cross-device link not permitted'))
                throw err;
            logger_1.globalWarn(err.message);
            logger_1.globalInfo('Falling back to copying packages from store');
            auto = copyPkg;
            await auto(from, to, opts);
        }
    }
}
async function clonePkg(from, to, opts) {
    const pkgJsonPath = path.join(to, 'package.json');
    if (!opts.filesResponse.fromStore || opts.force || !await exists(pkgJsonPath)) {
        core_loggers_1.importingLogger.debug({ from, to, method: 'clone' });
        await importIndexedDir_1.default(cloneFile, from, to, opts.filesResponse.filenames);
    }
}
async function cloneFile(from, to) {
    await fs.copyFile(from, to, fs.constants.COPYFILE_FICLONE_FORCE);
}
async function hardlinkPkg(from, to, opts) {
    const pkgJsonPath = path.join(to, 'package.json');
    if (!opts.filesResponse.fromStore || opts.force || !await exists(pkgJsonPath) || !await pkgLinkedToStore(pkgJsonPath, from, to)) {
        core_loggers_1.importingLogger.debug({ from, to, method: 'hardlink' });
        await importIndexedDir_1.default(fs.link, from, to, opts.filesResponse.filenames);
    }
}
async function pkgLinkedToStore(pkgJsonPath, from, to) {
    const pkgJsonPathInStore = path.join(from, 'package.json');
    if (await isSameFile(pkgJsonPath, pkgJsonPathInStore))
        return true;
    logger_1.globalInfo(`Relinking ${to} from the store`);
    return false;
}
async function isSameFile(file1, file2) {
    const stats = await Promise.all([fs.stat(file1), fs.stat(file2)]);
    return stats[0].ino === stats[1].ino;
}
async function copyPkg(from, to, opts) {
    const pkgJsonPath = path.join(to, 'package.json');
    if (!opts.filesResponse.fromStore || opts.force || !await exists(pkgJsonPath)) {
        core_loggers_1.importingLogger.debug({ from, to, method: 'copy' });
        const staging = pathTemp(path.dirname(to));
        await makeDir(staging);
        await ncp(from + '/.', staging);
        await renameOverwrite(staging, to);
    }
}
exports.copyPkg = copyPkg;

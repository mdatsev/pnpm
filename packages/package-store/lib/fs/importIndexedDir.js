"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = require("@pnpm/logger");
const rimraf = require("@zkochan/rimraf");
const makeDir = require("make-dir");
const fs = require("mz/fs");
const path = require("path");
const pathTemp = require("path-temp");
const importingLogger = logger_1.default('_package-file-already-exists');
async function importIndexedDir(importFile, existingDir, newDir, filenames) {
    const stage = pathTemp(path.dirname(newDir));
    try {
        await rimraf(stage);
        await tryImportIndexedDir(importFile, existingDir, stage, filenames);
        await rimraf(newDir);
        await fs.rename(stage, newDir);
    }
    catch (err) {
        try {
            await rimraf(stage);
        }
        catch (err) { } // tslint:disable-line:no-empty
        throw err;
    }
}
exports.default = importIndexedDir;
async function tryImportIndexedDir(importFile, existingDir, newDir, filenames) {
    const alldirs = new Set();
    filenames
        .forEach((f) => {
        alldirs.add(path.join(newDir, path.dirname(f)));
    });
    await Promise.all(Array.from(alldirs).sort((d1, d2) => d1.length - d2.length).map((dir) => makeDir(dir)));
    let allLinked = true;
    await Promise.all(filenames
        .map(async (f) => {
        const src = path.join(existingDir, f);
        const dest = path.join(newDir, f);
        try {
            await importFile(src, dest);
        }
        catch (err) {
            if (err['code'] !== 'EEXIST')
                throw err;
            // If the file is already linked, we ignore the error.
            // This is an extreme edge case that may happen only in one case,
            // when the store folder is case sensitive and the project's node_modules
            // is case insensitive.
            // So, for instance, foo.js and Foo.js could be unpacked to the store
            // but they cannot be both linked to node_modules.
            // More details at https://github.com/pnpm/pnpm/issues/1685
            allLinked = false;
            importingLogger.debug({ src, dest });
        }
    }));
    if (!allLinked) {
        logger_1.globalWarn(`Not all files from "${existingDir}" were linked to "${newDir}". ` +
            'This happens when the store is case sensitive while the target directory is case insensitive.');
    }
}

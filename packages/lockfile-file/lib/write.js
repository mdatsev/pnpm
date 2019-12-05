"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("@pnpm/constants");
const types_1 = require("@pnpm/types");
const rimraf = require("@zkochan/rimraf");
const yaml = require("js-yaml");
const makeDir = require("make-dir");
const path = require("path");
const R = require("ramda");
const writeFileAtomicCB = require("write-file-atomic");
const logger_1 = require("./logger");
function writeFileAtomic(filename, data) {
    return new Promise((resolve, reject) => writeFileAtomicCB(filename, data, {}, (err) => err ? reject(err) : resolve()));
}
const LOCKFILE_YAML_FORMAT = {
    lineWidth: 1000,
    noCompatMode: true,
    noRefs: true,
    sortKeys: true,
};
function writeWantedLockfile(pkgPath, wantedLockfile, opts) {
    return writeLockfile(constants_1.WANTED_LOCKFILE, pkgPath, wantedLockfile, opts);
}
exports.writeWantedLockfile = writeWantedLockfile;
async function writeCurrentLockfile(virtualStoreDir, currentLockfile, opts) {
    await makeDir(virtualStoreDir);
    return writeLockfile('lock.yaml', virtualStoreDir, currentLockfile, opts);
}
exports.writeCurrentLockfile = writeCurrentLockfile;
function writeLockfile(lockfileFilename, pkgPath, wantedLockfile, opts) {
    var _a;
    const lockfilePath = path.join(pkgPath, lockfileFilename);
    // empty lockfile is not saved
    if (isEmptyLockfile(wantedLockfile)) {
        return rimraf(lockfilePath);
    }
    const yamlDoc = yaml.safeDump(normalizeLockfile(wantedLockfile, ((_a = opts) === null || _a === void 0 ? void 0 : _a.forceSharedFormat) === true), LOCKFILE_YAML_FORMAT);
    return writeFileAtomic(lockfilePath, yamlDoc);
}
function isEmptyLockfile(lockfile) {
    return R.values(lockfile.importers).every((importer) => R.isEmpty(importer.specifiers || {}) && R.isEmpty(importer.dependencies || {}));
}
function normalizeLockfile(lockfile, forceSharedFormat) {
    if (forceSharedFormat === false && R.equals(R.keys(lockfile.importers), ['.'])) {
        const lockfileToSave = {
            ...lockfile,
            ...lockfile.importers['.'],
        };
        delete lockfileToSave.importers;
        for (const depType of types_1.DEPENDENCIES_FIELDS) {
            if (R.isEmpty(lockfileToSave[depType])) {
                delete lockfileToSave[depType];
            }
        }
        if (R.isEmpty(lockfileToSave.packages)) {
            delete lockfileToSave.packages;
        }
        return lockfileToSave;
    }
    else {
        const lockfileToSave = {
            ...lockfile,
            importers: R.keys(lockfile.importers).reduce((acc, alias) => {
                const importer = lockfile.importers[alias];
                const normalizedImporter = {
                    specifiers: importer.specifiers,
                };
                for (const depType of types_1.DEPENDENCIES_FIELDS) {
                    if (!R.isEmpty(importer[depType] || {})) {
                        normalizedImporter[depType] = importer[depType];
                    }
                }
                acc[alias] = normalizedImporter;
                return acc;
            }, {}),
        };
        if (R.isEmpty(lockfileToSave.packages)) {
            delete lockfileToSave.packages;
        }
        return lockfileToSave;
    }
}
function writeLockfiles(opts) {
    var _a;
    const wantedLockfilePath = path.join(opts.wantedLockfileDir, constants_1.WANTED_LOCKFILE);
    const currentLockfilePath = path.join(opts.currentLockfileDir, 'lock.yaml');
    // empty lockfile is not saved
    if (isEmptyLockfile(opts.wantedLockfile)) {
        return Promise.all([
            rimraf(wantedLockfilePath),
            rimraf(currentLockfilePath),
        ]);
    }
    const forceSharedFormat = ((_a = opts) === null || _a === void 0 ? void 0 : _a.forceSharedFormat) === true;
    const yamlDoc = yaml.safeDump(normalizeLockfile(opts.wantedLockfile, forceSharedFormat), LOCKFILE_YAML_FORMAT);
    // in most cases the `pnpm-lock.yaml` and `node_modules/.pnpm-lock.yaml` are equal
    // in those cases the YAML document can be stringified only once for both files
    // which is more efficient
    if (opts.wantedLockfile === opts.currentLockfile) {
        return Promise.all([
            writeFileAtomic(wantedLockfilePath, yamlDoc),
            (async () => {
                await makeDir(path.dirname(currentLockfilePath));
                await writeFileAtomic(currentLockfilePath, yamlDoc);
            })(),
        ]);
    }
    logger_1.default.debug({
        message: `\`${constants_1.WANTED_LOCKFILE}\` differs from \`${path.relative(opts.wantedLockfileDir, currentLockfilePath)}\``,
        prefix: opts.wantedLockfileDir,
    });
    const currentYamlDoc = yaml.safeDump(normalizeLockfile(opts.currentLockfile, forceSharedFormat), LOCKFILE_YAML_FORMAT);
    return Promise.all([
        writeFileAtomic(wantedLockfilePath, yamlDoc),
        (async () => {
            await makeDir(path.dirname(currentLockfilePath));
            await writeFileAtomic(currentLockfilePath, currentYamlDoc);
        })(),
    ]);
}
exports.default = writeLockfiles;

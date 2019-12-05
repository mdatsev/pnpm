"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("@pnpm/constants");
const lockfile_file_1 = require("@pnpm/lockfile-file");
const logger_1 = require("@pnpm/logger");
const isCI = require("is-ci");
const R = require("ramda");
async function default_1(opts) {
    // ignore `pnpm-lock.yaml` on CI servers
    // a latest pnpm should not break all the builds
    const lockfileOpts = {
        ignoreIncompatible: opts.force || isCI,
        wantedVersion: constants_1.LOCKFILE_VERSION,
    };
    const files = await Promise.all([
        opts.useLockfile && lockfile_file_1.readWantedLockfile(opts.lockfileDir, lockfileOpts)
            || await lockfile_file_1.existsWantedLockfile(opts.lockfileDir) &&
                logger_1.default.warn({
                    message: `A ${constants_1.WANTED_LOCKFILE} file exists. The current configuration prohibits to read or write a lockfile`,
                    prefix: opts.lockfileDir,
                }),
        lockfile_file_1.readCurrentLockfile(opts.virtualStoreDir, lockfileOpts),
    ]);
    const sopts = { lockfileVersion: constants_1.LOCKFILE_VERSION };
    const importerIds = opts.importers.map((importer) => importer.id);
    const currentLockfile = files[1] || lockfile_file_1.createLockfileObject(importerIds, sopts);
    for (const importerId of importerIds) {
        if (!currentLockfile.importers[importerId]) {
            currentLockfile.importers[importerId] = {
                specifiers: {},
            };
        }
    }
    const wantedLockfile = files[0] ||
        currentLockfile && R.clone(currentLockfile) ||
        lockfile_file_1.createLockfileObject(importerIds, sopts);
    for (const importerId of importerIds) {
        if (!wantedLockfile.importers[importerId]) {
            wantedLockfile.importers[importerId] = {
                specifiers: {},
            };
        }
    }
    return {
        currentLockfile,
        existsCurrentLockfile: !!files[1],
        existsWantedLockfile: !!files[0],
        wantedLockfile,
    };
}
exports.default = default_1;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("@pnpm/utils");
const pnpmPkgJson_1 = require("../pnpmPkgJson");
const defaults = async (opts) => {
    const packageManager = opts.packageManager || {
        name: pnpmPkgJson_1.default.name,
        version: pnpmPkgJson_1.default.version,
    };
    const dir = opts.dir || process.cwd();
    const lockfileDir = opts.lockfileDir || dir;
    return {
        childConcurrency: 5,
        development: true,
        dir,
        force: false,
        forceSharedLockfile: false,
        lockfileDir,
        optional: true,
        packageManager,
        pending: false,
        production: true,
        rawConfig: {},
        registries: utils_1.DEFAULT_REGISTRIES,
        shamefullyHoist: false,
        sideEffectsCacheRead: false,
        storeDir: opts.storeDir,
        unsafePerm: process.platform === 'win32' ||
            process.platform === 'cygwin' ||
            !(process.getuid && process.setuid &&
                process.getgid && process.setgid) ||
            process.getuid() !== 0,
        useLockfile: true,
        userAgent: `${packageManager.name}/${packageManager.version} npm/? node/${process.version} ${process.platform} ${process.arch}`,
    };
};
exports.default = async (opts) => {
    if (opts) {
        for (const key in opts) {
            if (opts[key] === undefined) {
                delete opts[key];
            }
        }
    }
    const defaultOpts = await defaults(opts);
    const extendedOpts = { ...defaultOpts, ...opts, storeDir: defaultOpts.storeDir };
    extendedOpts.registries = utils_1.normalizeRegistries(extendedOpts.registries);
    return extendedOpts;
};

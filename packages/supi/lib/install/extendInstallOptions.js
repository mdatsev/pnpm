"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("@pnpm/constants");
const error_1 = require("@pnpm/error");
const utils_1 = require("@pnpm/utils");
const path = require("path");
const pnpmPkgJson_1 = require("../pnpmPkgJson");
const defaults = async (opts) => {
    const packageManager = opts.packageManager || {
        name: pnpmPkgJson_1.default.name,
        version: pnpmPkgJson_1.default.version,
    };
    return {
        childConcurrency: 5,
        depth: 0,
        engineStrict: false,
        force: false,
        forceSharedLockfile: false,
        frozenLockfile: false,
        hoistPattern: undefined,
        hooks: {},
        ignoreCurrentPrefs: false,
        ignoreScripts: false,
        include: {
            dependencies: true,
            devDependencies: true,
            optionalDependencies: true,
        },
        independentLeaves: false,
        localPackages: {},
        lock: true,
        lockfileDir: opts.lockfileDir || opts.dir || process.cwd(),
        lockfileOnly: false,
        locks: path.join(opts.storeDir, '_locks'),
        lockStaleDuration: 5 * 60 * 1000,
        nodeVersion: process.version,
        ownLifecycleHooksStdio: 'inherit',
        packageManager,
        preferFrozenLockfile: true,
        pruneLockfileImporters: false,
        pruneStore: false,
        rawConfig: {},
        registries: utils_1.DEFAULT_REGISTRIES,
        resolutionStrategy: 'fast',
        saveWorkspaceProtocol: true,
        shamefullyHoist: false,
        sideEffectsCacheRead: false,
        sideEffectsCacheWrite: false,
        storeController: opts.storeController,
        storeDir: opts.storeDir,
        strictPeerDependencies: false,
        tag: 'latest',
        unsafePerm: process.platform === 'win32' ||
            process.platform === 'cygwin' ||
            !(process.getuid && process.setuid &&
                process.getgid && process.setgid) ||
            process.getuid() !== 0,
        update: false,
        useLockfile: true,
        userAgent: `${packageManager.name}/${packageManager.version} npm/? node/${process.version} ${process.platform} ${process.arch}`,
        verifyStoreIntegrity: true,
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
    const extendedOpts = {
        ...defaultOpts,
        ...opts,
        storeDir: defaultOpts.storeDir,
    };
    if (!extendedOpts.useLockfile && extendedOpts.lockfileOnly) {
        throw new error_1.default('CONFIG_CONFLICT_LOCKFILE_ONLY_WITH_NO_LOCKFILE', `Cannot generate a ${constants_1.WANTED_LOCKFILE} because lockfile is set to false`);
    }
    if (extendedOpts.userAgent.startsWith('npm/')) {
        extendedOpts.userAgent = `${extendedOpts.packageManager.name}/${extendedOpts.packageManager.version} ${extendedOpts.userAgent}`;
    }
    extendedOpts.registries = utils_1.normalizeRegistries(extendedOpts.registries);
    extendedOpts.rawConfig['registry'] = extendedOpts.registries.default; // tslint:disable-line:no-string-literal
    return extendedOpts;
};

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("@pnpm/constants");
const error_1 = require("@pnpm/error");
const loadNpmConf = require("@zkochan/npm-conf");
const npmTypes = require("@zkochan/npm-conf/lib/types");
const camelcase_1 = require("camelcase");
const findUp = require("find-up");
const path = require("path");
const whichcb = require("which");
const findBestGlobalPrefixOnWindows_1 = require("./findBestGlobalPrefixOnWindows");
const getScopeRegistries_1 = require("./getScopeRegistries");
const npmDefaults = loadNpmConf.defaults;
function which(cmd) {
    return new Promise((resolve, reject) => {
        whichcb(cmd, (err, resolvedPath) => err ? reject(err) : resolve(resolvedPath));
    });
}
exports.types = Object.assign({
    'audit-level': ['low', 'moderate', 'high', 'critical'],
    'background': Boolean,
    'bail': Boolean,
    'child-concurrency': Number,
    'color': ['always', 'auto', 'never'],
    'dev': [null, true],
    'dir': String,
    'fetching-concurrency': Number,
    'filter': [String, Array],
    'frozen-lockfile': Boolean,
    'frozen-shrinkwrap': Boolean,
    'global-dir': String,
    'global-path': String,
    'global-pnpmfile': String,
    'hoist': Boolean,
    'hoist-pattern': Array,
    'ignore-pnpmfile': Boolean,
    'ignore-stop-requests': Boolean,
    'ignore-upload-requests': Boolean,
    'ignore-workspace-root-check': Boolean,
    'independent-leaves': Boolean,
    'latest': Boolean,
    'link-workspace-packages': Boolean,
    'lock': Boolean,
    'lock-stale-duration': Number,
    'lockfile': Boolean,
    'lockfile-dir': String,
    'lockfile-directory': String,
    'lockfile-only': Boolean,
    'network-concurrency': Number,
    'offline': Boolean,
    'package-import-method': ['auto', 'hardlink', 'clone', 'copy'],
    'pending': Boolean,
    'pnpmfile': String,
    'port': Number,
    'prefer-frozen-lockfile': Boolean,
    'prefer-frozen-shrinkwrap': Boolean,
    'prefer-offline': Boolean,
    'production': [null, true],
    'protocol': ['auto', 'tcp', 'ipc'],
    'reporter': String,
    'resolution-strategy': ['fast', 'fewer-dependencies'],
    'save-peer': Boolean,
    'save-workspace-protocol': Boolean,
    'shamefully-flatten': Boolean,
    'shamefully-hoist': Boolean,
    'shared-workspace-lockfile': Boolean,
    'shared-workspace-shrinkwrap': Boolean,
    'shrinkwrap-directory': String,
    'shrinkwrap-only': Boolean,
    'side-effects-cache': Boolean,
    'side-effects-cache-readonly': Boolean,
    'sort': Boolean,
    'store': String,
    'store-dir': String,
    'strict-peer-dependencies': Boolean,
    'table': Boolean,
    'use-beta-cli': Boolean,
    'use-running-store-server': Boolean,
    'use-store-server': Boolean,
    'verify-store-integrity': Boolean,
    'virtual-store-dir': String,
    'workspace-concurrency': Number,
}, npmTypes.types);
const WORKSPACE_MANIFEST_FILENAME = 'pnpm-workspace.yaml';
exports.default = async (opts) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    const packageManager = (_a = opts.packageManager, (_a !== null && _a !== void 0 ? _a : { name: 'pnpm', version: 'undefined' }));
    const cliArgs = (_b = opts.cliArgs, (_b !== null && _b !== void 0 ? _b : {}));
    const command = (_c = opts.command, (_c !== null && _c !== void 0 ? _c : []));
    const warnings = new Array();
    switch (command[command.length - 1]) {
        case 'update':
            if (typeof cliArgs['frozen-lockfile'] !== 'undefined') {
                throw new error_1.default('CONFIG_BAD_OPTION', 'The "frozen-lockfile" option cannot be used with the "update" command');
            }
            if (typeof cliArgs['prefer-frozen-lockfile'] !== 'undefined') {
                throw new error_1.default('CONFIG_BAD_OPTION', 'The "prefer-frozen-lockfile" option cannot be used with the "update" command');
            }
            break;
    }
    if (cliArgs['hoist'] === false) {
        if (cliArgs['shamefully-hoist'] === true) {
            throw new error_1.default('CONFIG_CONFLICT_HOIST', '--shamefully-hoist cannot be used with --no-hoist');
        }
        if (cliArgs['shamefully-flatten'] === true) {
            throw new error_1.default('CONFIG_CONFLICT_HOIST', '--shamefully-flatten cannot be used with --no-hoist');
        }
        if (cliArgs['hoist-pattern']) {
            throw new error_1.default('CONFIG_CONFLICT_HOIST', '--hoist-pattern cannot be used with --no-hoist');
        }
    }
    // This is what npm does as well, overriding process.execPath with the resolved location of Node.
    // The value of process.execPath is changed only for the duration of config initialization.
    // Otherwise, npmConfig.globalPrefix would sometimes have the bad location.
    //
    // TODO: use this workaround only during global installation
    const originalExecPath = process.execPath;
    try {
        const node = await which(process.argv[0]);
        if (node.toUpperCase() !== process.execPath.toUpperCase()) {
            process.execPath = node;
        }
    }
    catch (err) { } // tslint:disable-line:no-empty
    if (cliArgs['dir']) {
        cliArgs['prefix'] = cliArgs['dir']; // the npm config system still expects `prefix`
    }
    const dir = (_d = cliArgs['dir'], (_d !== null && _d !== void 0 ? _d : process.cwd()));
    const workspaceDir = cliArgs['global'] // tslint:disable-line
        ? undefined
        : await findWorkspacePrefix(dir);
    const npmConfig = loadNpmConf(cliArgs, exports.types, {
        'bail': true,
        'color': 'auto',
        'depth': (command[0] === 'list' || command[1] === 'list') ? 0 : Infinity,
        'fetch-retries': 2,
        'fetch-retry-factor': 10,
        'fetch-retry-maxtimeout': 60000,
        'fetch-retry-mintimeout': 10000,
        'globalconfig': npmDefaults.globalconfig,
        'hoist': true,
        'hoist-pattern': ['*'],
        'ignore-workspace-root-check': false,
        'latest': false,
        'link-workspace-packages': true,
        'lock': true,
        'package-lock': npmDefaults['package-lock'],
        'pending': false,
        'registry': npmDefaults.registry,
        'resolution-strategy': 'fewer-dependencies',
        'save-peer': false,
        'save-workspace-protocol': true,
        'shamefully-hoist': false,
        'shared-workspace-lockfile': true,
        'shared-workspace-shrinkwrap': true,
        'shrinkwrap': npmDefaults.shrinkwrap,
        'sort': true,
        'strict-peer-dependencies': false,
        'unsafe-perm': npmDefaults['unsafe-perm'],
        'use-beta-cli': false,
        'userconfig': npmDefaults.userconfig,
        'virtual-store-dir': 'node_modules/.pnpm',
        'workspace-concurrency': 4,
        'workspace-prefix': workspaceDir,
    });
    delete cliArgs['prefix'];
    process.execPath = originalExecPath;
    const pnpmConfig = Object.keys(exports.types) // tslint:disable-line
        .reduce((acc, configKey) => {
        acc[camelcase_1.default(configKey)] = typeof cliArgs[configKey] !== 'undefined'
            ? cliArgs[configKey]
            : npmConfig.get(configKey);
        return acc;
    }, {});
    const cwd = (_e = (cliArgs['dir'] && path.resolve(cliArgs['dir'])), (_e !== null && _e !== void 0 ? _e : npmConfig.localPrefix)); // tslint:disable-line
    pnpmConfig.workspaceDir = workspaceDir;
    pnpmConfig.rawLocalConfig = Object.assign.apply(Object, [
        {},
        ...npmConfig.list.slice(3, pnpmConfig.workspaceDir && pnpmConfig.workspaceDir !== cwd ? 5 : 4).reverse(),
        cliArgs,
    ]); // tslint:disable-line:no-any
    pnpmConfig.userAgent = pnpmConfig.rawLocalConfig['user-agent']
        ? pnpmConfig.rawLocalConfig['user-agent']
        : `${packageManager.name}/${packageManager.version} npm/? node/${process.version} ${process.platform} ${process.arch}`;
    pnpmConfig.rawConfig = Object.assign.apply(Object, [
        { registry: 'https://registry.npmjs.org/' },
        ...[...npmConfig.list].reverse(),
        cliArgs,
        { 'user-agent': pnpmConfig.userAgent },
    ]); // tslint:disable-line:no-any
    pnpmConfig.registries = {
        default: getScopeRegistries_1.normalizeRegistry(pnpmConfig.rawConfig.registry),
        ...getScopeRegistries_1.default(pnpmConfig.rawConfig),
    };
    const npmGlobalPrefix = (_g = (_f = pnpmConfig.globalDir, (_f !== null && _f !== void 0 ? _f : pnpmConfig.rawConfig['pnpm-prefix'])), (_g !== null && _g !== void 0 ? _g : (process.platform !== 'win32'
        ? npmConfig.globalPrefix
        : findBestGlobalPrefixOnWindows_1.default(npmConfig.globalPrefix, process.env))));
    pnpmConfig.globalBin = process.platform === 'win32'
        ? npmGlobalPrefix
        : path.resolve(npmGlobalPrefix, 'bin');
    pnpmConfig.globalDir = pnpmConfig.globalDir ? npmGlobalPrefix : path.join(npmGlobalPrefix, 'pnpm-global');
    pnpmConfig.lockfileDir = (_j = (_h = pnpmConfig.lockfileDir, (_h !== null && _h !== void 0 ? _h : pnpmConfig.lockfileDirectory)), (_j !== null && _j !== void 0 ? _j : pnpmConfig.shrinkwrapDirectory));
    pnpmConfig.useLockfile = (() => {
        if (typeof pnpmConfig['lockfile'] === 'boolean')
            return pnpmConfig['lockfile'];
        if (typeof pnpmConfig['packageLock'] === 'boolean')
            return pnpmConfig['packageLock'];
        if (typeof pnpmConfig['shrinkwrap'] === 'boolean')
            return pnpmConfig['shrinkwrap'];
        return false;
    })();
    pnpmConfig.lockfileOnly = typeof pnpmConfig['lockfileOnly'] === 'undefined'
        ? pnpmConfig.shrinkwrapOnly
        : pnpmConfig['lockfileOnly'];
    pnpmConfig.frozenLockfile = typeof pnpmConfig['frozenLockfile'] === 'undefined'
        ? pnpmConfig.frozenShrinkwrap
        : pnpmConfig['frozenLockfile'];
    pnpmConfig.preferFrozenLockfile = typeof pnpmConfig['preferFrozenLockfile'] === 'undefined'
        ? pnpmConfig.preferFrozenShrinkwrap
        : pnpmConfig['preferFrozenLockfile'];
    pnpmConfig.sharedWorkspaceLockfile = typeof pnpmConfig['sharedWorkspaceLockfile'] === 'undefined'
        ? pnpmConfig.sharedWorkspaceShrinkwrap
        : pnpmConfig['sharedWorkspaceLockfile'];
    if (cliArgs['global']) {
        pnpmConfig.dir = path.join(pnpmConfig.globalDir, constants_1.LAYOUT_VERSION.toString());
        pnpmConfig.bin = pnpmConfig.globalBin;
        pnpmConfig.allowNew = true;
        pnpmConfig.ignoreCurrentPrefs = true;
        pnpmConfig.saveProd = true;
        pnpmConfig.saveDev = false;
        pnpmConfig.saveOptional = false;
        if (pnpmConfig.independentLeaves) {
            if (opts.cliArgs['independent-leaves']) {
                throw new error_1.default('CONFIG_CONFLICT_INDEPENDENT_LEAVES_WITH_GLOBAL', 'Configuration conflict. "independent-leaves" may not be used with "global"');
            }
            pnpmConfig.independentLeaves = false;
        }
        if (pnpmConfig.hoistPattern && (pnpmConfig.hoistPattern.length > 1 || pnpmConfig.hoistPattern[0] !== '*')) {
            if (opts.cliArgs['hoist-pattern']) {
                throw new error_1.default('CONFIG_CONFLICT_HOIST_PATTERN_WITH_GLOBAL', 'Configuration conflict. "hoist-pattern" may not be used with "global"');
            }
            pnpmConfig.independentLeaves = false;
        }
        if (pnpmConfig.linkWorkspacePackages) {
            if (opts.cliArgs['link-workspace-packages']) {
                throw new error_1.default('CONFIG_CONFLICT_LINK_WORKSPACE_PACKAGES_WITH_GLOBAL', 'Configuration conflict. "link-workspace-packages" may not be used with "global"');
            }
            pnpmConfig.linkWorkspacePackages = false;
        }
        if (pnpmConfig.sharedWorkspaceLockfile) {
            if (opts.cliArgs['shared-workspace-lockfile']) {
                throw new error_1.default('CONFIG_CONFLICT_SHARED_WORKSPACE_LOCKFILE_WITH_GLOBAL', 'Configuration conflict. "shared-workspace-lockfile" may not be used with "global"');
            }
            pnpmConfig.sharedWorkspaceLockfile = false;
        }
        if (pnpmConfig.lockfileDir) {
            if (opts.cliArgs['lockfile-dir']) {
                throw new error_1.default('CONFIG_CONFLICT_LOCKFILE_DIR_WITH_GLOBAL', 'Configuration conflict. "lockfile-dir" may not be used with "global"');
            }
            delete pnpmConfig.lockfileDir;
        }
        if (opts.cliArgs['virtual-store-dir']) {
            throw new error_1.default('CONFIG_CONFLICT_VIRTUAL_STORE_DIR_WITH_GLOBAL', 'Configuration conflict. "virtual-store-dir" may not be used with "global"');
        }
        delete pnpmConfig.virtualStoreDir;
    }
    else {
        pnpmConfig.dir = cwd;
        pnpmConfig.bin = path.join(pnpmConfig.dir, 'node_modules', '.bin');
    }
    if (opts.cliArgs['save-peer']) {
        if (opts.cliArgs['save-prod']) {
            throw new error_1.default('CONFIG_CONFLICT_PEER_CANNOT_BE_PROD_DEP', 'A package cannot be a peer dependency and a prod dependency at the same time');
        }
        if (opts.cliArgs['save-optional']) {
            throw new error_1.default('CONFIG_CONFLICT_PEER_CANNOT_BE_OPTIONAL_DEP', 'A package cannot be a peer dependency and an optional dependency at the same time');
        }
        pnpmConfig.saveDev = true;
    }
    if (pnpmConfig.sharedWorkspaceLockfile && !pnpmConfig.lockfileDir && pnpmConfig.workspaceDir) {
        pnpmConfig.lockfileDir = pnpmConfig.workspaceDir;
    }
    pnpmConfig.packageManager = packageManager;
    if (pnpmConfig.only === 'prod' || pnpmConfig.only === 'production' || !pnpmConfig.only && pnpmConfig.production) {
        pnpmConfig.production = true;
        pnpmConfig.development = false;
    }
    else if (pnpmConfig.only === 'dev' || pnpmConfig.only === 'development' || pnpmConfig.dev) {
        pnpmConfig.production = false;
        pnpmConfig.development = true;
        pnpmConfig.optional = false;
    }
    else {
        pnpmConfig.production = true;
        pnpmConfig.development = true;
    }
    pnpmConfig.include = {
        dependencies: pnpmConfig.production !== false,
        devDependencies: pnpmConfig.development !== false,
        optionalDependencies: pnpmConfig.optional !== false,
    };
    if (typeof pnpmConfig.filter === 'string') {
        pnpmConfig.filter = pnpmConfig.filter.split(' ');
    }
    pnpmConfig.sideEffectsCacheRead = pnpmConfig.sideEffectsCache || pnpmConfig.sideEffectsCacheReadonly;
    pnpmConfig.sideEffectsCacheWrite = pnpmConfig.sideEffectsCache;
    if (!pnpmConfig.ignoreScripts && pnpmConfig.workspaceDir) {
        pnpmConfig.extraBinPaths = [path.join(pnpmConfig.workspaceDir, 'node_modules', '.bin')];
    }
    else {
        pnpmConfig.extraBinPaths = [];
    }
    if (pnpmConfig['shamefullyFlatten']) {
        warnings.push('The "shamefully-flatten" setting has been renamed to "shamefully-hoist". Also, in most cases you won\'t need "shamefully-hoist". Since v4, a semistrict node_modules structure is on by default (via hoist-pattern=[*]).');
        pnpmConfig.shamefullyHoist = true;
    }
    if (!pnpmConfig.storeDir && pnpmConfig['store']) {
        warnings.push('The "store" setting has been renamed to "store-dir". Please use the new name.');
        pnpmConfig.storeDir = pnpmConfig['store'];
    }
    if (pnpmConfig['hoist'] === false) {
        delete pnpmConfig.hoistPattern;
    }
    else if (pnpmConfig.independentLeaves === true) {
        throw new error_1.default('CONFIG_CONFLICT_INDEPENDENT_LEAVES_AND_HOIST', '"independent-leaves=true" can only be used when hoisting is off, so "hoist=false"');
    }
    if (typeof pnpmConfig['color'] === 'boolean') {
        switch (pnpmConfig['color']) {
            case true:
                pnpmConfig.color = 'always';
                break;
            case false:
                pnpmConfig.color = 'never';
                break;
            default:
                pnpmConfig.color = 'auto';
                break;
        }
    }
    return { config: pnpmConfig, warnings };
};
async function findWorkspacePrefix(prefix) {
    const workspaceManifestLocation = await findUp(WORKSPACE_MANIFEST_FILENAME, { cwd: prefix });
    return workspaceManifestLocation && path.dirname(workspaceManifestLocation);
}
exports.findWorkspacePrefix = findWorkspacePrefix;

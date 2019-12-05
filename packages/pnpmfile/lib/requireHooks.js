"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_loggers_1 = require("@pnpm/core-loggers");
const logger_1 = require("@pnpm/logger");
const path = require("path");
const pathAbsolute = require("path-absolute");
const R = require("ramda");
const requirePnpmfile_1 = require("./requirePnpmfile");
function requireHooks(prefix, opts) {
    var _a, _b;
    const globalPnpmfile = opts.globalPnpmfile && requirePnpmfile_1.default(pathAbsolute(opts.globalPnpmfile, prefix), prefix);
    let globalHooks = (_a = globalPnpmfile) === null || _a === void 0 ? void 0 : _a.hooks;
    const pnpmFile = opts.pnpmfile && requirePnpmfile_1.default(pathAbsolute(opts.pnpmfile, prefix), prefix)
        || requirePnpmfile_1.default(path.join(prefix, 'pnpmfile.js'), prefix);
    let hooks = (_b = pnpmFile) === null || _b === void 0 ? void 0 : _b.hooks;
    if (!globalHooks && !hooks)
        return {};
    globalHooks = globalHooks || {};
    hooks = hooks || {};
    const cookedHooks = {};
    if (globalHooks.readPackage || hooks.readPackage) {
        logger_1.default.info({
            message: 'readPackage hook is declared. Manifests of dependencies might get overridden',
            prefix,
        });
    }
    for (const hookName of ['readPackage', 'afterAllResolved']) {
        if (globalHooks[hookName] && hooks[hookName]) {
            const globalHookContext = createReadPackageHookContext(globalPnpmfile.filename, prefix, hookName);
            const localHookContext = createReadPackageHookContext(pnpmFile.filename, prefix, hookName);
            // the `arg` is a package manifest in case of readPackage() and a lockfile object in case of afterAllResolved()
            cookedHooks[hookName] = (arg) => {
                return hooks[hookName](globalHooks[hookName](arg, globalHookContext), localHookContext);
            };
        }
        else if (globalHooks[hookName]) {
            cookedHooks[hookName] = R.partialRight(globalHooks[hookName], [createReadPackageHookContext(globalPnpmfile.filename, prefix, hookName)]);
        }
        else if (hooks[hookName]) {
            cookedHooks[hookName] = R.partialRight(hooks[hookName], [createReadPackageHookContext(pnpmFile.filename, prefix, hookName)]);
        }
    }
    return cookedHooks;
}
exports.default = requireHooks;
function createReadPackageHookContext(calledFrom, prefix, hook) {
    return {
        log: (message) => core_loggers_1.hookLogger.debug({
            from: calledFrom,
            hook,
            message,
            prefix,
        }),
    };
}
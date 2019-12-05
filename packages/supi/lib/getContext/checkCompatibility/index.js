"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("@pnpm/constants");
const path = require("path");
const ModulesBreakingChangeError_1 = require("./ModulesBreakingChangeError");
const UnexpectedStoreError_1 = require("./UnexpectedStoreError");
const UnexpectedVirtualStoreDirError_1 = require("./UnexpectedVirtualStoreDirError");
function checkCompatibility(modules, opts) {
    // Important: comparing paths with path.relative()
    // is the only way to compare paths correctly on Windows
    // as of Node.js 4-9
    // See related issue: https://github.com/pnpm/pnpm/issues/996
    if (path.relative(modules.store, opts.storeDir) !== '') {
        throw new UnexpectedStoreError_1.default({
            actualStorePath: opts.storeDir,
            expectedStorePath: modules.store,
            modulesDir: opts.modulesDir,
        });
    }
    if (modules.virtualStoreDir && path.relative(modules.virtualStoreDir, opts.virtualStoreDir) !== '') {
        throw new UnexpectedVirtualStoreDirError_1.default({
            actual: opts.virtualStoreDir,
            expected: modules.virtualStoreDir,
            modulesDir: opts.modulesDir,
        });
    }
    if (!modules.layoutVersion || modules.layoutVersion !== constants_1.LAYOUT_VERSION) {
        throw new ModulesBreakingChangeError_1.default({
            modulesPath: opts.modulesDir,
        });
    }
}
exports.default = checkCompatibility;

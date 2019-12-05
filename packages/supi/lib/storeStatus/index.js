"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const check_package_1 = require("@pnpm/check-package");
const logger_1 = require("@pnpm/logger");
const dp = require("dependency-path");
const pFilter = require("p-filter");
const path = require("path");
const getContext_1 = require("../getContext");
const extendStoreStatusOptions_1 = require("./extendStoreStatusOptions");
async function default_1(maybeOpts) {
    var _a;
    const reporter = (_a = maybeOpts) === null || _a === void 0 ? void 0 : _a.reporter;
    if (reporter) {
        logger_1.streamParser.on('data', reporter);
    }
    const opts = await extendStoreStatusOptions_1.default(maybeOpts);
    const { registries, storeDir, skipped, wantedLockfile, } = await getContext_1.getContextForSingleImporter({}, {
        ...opts,
        extraBinPaths: [],
    });
    if (!wantedLockfile)
        return [];
    const pkgPaths = Object.keys(wantedLockfile.packages || {})
        .map((id) => {
        if (id === '/')
            return null;
        return dp.resolve(registries, id);
    })
        .filter((pkgId) => pkgId && !skipped.has(pkgId))
        .map((pkgPath) => path.join(storeDir, pkgPath));
    const modified = await pFilter(pkgPaths, async (pkgPath) => !await check_package_1.default(path.join(pkgPath, 'package')));
    if (reporter) {
        logger_1.streamParser.removeListener('data', reporter);
    }
    return modified;
}
exports.default = default_1;

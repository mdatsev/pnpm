"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_loggers_1 = require("@pnpm/core-loggers");
const checkEngine_1 = require("./checkEngine");
exports.UnsupportedEngineError = checkEngine_1.UnsupportedEngineError;
const checkPlatform_1 = require("./checkPlatform");
exports.UnsupportedPlatformError = checkPlatform_1.UnsupportedPlatformError;
function packageIsInstallable(pkgId, pkg, options) {
    const warn = checkPackage(pkgId, pkg, options);
    if (!warn)
        return true;
    core_loggers_1.installCheckLogger.warn({
        message: warn.message,
        prefix: options.lockfileDir,
    });
    if (options.optional) {
        core_loggers_1.skippedOptionalDependencyLogger.debug({
            details: warn.toString(),
            package: {
                id: pkgId,
                name: pkg.name,
                version: pkg.version,
            },
            prefix: options.lockfileDir,
            reason: warn.code === 'ERR_PNPM_UNSUPPORTED_ENGINE' ? 'unsupported_engine' : 'unsupported_platform',
        });
        return false;
    }
    if (options.engineStrict)
        throw warn;
    return null;
}
exports.default = packageIsInstallable;
function checkPackage(pkgId, manifest, options) {
    return checkPlatform_1.default(pkgId, {
        cpu: manifest.cpu || ['any'],
        os: manifest.os || ['any'],
    }) || (manifest.engines &&
        checkEngine_1.default(pkgId, manifest.engines, {
            node: options.nodeVersion || process.version,
            pnpm: options.pnpmVersion,
        })) || null;
}
exports.checkPackage = checkPackage;

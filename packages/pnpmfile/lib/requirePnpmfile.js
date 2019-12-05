"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const error_1 = require("@pnpm/error");
const logger_1 = require("@pnpm/logger");
const chalk = require("chalk");
const fs = require("fs");
class BadReadPackageHookError extends error_1.default {
    constructor(pnpmfile) {
        super('BAD_READ_PACKAGE_HOOK_RESULT', `readPackage hook did not return a package manifest object. Hook imported via ${pnpmfile}`);
        this.pnpmfile = pnpmfile;
    }
}
class PnpmFileFailError extends error_1.default {
    constructor(pnpmfile, originalError) {
        super('PNPMFILE_FAIL', `Error during pnpmfile execution. pnpmfile: "${pnpmfile}". Error: "${originalError.message}".`);
        this.pnpmfile = pnpmfile;
        this.originalError = originalError;
    }
}
exports.default = (pnpmFilePath, prefix) => {
    var _a, _b, _c, _d;
    try {
        const pnpmfile = require(pnpmFilePath);
        logger_1.default.info({
            message: `Using hooks from: ${pnpmFilePath}`,
            prefix,
        });
        if (((_b = (_a = pnpmfile) === null || _a === void 0 ? void 0 : _a.hooks) === null || _b === void 0 ? void 0 : _b.readPackage) && typeof pnpmfile.hooks.readPackage !== 'function') {
            throw new TypeError('hooks.readPackage should be a function');
        }
        if ((_d = (_c = pnpmfile) === null || _c === void 0 ? void 0 : _c.hooks) === null || _d === void 0 ? void 0 : _d.readPackage) {
            const readPackage = pnpmfile.hooks.readPackage;
            pnpmfile.hooks.readPackage = function (pkg, ...args) {
                pkg.dependencies = pkg.dependencies || {};
                pkg.devDependencies = pkg.devDependencies || {};
                pkg.optionalDependencies = pkg.optionalDependencies || {};
                pkg.peerDependencies = pkg.peerDependencies || {};
                const newPkg = readPackage(pkg, ...args);
                if (!newPkg) {
                    throw new BadReadPackageHookError(pnpmFilePath);
                }
                return newPkg;
            };
        }
        pnpmfile.filename = pnpmFilePath;
        return pnpmfile;
    }
    catch (err) {
        if (err instanceof SyntaxError) {
            console.error(chalk.red('A syntax error in the pnpmfile.js\n'));
            console.error(err);
            process.exit(1);
            return;
        }
        if (err.code !== 'MODULE_NOT_FOUND' || pnpmFileExistsSync(pnpmFilePath)) {
            throw new PnpmFileFailError(pnpmFilePath, err);
        }
        return undefined;
    }
};
function pnpmFileExistsSync(pnpmFilePath) {
    const pnpmFileRealName = pnpmFilePath.endsWith('.js')
        ? pnpmFilePath
        : `${pnpmFilePath}.js`;
    return fs.existsSync(pnpmFileRealName);
}

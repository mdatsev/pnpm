"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const read_package_json_1 = require("@pnpm/read-package-json");
const path = require("path");
async function safeReadPkg(pkgPath) {
    try {
        return await read_package_json_1.default(pkgPath);
    }
    catch (err) {
        if (err.code !== 'ENOENT')
            throw err;
        return null;
    }
}
exports.default = safeReadPkg;
function fromDir(pkgPath) {
    return safeReadPkg(path.join(pkgPath, 'package.json'));
}
exports.fromDir = fromDir;
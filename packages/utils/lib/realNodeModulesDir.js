"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("mz/fs");
const path = require("path");
async function realNodeModulesDir(prefix) {
    const dirName = path.join(prefix, 'node_modules');
    try {
        return await fs.realpath(dirName);
    }
    catch (err) {
        if (err['code'] === 'ENOENT') { // tslint:disable-line:no-string-literal
            return dirName;
        }
        throw err;
    }
}
exports.default = realNodeModulesDir;

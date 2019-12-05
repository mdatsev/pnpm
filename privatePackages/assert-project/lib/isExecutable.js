"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const isWindows = require("is-windows");
const isexeCB = require("isexe");
const fs = require("mz/fs");
const util_1 = require("util");
const IS_WINDOWS = isWindows();
const isexe = util_1.promisify(isexeCB);
exports.default = async (t, filePath) => {
    if (IS_WINDOWS) {
        t.ok(await isexe(`${filePath}.cmd`), `${filePath}.cmd is executable`);
        return;
    }
    const stat = await fs.stat(filePath);
    t.equal(stat.mode, parseInt('100755', 8), `${filePath} is executable`);
    t.ok(stat.isFile(), `${filePath} refers to a file`);
};

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const R = require("ramda");
function lockfilesEqual(lockfile1, lockfile2) {
    const importers1 = R.keys(lockfile1.importers);
    const importers2 = R.keys(lockfile2.importers);
    if (importers1.length !== importers2.length || !R.equals(importers1, importers2)) {
        return false;
    }
    const pkgs1 = R.keys(lockfile1.packages);
    const pkgs2 = R.keys(lockfile2.packages);
    return pkgs1.length === pkgs2.length && R.equals(pkgs1, pkgs2);
}
exports.default = lockfilesEqual;

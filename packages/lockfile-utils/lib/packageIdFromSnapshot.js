"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dp = require("dependency-path");
exports.default = (relDepPath, pkgSnapshot, registries) => {
    if (pkgSnapshot.id)
        return pkgSnapshot.id;
    return dp.tryGetPackageId(registries, relDepPath) || relDepPath;
};
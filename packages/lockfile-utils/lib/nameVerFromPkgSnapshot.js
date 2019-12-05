"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dp = require("dependency-path");
exports.default = (relDepPath, pkgSnapshot) => {
    if (!pkgSnapshot.name) {
        const pkgInfo = dp.parse(relDepPath);
        return {
            name: pkgInfo.name,
            peersSuffix: pkgInfo.peersSuffix,
            version: pkgInfo.version,
        };
    }
    return {
        name: pkgSnapshot.name,
        peersSuffix: undefined,
        version: pkgSnapshot.version,
    };
};

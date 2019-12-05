"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const encodeRegistry = require("encode-registry");
function createPkgId(registry, pkgName, pkgVersion) {
    const escapedRegistryHost = encodeRegistry(registry);
    return `${escapedRegistryHost}/${pkgName}/${pkgVersion}`;
}
exports.default = createPkgId;

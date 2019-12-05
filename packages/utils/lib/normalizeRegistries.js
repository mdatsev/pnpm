"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const normalizeRegistryUrl = require("normalize-registry-url");
exports.DEFAULT_REGISTRIES = {
    default: 'https://registry.npmjs.org/',
};
function normalizeRegistries(registries) {
    if (!registries)
        return exports.DEFAULT_REGISTRIES;
    const normalizeRegistries = {};
    for (const scope of Object.keys(registries)) {
        normalizeRegistries[scope] = normalizeRegistryUrl(registries[scope]);
    }
    return {
        ...exports.DEFAULT_REGISTRIES,
        ...normalizeRegistries,
    };
}
exports.default = normalizeRegistries;
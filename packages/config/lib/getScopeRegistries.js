"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function getScopeRegistries(rawConfig) {
    const registries = {};
    for (const configKey of Object.keys(rawConfig)) {
        if (configKey[0] === '@' && configKey.endsWith(':registry')) {
            registries[configKey.substr(0, configKey.indexOf(':'))] = normalizeRegistry(rawConfig[configKey]);
        }
    }
    return registries;
}
exports.default = getScopeRegistries;
function normalizeRegistry(registry) {
    return registry.endsWith('/') ? registry : `${registry}/`;
}
exports.normalizeRegistry = normalizeRegistry;

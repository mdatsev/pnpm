"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const isSubdir = require("is-subdir");
const path = require("path");
function findBestGlobalPrefixOnWindows(defaultNpmGlobalPrefix, env) {
    if (env.LOCALAPPDATA && isSubdir(env.LOCALAPPDATA, defaultNpmGlobalPrefix) ||
        env.APPDATA && isSubdir(env.APPDATA, defaultNpmGlobalPrefix)) {
        return defaultNpmGlobalPrefix;
    }
    if (env.APPDATA)
        return path.join(env.APPDATA, 'npm');
    return defaultNpmGlobalPrefix;
}
exports.default = findBestGlobalPrefixOnWindows;

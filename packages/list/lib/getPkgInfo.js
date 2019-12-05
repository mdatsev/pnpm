"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const readPkg_1 = require("./readPkg");
async function getPkgInfo(pkg) {
    let manifest;
    try {
        manifest = await readPkg_1.default(path.join(pkg.path, 'node_modules', pkg.name, 'package.json'));
    }
    catch (err) {
        // This is a temporary workaround.
        // If the package.json is not found inside node_modules, it should be read from the store.
        // This frequently happens when the independent-leaves config is true.
        manifest = {
            description: '[Could not find additional info about this dependency]'
        };
    }
    return {
        alias: pkg.alias,
        from: pkg.name,
        version: pkg.version,
        resolved: pkg.resolved,
        description: manifest.description,
        homepage: manifest.homepage,
        repository: manifest.repository && (typeof manifest.repository === 'string' ? manifest.repository : manifest.repository.url) || undefined,
    };
}
exports.default = getPkgInfo;

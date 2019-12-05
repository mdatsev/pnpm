"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dp = require("dependency-path");
const get_npm_tarball_url_1 = require("get-npm-tarball-url");
const url = require("url");
const nameVerFromPkgSnapshot_1 = require("./nameVerFromPkgSnapshot");
exports.default = (relDepPath, pkgSnapshot, registries) => {
    // tslint:disable:no-string-literal
    if (pkgSnapshot.resolution['type']) {
        return pkgSnapshot.resolution;
    }
    if (!pkgSnapshot.resolution['tarball']) {
        const { name } = nameVerFromPkgSnapshot_1.default(relDepPath, pkgSnapshot);
        const registry = name[0] === '@' && registries[name.split('/')[0]] || registries.default;
        return {
            ...pkgSnapshot.resolution,
            registry,
            tarball: getTarball(registry),
        };
    }
    if (pkgSnapshot.resolution['tarball'].startsWith('file:')) {
        return pkgSnapshot.resolution;
    }
    const { name } = nameVerFromPkgSnapshot_1.default(relDepPath, pkgSnapshot);
    const registry = name[0] === '@' && registries[name.split('/')[0]] || registries.default;
    return {
        ...pkgSnapshot.resolution,
        registry,
        tarball: url.resolve(registry, pkgSnapshot.resolution['tarball']),
    };
    function getTarball(registry) {
        const { name, version } = dp.parse(relDepPath);
        if (!name || !version) {
            throw new Error(`Couldn't get tarball URL from dependency path ${relDepPath}`);
        }
        return get_npm_tarball_url_1.default(name, version, { registry });
    }
    // tslint:enable:no-string-literal
};
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const encodeRegistry = require("encode-registry");
const semver = require("semver");
function isAbsolute(dependencyPath) {
    return dependencyPath[0] !== '/';
}
exports.isAbsolute = isAbsolute;
function resolve(registries, resolutionLocation) {
    if (!isAbsolute(resolutionLocation)) {
        let registryUrl;
        if (resolutionLocation[1] === '@') {
            const scope = resolutionLocation.substr(1, resolutionLocation.indexOf('/', 1) - 1);
            registryUrl = registries[scope] || registries.default;
        }
        else {
            registryUrl = registries.default;
        }
        const registryDirectory = encodeRegistry(registryUrl);
        return `${registryDirectory}${resolutionLocation}`;
    }
    return resolutionLocation;
}
exports.resolve = resolve;
function tryGetPackageId(registries, relDepPath) {
    if (relDepPath[0] !== '/') {
        return null;
    }
    const lastUnderscore = relDepPath.lastIndexOf('_');
    if (lastUnderscore > relDepPath.lastIndexOf('/')) {
        return resolve(registries, relDepPath.substr(0, lastUnderscore));
    }
    return resolve(registries, relDepPath);
}
exports.tryGetPackageId = tryGetPackageId;
function refToAbsolute(reference, pkgName, registries) {
    if (reference.startsWith('link:')) {
        return null;
    }
    if (!reference.includes('/')) {
        const registryName = encodeRegistry(getRegistryByPackageName(registries, pkgName));
        return `${registryName}/${pkgName}/${reference}`;
    }
    if (reference[0] !== '/')
        return reference;
    const registryName = encodeRegistry(getRegistryByPackageName(registries, pkgName));
    return `${registryName}${reference}`;
}
exports.refToAbsolute = refToAbsolute;
function getRegistryByPackageName(registries, packageName) {
    if (packageName[0] !== '@')
        return registries.default;
    const scope = packageName.substr(0, packageName.indexOf('/'));
    return registries[scope] || registries.default;
}
exports.getRegistryByPackageName = getRegistryByPackageName;
function relative(registries, packageName, absoluteResolutionLoc) {
    const registryName = encodeRegistry(getRegistryByPackageName(registries, packageName));
    if (absoluteResolutionLoc.startsWith(`${registryName}/`) && !absoluteResolutionLoc.includes('/-/')) {
        return absoluteResolutionLoc.substr(absoluteResolutionLoc.indexOf('/'));
    }
    return absoluteResolutionLoc;
}
exports.relative = relative;
function refToRelative(reference, pkgName) {
    if (reference.startsWith('link:')) {
        return null;
    }
    if (reference.startsWith('file:')) {
        return reference;
    }
    if (!reference.includes('/')) {
        return `/${pkgName}/${reference}`;
    }
    return reference;
}
exports.refToRelative = refToRelative;
function parse(dependencyPath) {
    // tslint:disable-next-line: strict-type-predicates
    if (typeof dependencyPath !== 'string') {
        throw new TypeError(`Expected \`dependencyPath\` to be of type \`string\`, got \`${
        // tslint:disable-next-line: strict-type-predicates
        dependencyPath === null ? 'null' : typeof dependencyPath}\``);
    }
    const _isAbsolute = isAbsolute(dependencyPath);
    const parts = dependencyPath.split('/');
    if (!_isAbsolute)
        parts.shift();
    const host = _isAbsolute ? parts.shift() : undefined;
    const name = parts[0].startsWith('@')
        ? `${parts.shift()}/${parts.shift()}`
        : parts.shift();
    let version = parts.shift();
    if (version) {
        const underscoreIndex = version.indexOf('_');
        let peersSuffix;
        if (underscoreIndex !== -1) {
            peersSuffix = version.substring(underscoreIndex + 1);
            version = version.substring(0, underscoreIndex);
        }
        if (semver.valid(version)) {
            return {
                host,
                isAbsolute: _isAbsolute,
                name,
                peersSuffix,
                version,
            };
        }
    }
    if (!_isAbsolute)
        throw new Error(`${dependencyPath} is an invalid relative dependency path`);
    return {
        host,
        isAbsolute: _isAbsolute,
    };
}
exports.parse = parse;
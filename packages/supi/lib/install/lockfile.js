"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dependency_path_1 = require("dependency-path");
const encodeRegistry = require("encode-registry");
function absolutePathToRef(absolutePath, opts) {
    if (opts.resolution.type)
        return absolutePath;
    const registryName = encodeRegistry(dependency_path_1.getRegistryByPackageName(opts.registries, opts.realName));
    if (absolutePath.startsWith(`${registryName}/`) && !absolutePath.includes('/-/')) {
        if (opts.alias === opts.realName) {
            const ref = absolutePath.replace(`${registryName}/${opts.realName}/`, '');
            if (!ref.includes('/'))
                return ref;
        }
        return absolutePath.replace(`${registryName}/`, '/');
    }
    return absolutePath;
}
exports.absolutePathToRef = absolutePathToRef;
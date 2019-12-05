"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cli_utils_1 = require("@pnpm/cli-utils");
const constants_1 = require("@pnpm/constants");
const find_packages_1 = require("find-packages");
const path = require("path");
const read_yaml_file_1 = require("read-yaml-file");
exports.default = async (workspaceRoot, opts) => {
    var _a;
    const packagesManifest = await requirePackagesManifest(workspaceRoot);
    const pkgs = await find_packages_1.default(workspaceRoot, {
        ignore: [
            '**/node_modules/**',
            '**/bower_components/**',
        ],
        includeRoot: true,
        patterns: ((_a = packagesManifest) === null || _a === void 0 ? void 0 : _a.packages) || undefined,
    });
    pkgs.sort((pkg1, pkg2) => pkg1.dir.localeCompare(pkg2.dir));
    for (const pkg of pkgs) {
        cli_utils_1.packageIsInstallable(pkg.dir, pkg.manifest, opts);
    }
    // FIXME: `name` and `version` might be missing from entries in `pkgs`.
    return pkgs;
};
async function requirePackagesManifest(dir) {
    try {
        return await read_yaml_file_1.default(path.join(dir, constants_1.WORKSPACE_MANIFEST_FILENAME));
    }
    catch (err) {
        if (err['code'] === 'ENOENT') { // tslint:disable-line
            return null;
        }
        throw err;
    }
}
function arrayOfLocalPackagesToMap(pkgs) {
    return pkgs.reduce((acc, pkg) => {
        if (!acc[pkg.manifest.name]) {
            acc[pkg.manifest.name] = {};
        }
        acc[pkg.manifest.name][pkg.manifest.version] = pkg;
        return acc;
    }, {});
}
exports.arrayOfLocalPackagesToMap = arrayOfLocalPackagesToMap;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_loggers_1 = require("@pnpm/core-loggers");
const package_bins_1 = require("@pnpm/package-bins");
const utils_1 = require("@pnpm/utils");
const rimraf = require("@zkochan/rimraf");
const path = require("path");
async function removeDirectDependency(dependency, opts) {
    var _a;
    const results = await Promise.all([
        removeBins(dependency.name, opts),
        !opts.dryRun && remove(path.join(opts.modulesDir, dependency.name)),
    ]);
    const uninstalledPkg = results[0];
    if (!opts.muteLogs) {
        core_loggers_1.rootLogger.debug({
            prefix: opts.rootDir,
            removed: {
                dependencyType: dependency.dependenciesField === 'devDependencies' && 'dev' ||
                    dependency.dependenciesField === 'optionalDependencies' && 'optional' ||
                    dependency.dependenciesField === 'dependencies' && 'prod' ||
                    undefined,
                name: dependency.name,
                version: (_a = uninstalledPkg) === null || _a === void 0 ? void 0 : _a.version,
            },
        });
    }
}
exports.default = removeDirectDependency;
async function removeBins(uninstalledPkg, opts) {
    const uninstalledPkgPath = path.join(opts.modulesDir, uninstalledPkg);
    const uninstalledPkgJson = await utils_1.safeReadPackageFromDir(uninstalledPkgPath);
    if (!uninstalledPkgJson)
        return;
    const cmds = await package_bins_1.default(uninstalledPkgJson, uninstalledPkgPath);
    if (!opts.dryRun) {
        // TODO: what about the .cmd bin files on Windows?
        await Promise.all(cmds
            .map((cmd) => path.join(opts.binsDir, cmd.name))
            .map(remove));
    }
    return uninstalledPkgJson;
}
function remove(p) {
    core_loggers_1.removalLogger.debug(p);
    return rimraf(p);
}

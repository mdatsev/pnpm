"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("@pnpm/constants");
const lockfile_file_1 = require("@pnpm/lockfile-file");
const lockfile_utils_1 = require("@pnpm/lockfile-utils");
const types_1 = require("@pnpm/types");
const dp = require("dependency-path");
const semver = require("semver");
async function outdated(opts) {
    if (packageHasNoDeps(opts.manifest))
        return [];
    const importerId = lockfile_file_1.getLockfileImporterId(opts.lockfileDir, opts.prefix);
    const currentLockfile = opts.currentLockfile || { importers: { [importerId]: {} } };
    const outdated = [];
    await Promise.all(types_1.DEPENDENCIES_FIELDS.map(async (depType) => {
        if (!opts.wantedLockfile.importers[importerId][depType])
            return;
        let pkgs = Object.keys(opts.wantedLockfile.importers[importerId][depType]);
        if (opts.match) {
            pkgs = pkgs.filter((pkgName) => opts.match(pkgName));
        }
        await Promise.all(pkgs.map(async (alias) => {
            var _a;
            const ref = opts.wantedLockfile.importers[importerId][depType][alias];
            // ignoring linked packages. (For backward compatibility)
            if (ref.startsWith('file:')) {
                return;
            }
            const relativeDepPath = dp.refToRelative(ref, alias);
            // ignoring linked packages
            if (relativeDepPath === null)
                return;
            const pkgSnapshot = (_a = opts.wantedLockfile.packages) === null || _a === void 0 ? void 0 : _a[relativeDepPath];
            if (!pkgSnapshot) {
                throw new Error(`Invalid ${constants_1.WANTED_LOCKFILE} file. ${relativeDepPath} not found in packages field`);
            }
            const currentRef = currentLockfile.importers[importerId] &&
                currentLockfile.importers[importerId][depType] &&
                currentLockfile.importers[importerId][depType][alias];
            const currentRelative = currentRef && dp.refToRelative(currentRef, alias);
            const current = currentRelative && dp.parse(currentRelative).version || currentRef;
            const wanted = dp.parse(relativeDepPath).version || ref;
            const packageName = lockfile_utils_1.nameVerFromPkgSnapshot(relativeDepPath, pkgSnapshot).name;
            // It might be not the best solution to check for pkgSnapshot.name
            // TODO: add some other field to distinct packages not from the registry
            if (pkgSnapshot.resolution && (pkgSnapshot.resolution['type'] || pkgSnapshot.name)) { // tslint:disable-line:no-string-literal
                if (current !== wanted) {
                    outdated.push({
                        alias,
                        belongsTo: depType,
                        current,
                        latestManifest: undefined,
                        packageName,
                        wanted,
                    });
                }
                return;
            }
            const latestManifest = await opts.getLatestManifest(dp.parse(relativeDepPath).name || packageName);
            if (!latestManifest)
                return;
            if (!current) {
                outdated.push({
                    alias,
                    belongsTo: depType,
                    latestManifest,
                    packageName,
                    wanted,
                });
                return;
            }
            if (current !== wanted || semver.lt(current, latestManifest.version) || latestManifest.deprecated) {
                outdated.push({
                    alias,
                    belongsTo: depType,
                    current,
                    latestManifest,
                    packageName,
                    wanted,
                });
            }
        }));
    }));
    return outdated.sort((pkg1, pkg2) => pkg1.packageName.localeCompare(pkg2.packageName));
}
exports.default = outdated;
function packageHasNoDeps(manifest) {
    return (!manifest.dependencies || isEmpty(manifest.dependencies))
        && (!manifest.devDependencies || isEmpty(manifest.devDependencies))
        && (!manifest.optionalDependencies || isEmpty(manifest.optionalDependencies));
}
function isEmpty(obj) {
    return Object.keys(obj).length === 0;
}

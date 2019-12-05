"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lockfile_file_1 = require("@pnpm/lockfile-file");
const lockfile_utils_1 = require("@pnpm/lockfile-utils");
const modules_yaml_1 = require("@pnpm/modules-yaml");
const read_modules_dir_1 = require("@pnpm/read-modules-dir");
const types_1 = require("@pnpm/types");
const utils_1 = require("@pnpm/utils");
const dependency_path_1 = require("dependency-path");
const normalizePath = require("normalize-path");
const path = require("path");
const resolveLinkTarget = require("resolve-link-target");
async function dependenciesHierarchy(projectPaths, maybeOpts) {
    var _a;
    if (!maybeOpts || !maybeOpts.lockfileDir) {
        throw new TypeError('opts.lockfileDir is required');
    }
    const modulesDir = await utils_1.realNodeModulesDir(maybeOpts.lockfileDir);
    const modules = await modules_yaml_1.read(modulesDir);
    const registries = utils_1.normalizeRegistries({
        ...maybeOpts && maybeOpts.registries,
        ...modules && modules.registries,
    });
    const currentLockfile = ((_a = modules) === null || _a === void 0 ? void 0 : _a.virtualStoreDir) && await lockfile_file_1.readCurrentLockfile(modules.virtualStoreDir, { ignoreIncompatible: false }) || null;
    const result = {};
    if (!currentLockfile) {
        for (let projectPath of projectPaths) {
            result[projectPath] = {};
        }
        return result;
    }
    const opts = {
        depth: maybeOpts.depth || 0,
        include: maybeOpts.include || {
            dependencies: true,
            devDependencies: true,
            optionalDependencies: true,
        },
        lockfileDir: maybeOpts.lockfileDir,
        registries,
        search: maybeOpts.search,
        skipped: new Set(modules && modules.skipped || []),
    };
    (await Promise.all(projectPaths.map(async (projectPath) => {
        return [
            projectPath,
            await dependenciesHierarchyForPackage(projectPath, currentLockfile, opts),
        ];
    }))).forEach(([projectPath, dependenciesHierarchy]) => {
        result[projectPath] = dependenciesHierarchy;
    });
    return result;
}
exports.default = dependenciesHierarchy;
async function dependenciesHierarchyForPackage(projectPath, currentLockfile, opts) {
    const importerId = lockfile_file_1.getLockfileImporterId(opts.lockfileDir, projectPath);
    if (!currentLockfile.importers[importerId])
        return {};
    const modulesDir = path.join(projectPath, 'node_modules');
    const savedDeps = getAllDirectDependencies(currentLockfile.importers[importerId]);
    const allDirectDeps = await read_modules_dir_1.default(modulesDir) || [];
    const unsavedDeps = allDirectDeps.filter((directDep) => !savedDeps[directDep]);
    const wantedLockfile = await lockfile_file_1.readWantedLockfile(opts.lockfileDir, { ignoreIncompatible: false }) || { packages: {} };
    const getChildrenTree = getTree.bind(null, {
        currentDepth: 1,
        currentPackages: currentLockfile.packages || {},
        includeOptionalDependencies: opts.include.optionalDependencies === true,
        maxDepth: opts.depth,
        modulesDir,
        registries: opts.registries,
        search: opts.search,
        skipped: opts.skipped,
        wantedPackages: wantedLockfile.packages || {},
    });
    const result = {};
    for (const dependenciesField of types_1.DEPENDENCIES_FIELDS.sort().filter(dependenciedField => opts.include[dependenciedField])) {
        const topDeps = currentLockfile.importers[importerId][dependenciesField] || {};
        result[dependenciesField] = [];
        Object.keys(topDeps).forEach((alias) => {
            const { packageInfo, packageAbsolutePath } = getPkgInfo({
                alias,
                currentPackages: currentLockfile.packages || {},
                modulesDir,
                ref: topDeps[alias],
                registries: opts.registries,
                skipped: opts.skipped,
                wantedPackages: wantedLockfile.packages || {},
            });
            let newEntry = null;
            const matchedSearched = opts.search && opts.search(packageInfo);
            if (packageAbsolutePath === null) {
                if (opts.search && !matchedSearched)
                    return;
                newEntry = packageInfo;
            }
            else {
                const relativeId = dependency_path_1.refToRelative(topDeps[alias], alias);
                if (relativeId) {
                    const dependencies = getChildrenTree([relativeId], relativeId);
                    if (dependencies.length) {
                        newEntry = {
                            ...packageInfo,
                            dependencies,
                        };
                    }
                    else if (!opts.search || matchedSearched) {
                        newEntry = packageInfo;
                    }
                }
            }
            if (newEntry) {
                if (matchedSearched) {
                    newEntry.searched = true;
                }
                result[dependenciesField].push(newEntry);
            }
        });
    }
    await Promise.all(unsavedDeps.map(async (unsavedDep) => {
        let pkgPath = path.join(modulesDir, unsavedDep);
        let version;
        try {
            pkgPath = await resolveLinkTarget(pkgPath);
            version = `link:${normalizePath(path.relative(projectPath, pkgPath))}`;
        }
        catch (err) {
            // if error happened. The package is not a link
            const pkg = await utils_1.safeReadPackageFromDir(pkgPath);
            version = pkg && pkg.version || 'undefined';
        }
        const pkg = {
            alias: unsavedDep,
            isMissing: false,
            isPeer: false,
            isSkipped: false,
            name: unsavedDep,
            path: pkgPath,
            version,
        };
        const matchedSearched = opts.search && opts.search(pkg);
        if (opts.search && !matchedSearched)
            return;
        const newEntry = pkg;
        if (matchedSearched) {
            newEntry.searched = true;
        }
        result.unsavedDependencies = result.unsavedDependencies || [];
        result.unsavedDependencies.push(newEntry);
    }));
    return result;
}
function getAllDirectDependencies(lockfileImporter) {
    return {
        ...lockfileImporter.dependencies,
        ...lockfileImporter.devDependencies,
        ...lockfileImporter.optionalDependencies,
    };
}
function getTree(opts, keypath, parentId) {
    if (opts.currentDepth > opts.maxDepth || !opts.currentPackages || !opts.currentPackages[parentId])
        return [];
    const deps = opts.includeOptionalDependencies === false
        ? opts.currentPackages[parentId].dependencies
        : {
            ...opts.currentPackages[parentId].dependencies,
            ...opts.currentPackages[parentId].optionalDependencies,
        };
    if (!deps)
        return [];
    const getChildrenTree = getTree.bind(null, {
        ...opts,
        currentDepth: opts.currentDepth + 1,
    });
    const peers = new Set(Object.keys(opts.currentPackages[parentId].peerDependencies || {}));
    const result = [];
    Object.keys(deps).forEach((alias) => {
        const { packageInfo, packageAbsolutePath } = getPkgInfo({
            alias,
            currentPackages: opts.currentPackages,
            modulesDir: opts.modulesDir,
            peers,
            ref: deps[alias],
            registries: opts.registries,
            skipped: opts.skipped,
            wantedPackages: opts.wantedPackages,
        });
        let circular;
        const matchedSearched = opts.search && opts.search(packageInfo);
        let newEntry = null;
        if (packageAbsolutePath === null) {
            circular = false;
            newEntry = packageInfo;
        }
        else {
            const relativeId = dependency_path_1.refToRelative(deps[alias], alias); // we know for sure that relative is not null if pkgPath is not null
            circular = keypath.includes(relativeId);
            const dependencies = circular ? [] : getChildrenTree(keypath.concat([relativeId]), relativeId);
            if (dependencies.length) {
                newEntry = {
                    ...packageInfo,
                    dependencies,
                };
            }
            else if (!opts.search || matchedSearched) {
                newEntry = packageInfo;
            }
        }
        if (newEntry) {
            if (circular) {
                newEntry.circular = true;
            }
            if (matchedSearched) {
                newEntry.searched = true;
            }
            result.push(newEntry);
        }
    });
    return result;
}
function getPkgInfo(opts) {
    let name;
    let version;
    let resolved = undefined;
    let dev = undefined;
    let optional = undefined;
    let isSkipped = false;
    let isMissing = false;
    const relDepPath = dependency_path_1.refToRelative(opts.ref, opts.alias);
    if (relDepPath) {
        let pkgSnapshot;
        if (opts.currentPackages[relDepPath]) {
            pkgSnapshot = opts.currentPackages[relDepPath];
            const parsed = lockfile_utils_1.nameVerFromPkgSnapshot(relDepPath, pkgSnapshot);
            name = parsed.name;
            version = parsed.version;
        }
        else {
            pkgSnapshot = opts.wantedPackages[relDepPath];
            const parsed = lockfile_utils_1.nameVerFromPkgSnapshot(relDepPath, pkgSnapshot);
            name = parsed.name;
            version = parsed.version;
            isMissing = true;
            isSkipped = opts.skipped.has(relDepPath);
        }
        resolved = lockfile_utils_1.pkgSnapshotToResolution(relDepPath, pkgSnapshot, opts.registries)['tarball'];
        dev = pkgSnapshot.dev;
        optional = pkgSnapshot.optional;
    }
    else {
        name = opts.alias;
        version = opts.ref;
    }
    const packageAbsolutePath = dependency_path_1.refToAbsolute(opts.ref, opts.alias, opts.registries);
    const packageInfo = {
        alias: opts.alias,
        isMissing,
        isPeer: Boolean(opts.peers && opts.peers.has(opts.alias)),
        isSkipped,
        name,
        path: packageAbsolutePath && path.join(opts.modulesDir, '.pnpm', packageAbsolutePath) || path.join(opts.modulesDir, '..', opts.ref.substr(5)),
        version,
    };
    if (resolved) {
        packageInfo['resolved'] = resolved;
    }
    if (optional === true) {
        packageInfo['optional'] = true;
    }
    if (typeof dev === 'boolean') {
        packageInfo['dev'] = dev;
    }
    return {
        packageAbsolutePath,
        packageInfo,
    };
}

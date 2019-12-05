"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_loggers_1 = require("@pnpm/core-loggers");
const link_bins_1 = require("@pnpm/link-bins");
const lockfile_file_1 = require("@pnpm/lockfile-file");
const logger_1 = require("@pnpm/logger");
const modules_cleaner_1 = require("@pnpm/modules-cleaner");
const prune_lockfile_1 = require("@pnpm/prune-lockfile");
const read_importer_manifest_1 = require("@pnpm/read-importer-manifest");
const symlink_dependency_1 = require("@pnpm/symlink-dependency");
const types_1 = require("@pnpm/types");
const normalize = require("normalize-path");
const path = require("path");
const pathAbsolute = require("path-absolute");
const R = require("ramda");
const getContext_1 = require("../getContext");
const getSpecFromPackageManifest_1 = require("../getSpecFromPackageManifest");
const save_1 = require("../save");
const getPref_1 = require("../utils/getPref");
const options_1 = require("./options");
async function link(linkFromPkgs, destModules, maybeOpts) {
    var _a, _b, _c, _d;
    const reporter = (_a = maybeOpts) === null || _a === void 0 ? void 0 : _a.reporter;
    if (reporter) {
        logger_1.streamParser.on('data', reporter);
    }
    const opts = await options_1.extendOptions(maybeOpts);
    const ctx = await getContext_1.getContextForSingleImporter(opts.manifest, {
        ...opts,
        extraBinPaths: [],
    });
    const importerId = lockfile_file_1.getLockfileImporterId(ctx.lockfileDir, opts.dir);
    const currentLockfile = R.clone(ctx.currentLockfile);
    const linkedPkgs = [];
    const specsToUpsert = [];
    for (const linkFrom of linkFromPkgs) {
        let linkFromPath;
        let linkFromAlias;
        if (typeof linkFrom === 'string') {
            linkFromPath = linkFrom;
        }
        else {
            linkFromPath = linkFrom.path;
            linkFromAlias = linkFrom.alias;
        }
        const { manifest } = await read_importer_manifest_1.default(linkFromPath);
        specsToUpsert.push({
            alias: manifest.name,
            pref: getPref_1.default(manifest.name, manifest.name, manifest.version, {
                pinnedVersion: opts.pinnedVersion,
            }),
            saveType: (opts.targetDependenciesField || ctx.manifest && save_1.guessDependencyType(manifest.name, ctx.manifest)),
        });
        const packagePath = normalize(path.relative(opts.dir, linkFromPath));
        const addLinkOpts = {
            linkedPkgName: linkFromAlias || manifest.name,
            manifest: ctx.manifest,
            packagePath,
        };
        addLinkToLockfile(ctx.currentLockfile.importers[importerId], addLinkOpts);
        addLinkToLockfile(ctx.wantedLockfile.importers[importerId], addLinkOpts);
        linkedPkgs.push({
            alias: linkFromAlias || manifest.name,
            manifest,
            path: linkFromPath,
        });
    }
    const updatedCurrentLockfile = prune_lockfile_1.pruneSharedLockfile(ctx.currentLockfile);
    const warn = (message) => logger_1.default.warn({ message, prefix: opts.dir });
    const updatedWantedLockfile = prune_lockfile_1.pruneSharedLockfile(ctx.wantedLockfile, { warn });
    await modules_cleaner_1.prune([
        {
            binsDir: opts.binsDir,
            id: importerId,
            modulesDir: ctx.modulesDir,
            rootDir: opts.dir,
        },
    ], {
        currentLockfile,
        hoistedAliases: ctx.hoistedAliases,
        hoistedModulesDir: opts.hoistPattern && ctx.hoistedModulesDir || undefined,
        include: ctx.include,
        lockfileDir: opts.lockfileDir,
        registries: ctx.registries,
        skipped: ctx.skipped,
        storeController: opts.storeController,
        virtualStoreDir: ctx.virtualStoreDir,
        wantedLockfile: updatedCurrentLockfile,
    });
    // Linking should happen after removing orphans
    // Otherwise would've been removed
    for (const { alias, manifest, path } of linkedPkgs) {
        // TODO: cover with test that linking reports with correct dependency types
        const stu = specsToUpsert.find((s) => s.alias === manifest.name);
        await symlink_dependency_1.symlinkDirectRootDependency(path, destModules, alias, {
            fromDependenciesField: (_c = (_b = stu) === null || _b === void 0 ? void 0 : _b.saveType, (_c !== null && _c !== void 0 ? _c : opts.targetDependenciesField)),
            linkedPackage: manifest,
            prefix: opts.dir,
        });
    }
    const linkToBin = ((_d = maybeOpts) === null || _d === void 0 ? void 0 : _d.linkToBin) || path.join(destModules, '.bin');
    await link_bins_1.linkBinsOfPackages(linkedPkgs.map((p) => ({ manifest: p.manifest, location: p.path })), linkToBin, {
        warn: (message) => logger_1.default.warn({ message, prefix: opts.dir }),
    });
    let newPkg;
    if (opts.targetDependenciesField) {
        newPkg = await save_1.default(opts.dir, opts.manifest, specsToUpsert);
        for (const { alias } of specsToUpsert) {
            updatedWantedLockfile.importers[importerId].specifiers[alias] = getSpecFromPackageManifest_1.default(newPkg, alias);
        }
    }
    else {
        newPkg = opts.manifest;
    }
    const lockfileOpts = { forceSharedFormat: opts.forceSharedLockfile };
    if (opts.useLockfile) {
        await lockfile_file_1.writeLockfiles({
            currentLockfile: updatedCurrentLockfile,
            currentLockfileDir: ctx.virtualStoreDir,
            wantedLockfile: updatedWantedLockfile,
            wantedLockfileDir: ctx.lockfileDir,
            ...lockfileOpts,
        });
    }
    else {
        await lockfile_file_1.writeCurrentLockfile(ctx.virtualStoreDir, updatedCurrentLockfile, lockfileOpts);
    }
    core_loggers_1.summaryLogger.debug({ prefix: opts.dir });
    if (reporter) {
        logger_1.streamParser.removeListener('data', reporter);
    }
    return newPkg;
}
exports.default = link;
function addLinkToLockfile(lockfileImporter, opts) {
    var _a, _b;
    const id = `link:${opts.packagePath}`;
    let addedTo;
    for (const depType of types_1.DEPENDENCIES_FIELDS) {
        if (!addedTo && ((_b = (_a = opts.manifest) === null || _a === void 0 ? void 0 : _a[depType]) === null || _b === void 0 ? void 0 : _b[opts.linkedPkgName])) {
            addedTo = depType;
            lockfileImporter[depType] = lockfileImporter[depType] || {};
            lockfileImporter[depType][opts.linkedPkgName] = id;
        }
        else if (lockfileImporter[depType]) {
            delete lockfileImporter[depType][opts.linkedPkgName];
        }
    }
    // package.json might not be available when linking to global
    if (!opts.manifest)
        return;
    const availableSpec = getSpecFromPackageManifest_1.default(opts.manifest, opts.linkedPkgName);
    if (availableSpec) {
        lockfileImporter.specifiers[opts.linkedPkgName] = availableSpec;
    }
    else {
        delete lockfileImporter.specifiers[opts.linkedPkgName];
    }
}
async function linkFromGlobal(pkgNames, linkTo, maybeOpts) {
    var _a;
    const reporter = (_a = maybeOpts) === null || _a === void 0 ? void 0 : _a.reporter;
    if (reporter) {
        logger_1.streamParser.on('data', reporter);
    }
    const opts = await options_1.extendOptions(maybeOpts);
    const globalPkgPath = pathAbsolute(maybeOpts.globalDir);
    const linkFromPkgs = pkgNames.map((pkgName) => path.join(globalPkgPath, 'node_modules', pkgName));
    const newManifest = await link(linkFromPkgs, path.join(linkTo, 'node_modules'), opts);
    if (reporter) {
        logger_1.streamParser.removeListener('data', reporter);
    }
    return newManifest;
}
exports.linkFromGlobal = linkFromGlobal;
async function linkToGlobal(linkFrom, maybeOpts) {
    var _a;
    const reporter = (_a = maybeOpts) === null || _a === void 0 ? void 0 : _a.reporter;
    if (reporter) {
        logger_1.streamParser.on('data', reporter);
    }
    maybeOpts.lockfileDir = maybeOpts.lockfileDir || maybeOpts.globalDir;
    const opts = await options_1.extendOptions(maybeOpts);
    const globalPkgPath = pathAbsolute(maybeOpts.globalDir);
    const newManifest = await link([linkFrom], path.join(globalPkgPath, 'node_modules'), {
        ...opts,
        dir: maybeOpts.globalDir,
        linkToBin: maybeOpts.globalBin,
    });
    if (reporter) {
        logger_1.streamParser.removeListener('data', reporter);
    }
    return newManifest;
}
exports.linkToGlobal = linkToGlobal;

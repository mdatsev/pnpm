"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_loggers_1 = require("@pnpm/core-loggers");
const error_1 = require("@pnpm/error");
const logger_1 = require("@pnpm/logger");
const read_importers_context_1 = require("@pnpm/read-importers-context");
const types_1 = require("@pnpm/types");
const rimraf = require("@zkochan/rimraf");
const makeDir = require("make-dir");
const path = require("path");
const pathAbsolute = require("path-absolute");
const R = require("ramda");
const checkCompatibility_1 = require("./checkCompatibility");
const readLockfiles_1 = require("./readLockfiles");
async function getContext(importers, opts) {
    var _a, _b;
    const importersContext = await read_importers_context_1.default(importers, opts.lockfileDir);
    const virtualStoreDir = pathAbsolute((_a = opts.virtualStoreDir, (_a !== null && _a !== void 0 ? _a : 'node_modules/.pnpm')), opts.lockfileDir);
    if (importersContext.modules) {
        await validateNodeModules(importersContext.modules, importersContext.importers, {
            currentHoistPattern: importersContext.currentHoistPattern,
            force: opts.force,
            include: opts.include,
            lockfileDir: opts.lockfileDir,
            storeDir: opts.storeDir,
            virtualStoreDir,
            forceIndependentLeaves: opts.forceIndependentLeaves,
            independentLeaves: opts.independentLeaves,
            forceHoistPattern: opts.forceHoistPattern,
            hoistPattern: opts.hoistPattern,
            forceShamefullyHoist: opts.forceShamefullyHoist,
            shamefullyHoist: opts.shamefullyHoist,
        });
    }
    await makeDir(opts.storeDir);
    importers.forEach((importer) => {
        core_loggers_1.packageManifestLogger.debug({
            initial: importer.manifest,
            prefix: importer.rootDir,
        });
    });
    if ((_b = opts.hooks) === null || _b === void 0 ? void 0 : _b.readPackage) {
        importers = importers.map((importer) => ({
            ...importer,
            manifest: opts.hooks.readPackage(importer.manifest),
        }));
    }
    const extraBinPaths = [
        ...opts.extraBinPaths || []
    ];
    const shamefullyHoist = Boolean(typeof importersContext.shamefullyHoist === 'undefined' ? opts.shamefullyHoist : importersContext.shamefullyHoist);
    if (opts.hoistPattern && !shamefullyHoist) {
        extraBinPaths.unshift(path.join(virtualStoreDir, 'node_modules/.bin'));
    }
    const hoistedModulesDir = shamefullyHoist
        ? importersContext.rootModulesDir : path.join(virtualStoreDir, 'node_modules');
    const ctx = {
        extraBinPaths,
        hoistedAliases: importersContext.hoistedAliases,
        hoistedModulesDir,
        hoistPattern: typeof importersContext.hoist === 'boolean' ?
            importersContext.currentHoistPattern : opts.hoistPattern,
        importers: importersContext.importers,
        include: opts.include || importersContext.include,
        independentLeaves: Boolean(typeof importersContext.independentLeaves === 'undefined' ? opts.independentLeaves : importersContext.independentLeaves),
        lockfileDir: opts.lockfileDir,
        modulesFile: importersContext.modules,
        pendingBuilds: importersContext.pendingBuilds,
        registries: {
            ...opts.registries,
            ...importersContext.registries,
        },
        rootModulesDir: importersContext.rootModulesDir,
        shamefullyHoist,
        skipped: importersContext.skipped,
        storeDir: opts.storeDir,
        virtualStoreDir,
        ...await readLockfiles_1.default({
            force: opts.force,
            forceSharedLockfile: opts.forceSharedLockfile,
            importers: importersContext.importers,
            lockfileDir: opts.lockfileDir,
            registry: opts.registries.default,
            useLockfile: opts.useLockfile,
            virtualStoreDir,
        }),
    };
    return ctx;
}
exports.default = getContext;
async function validateNodeModules(modules, importers, opts) {
    const rootImporter = importers.find(({ id }) => id === '.');
    if (opts.forceShamefullyHoist && modules.shamefullyHoist !== opts.shamefullyHoist) {
        if (opts.force && rootImporter) {
            await purgeModulesDirsOfImporter(rootImporter);
            return;
        }
        if (modules.shamefullyHoist) {
            throw new error_1.default('SHAMEFULLY_HOIST_WANTED', 'This "node_modules" folder was created using the --shamefully-hoist option.'
                + ' You must add that option, or else run "pnpm install --force" to recreate the "node_modules" folder.');
        }
        throw new error_1.default('SHAMEFULLY_HOIST_NOT_WANTED', 'This "node_modules" folder was created without the --shamefully-hoist option.'
            + ' You must remove that option, or else "pnpm install --force" to recreate the "node_modules" folder.');
    }
    if (opts.forceIndependentLeaves && Boolean(modules.independentLeaves) !== opts.independentLeaves) {
        if (opts.force) {
            // TODO: remove the node_modules in the lockfile directory
            await Promise.all(importers.map(purgeModulesDirsOfImporter));
            return;
        }
        if (modules.independentLeaves) {
            throw new error_1.default('INDEPENDENT_LEAVES_WANTED', 'This "node_modules" folder was created using the --independent-leaves option.'
                + ' You must add that option, or else run "pnpm install --force" to recreate the "node_modules" folder.');
        }
        throw new error_1.default('INDEPENDENT_LEAVES_NOT_WANTED', 'This "node_modules" folder was created without the --independent-leaves option.'
            + ' You must remove that option, or else "pnpm install --force" to recreate the "node_modules" folder.');
    }
    if (opts.forceHoistPattern && rootImporter) {
        try {
            if (!R.equals(opts.currentHoistPattern, (opts.hoistPattern || undefined))) {
                if (opts.currentHoistPattern) {
                    throw new error_1.default('HOISTING_WANTED', 'This "node_modules" folder was created using the --hoist-pattern option.'
                        + ' You must add this option, or else add the --force option to recreate the "node_modules" folder.');
                }
                throw new error_1.default('HOISTING_NOT_WANTED', 'This "node_modules" folder was created without the --hoist-pattern option.'
                    + ' You must remove that option, or else add the --force option to recreate the "node_modules" folder.');
            }
        }
        catch (err) {
            if (!opts.force)
                throw err;
            await purgeModulesDirsOfImporter(rootImporter);
        }
    }
    await Promise.all(importers.map(async (importer) => {
        try {
            checkCompatibility_1.default(modules, {
                modulesDir: importer.modulesDir,
                storeDir: opts.storeDir,
                virtualStoreDir: opts.virtualStoreDir,
            });
            if (opts.lockfileDir !== importer.rootDir && opts.include && modules.included) {
                for (const depsField of types_1.DEPENDENCIES_FIELDS) {
                    if (opts.include[depsField] !== modules.included[depsField]) {
                        throw new error_1.default('INCLUDED_DEPS_CONFLICT', `node_modules (at "${opts.lockfileDir}") was installed with ${stringifyIncludedDeps(modules.included)}. ` +
                            `Current install wants ${stringifyIncludedDeps(opts.include)}.`);
                    }
                }
            }
        }
        catch (err) {
            if (!opts.force)
                throw err;
            await purgeModulesDirsOfImporter(importer);
        }
    }));
}
async function purgeModulesDirsOfImporter(importer) {
    logger_1.default.info({
        message: `Recreating ${importer.modulesDir}`,
        prefix: importer.rootDir,
    });
    try {
        await rimraf(importer.modulesDir);
    }
    catch (err) {
        if (err.code !== 'ENOENT')
            throw err;
    }
}
function stringifyIncludedDeps(included) {
    return types_1.DEPENDENCIES_FIELDS.filter((depsField) => included[depsField]).join(', ');
}
async function getContextForSingleImporter(manifest, opts) {
    var _a, _b, _c, _d, _e;
    const { currentHoistPattern, hoist, hoistedAliases, importers, include, independentLeaves, modules, pendingBuilds, registries, shamefullyHoist, skipped, rootModulesDir, } = await read_importers_context_1.default([
        {
            rootDir: opts.dir,
        },
    ], opts.lockfileDir);
    const storeDir = opts.storeDir;
    const importer = importers[0];
    const modulesDir = importer.modulesDir;
    const importerId = importer.id;
    const virtualStoreDir = pathAbsolute((_a = opts.virtualStoreDir, (_a !== null && _a !== void 0 ? _a : 'node_modules/.pnpm')), opts.lockfileDir);
    if (modules) {
        await validateNodeModules(modules, importers, {
            currentHoistPattern,
            force: opts.force,
            include: opts.include,
            lockfileDir: opts.lockfileDir,
            storeDir: opts.storeDir,
            virtualStoreDir,
            forceHoistPattern: opts.forceHoistPattern,
            hoistPattern: opts.hoistPattern,
            forceIndependentLeaves: opts.forceIndependentLeaves,
            independentLeaves: opts.independentLeaves,
            forceShamefullyHoist: opts.forceShamefullyHoist,
            shamefullyHoist: opts.shamefullyHoist,
        });
    }
    await makeDir(storeDir);
    const extraBinPaths = [
        ...opts.extraBinPaths || []
    ];
    const sHoist = Boolean(typeof shamefullyHoist === 'undefined' ? opts.shamefullyHoist : shamefullyHoist);
    if (opts.hoistPattern && !sHoist) {
        extraBinPaths.unshift(path.join(virtualStoreDir, 'node_modules/.bin'));
    }
    const hoistedModulesDir = sHoist
        ? rootModulesDir : path.join(virtualStoreDir, 'node_modules');
    const ctx = {
        extraBinPaths,
        hoistedAliases,
        hoistedModulesDir,
        hoistPattern: typeof hoist === 'boolean' ? currentHoistPattern : opts.hoistPattern,
        importerId,
        include: opts.include || include,
        independentLeaves: Boolean(typeof independentLeaves === 'undefined' ? opts.independentLeaves : independentLeaves),
        lockfileDir: opts.lockfileDir,
        manifest: (_e = (_d = (_b = opts.hooks) === null || _b === void 0 ? void 0 : (_c = _b).readPackage) === null || _d === void 0 ? void 0 : _d.call(_c, manifest), (_e !== null && _e !== void 0 ? _e : manifest)),
        modulesDir,
        modulesFile: modules,
        pendingBuilds,
        prefix: opts.dir,
        registries: {
            ...opts.registries,
            ...registries,
        },
        rootModulesDir,
        shamefullyHoist: sHoist,
        skipped,
        storeDir,
        virtualStoreDir,
        ...await readLockfiles_1.default({
            force: opts.force,
            forceSharedLockfile: opts.forceSharedLockfile,
            importers: [{ id: importerId, rootDir: opts.dir }],
            lockfileDir: opts.lockfileDir,
            registry: opts.registries.default,
            useLockfile: opts.useLockfile,
            virtualStoreDir,
        }),
    };
    core_loggers_1.packageManifestLogger.debug({
        initial: manifest,
        prefix: opts.dir,
    });
    return ctx;
}
exports.getContextForSingleImporter = getContextForSingleImporter;

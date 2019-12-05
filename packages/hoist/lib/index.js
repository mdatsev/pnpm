"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("@pnpm/constants");
const link_bins_1 = require("@pnpm/link-bins");
const lockfile_utils_1 = require("@pnpm/lockfile-utils");
const lockfile_walker_1 = require("@pnpm/lockfile-walker");
const logger_1 = require("@pnpm/logger");
const pkgid_to_filename_1 = require("@pnpm/pkgid-to-filename");
const symlink_dependency_1 = require("@pnpm/symlink-dependency");
const dp = require("dependency-path");
const path = require("path");
const R = require("ramda");
async function hoistByLockfile(match, opts) {
    if (!opts.lockfile.packages)
        return {};
    const deps = await getDependencies(lockfile_walker_1.default(opts.lockfile, Object.keys(opts.lockfile.importers)), 0, {
        getIndependentPackageLocation: opts.getIndependentPackageLocation,
        lockfileDir: opts.lockfileDir,
        registries: opts.registries,
        virtualStoreDir: opts.virtualStoreDir,
    });
    const aliasesByDependencyPath = await hoistGraph(deps, opts.lockfile.importers['.'].specifiers, {
        dryRun: false,
        match,
        modulesDir: opts.modulesDir,
    });
    const bin = path.join(opts.modulesDir, '.bin');
    const warn = (message) => logger_1.default.warn({ message, prefix: path.join(opts.modulesDir, '../..') });
    try {
        await link_bins_1.default(opts.modulesDir, bin, { allowExoticManifests: true, warn });
    }
    catch (err) {
        // Some packages generate their commands with lifecycle hooks.
        // At this stage, such commands are not generated yet.
        // For now, we don't hoist such generated commands.
        // Related issue: https://github.com/pnpm/pnpm/issues/2071
    }
    return aliasesByDependencyPath;
}
exports.default = hoistByLockfile;
async function getDependencies(step, depth, opts) {
    const deps = [];
    const nextSteps = [];
    for (const { pkgSnapshot, relDepPath, next } of step.dependencies) {
        const absolutePath = dp.resolve(opts.registries, relDepPath);
        const pkgName = lockfile_utils_1.nameVerFromPkgSnapshot(relDepPath, pkgSnapshot).name;
        const modules = path.join(opts.virtualStoreDir, pkgid_to_filename_1.default(absolutePath, opts.lockfileDir), 'node_modules');
        const independent = opts.getIndependentPackageLocation && lockfile_utils_1.packageIsIndependent(pkgSnapshot);
        const allDeps = {
            ...pkgSnapshot.dependencies,
            ...pkgSnapshot.optionalDependencies,
        };
        deps.push({
            absolutePath,
            children: Object.keys(allDeps).reduce((children, alias) => {
                children[alias] = dp.refToAbsolute(allDeps[alias], alias, opts.registries);
                return children;
            }, {}),
            depth,
            location: !independent
                ? path.join(modules, pkgName)
                : await opts.getIndependentPackageLocation(pkgSnapshot.id || absolutePath, pkgName),
            name: pkgName,
        });
        nextSteps.push(next());
    }
    for (const relDepPath of step.missing) {
        // It might make sense to fail if the depPath is not in the skipped list from .modules.yaml
        // However, the skipped list currently contains package IDs, not dep paths.
        logger_1.default.debug({ message: `No entry for "${relDepPath}" in ${constants_1.WANTED_LOCKFILE}` });
    }
    return (await Promise.all(nextSteps.map((nextStep) => getDependencies(nextStep, depth + 1, opts)))).reduce((acc, deps) => [...acc, ...deps], deps);
}
async function hoistGraph(depNodes, currentSpecifiers, opts) {
    const hoistedAliases = new Set(R.keys(currentSpecifiers));
    const aliasesByDependencyPath = {};
    await Promise.all(depNodes
        // sort by depth and then alphabetically
        .sort((a, b) => {
        const depthDiff = a.depth - b.depth;
        return depthDiff === 0 ? a.name.localeCompare(b.name) : depthDiff;
    })
        // build the alias map and the id map
        .map((depNode) => {
        for (const childAlias of Object.keys(depNode.children)) {
            if (!opts.match(childAlias))
                continue;
            // if this alias has already been taken, skip it
            if (hoistedAliases.has(childAlias)) {
                continue;
            }
            hoistedAliases.add(childAlias);
            const childPath = depNode.children[childAlias];
            if (!aliasesByDependencyPath[childPath]) {
                aliasesByDependencyPath[childPath] = [];
            }
            aliasesByDependencyPath[childPath].push(childAlias);
        }
        return depNode;
    })
        .map(async (depNode) => {
        const pkgAliases = aliasesByDependencyPath[depNode.absolutePath];
        if (!pkgAliases) {
            return;
        }
        // TODO when putting logs back in for hoisted packages, you've to put back the condition inside the map,
        // TODO look how it is done in linkPackages
        if (!opts.dryRun) {
            await Promise.all(pkgAliases.map(async (pkgAlias) => {
                await symlink_dependency_1.default(depNode.location, opts.modulesDir, pkgAlias);
            }));
        }
    }));
    return aliasesByDependencyPath;
}

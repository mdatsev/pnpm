"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("@pnpm/utils");
const R = require("ramda");
const resolveDependencies_1 = require("./resolveDependencies");
async function default_1(importers, opts) {
    const directDepsByImporterId = {};
    const wantedToBeSkippedPackageIds = new Set();
    const ctx = {
        childrenByParentId: {},
        currentLockfile: opts.currentLockfile,
        defaultTag: opts.tag,
        dependenciesTree: {},
        dryRun: opts.dryRun,
        engineStrict: opts.engineStrict,
        force: opts.force,
        lockfileDir: opts.lockfileDir,
        nodeVersion: opts.nodeVersion,
        outdatedDependencies: {},
        pendingNodes: [],
        pnpmVersion: opts.pnpmVersion,
        readPackageHook: opts.hooks.readPackage,
        registries: opts.registries,
        resolvedPackagesByPackageId: {},
        sideEffectsCache: opts.sideEffectsCache,
        skipped: wantedToBeSkippedPackageIds,
        storeController: opts.storeController,
        updateLockfile: opts.updateLockfile,
        virtualStoreDir: opts.virtualStoreDir,
        wantedLockfile: opts.wantedLockfile,
    };
    await Promise.all(importers.map(async (importer) => {
        const lockfileImporter = opts.wantedLockfile.importers[importer.id];
        // This array will only contain the dependencies that should be linked in.
        // The already linked-in dependencies will not be added.
        const linkedDependencies = [];
        const resolveCtx = {
            ...ctx,
            linkedDependencies,
            modulesDir: importer.modulesDir,
            prefix: importer.rootDir,
            resolutionStrategy: opts.resolutionStrategy || 'fast',
        };
        const resolveOpts = {
            currentDepth: 0,
            localPackages: opts.localPackages,
            parentDependsOnPeers: true,
            parentNodeId: `>${importer.id}>`,
            preferredVersions: importer.preferredVersions || {},
            proceed: true,
            resolvedDependencies: {
                ...lockfileImporter.dependencies,
                ...lockfileImporter.devDependencies,
                ...lockfileImporter.optionalDependencies,
            },
            updateDepth: -1,
        };
        directDepsByImporterId[importer.id] = await resolveDependencies_1.default(resolveCtx, importer.wantedDependencies, resolveOpts);
    }));
    ctx.pendingNodes.forEach((pendingNode) => {
        ctx.dependenciesTree[pendingNode.nodeId] = {
            children: () => buildTree(ctx, pendingNode.nodeId, pendingNode.resolvedPackage.id, ctx.childrenByParentId[pendingNode.resolvedPackage.id], pendingNode.depth + 1, pendingNode.installable),
            depth: pendingNode.depth,
            installable: pendingNode.installable,
            resolvedPackage: pendingNode.resolvedPackage,
        };
    });
    const resolvedImporters = {};
    for (const { id, wantedDependencies } of importers) {
        const directDeps = directDepsByImporterId[id];
        const [linkedDependencies, directNonLinkedDeps] = R.partition((dep) => dep.isLinkedDependency === true, directDeps);
        resolvedImporters[id] = {
            directDependencies: directDeps
                .map((dep, index) => {
                const { isNew, raw } = wantedDependencies[index];
                if (dep.isLinkedDependency === true) {
                    return {
                        ...dep,
                        isNew,
                        specRaw: raw,
                    };
                }
                return {
                    ...ctx.dependenciesTree[dep.nodeId].resolvedPackage,
                    alias: dep.alias,
                    isNew,
                    normalizedPref: dep.normalizedPref,
                    specRaw: raw,
                };
            }),
            directNodeIdsByAlias: directNonLinkedDeps
                .reduce((acc, dependency) => {
                acc[dependency.alias] = dependency.nodeId;
                return acc;
            }, {}),
            linkedDependencies,
        };
    }
    return {
        dependenciesTree: ctx.dependenciesTree,
        outdatedDependencies: ctx.outdatedDependencies,
        resolvedImporters,
        resolvedPackagesByPackageId: ctx.resolvedPackagesByPackageId,
        wantedToBeSkippedPackageIds,
    };
}
exports.default = default_1;
function buildTree(ctx, parentNodeId, parentId, children, depth, installable) {
    const childrenNodeIds = {};
    for (const child of children) {
        if (utils_1.nodeIdContainsSequence(parentNodeId, parentId, child.pkgId)) {
            continue;
        }
        const childNodeId = utils_1.createNodeId(parentNodeId, child.pkgId);
        childrenNodeIds[child.alias] = childNodeId;
        installable = installable && !ctx.skipped.has(child.pkgId);
        ctx.dependenciesTree[childNodeId] = {
            children: () => buildTree(ctx, childNodeId, child.pkgId, ctx.childrenByParentId[child.pkgId], depth + 1, installable),
            depth,
            installable,
            resolvedPackage: ctx.resolvedPackagesByPackageId[child.pkgId],
        };
    }
    return childrenNodeIds;
}

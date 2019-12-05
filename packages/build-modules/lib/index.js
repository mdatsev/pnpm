"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("@pnpm/constants");
const core_loggers_1 = require("@pnpm/core-loggers");
const lifecycle_1 = require("@pnpm/lifecycle");
const link_bins_1 = require("@pnpm/link-bins");
const logger_1 = require("@pnpm/logger");
const read_package_json_1 = require("@pnpm/read-package-json");
const graphSequencer = require("graph-sequencer");
const path = require("path");
const R = require("ramda");
const run_groups_1 = require("run-groups");
exports.default = async (depGraph, rootDepPaths, opts) => {
    const warn = (message) => logger_1.default.warn({ message, prefix: opts.lockfileDir });
    // postinstall hooks
    const nodesToBuild = new Set();
    getSubgraphToBuild(depGraph, rootDepPaths, nodesToBuild, new Set());
    const onlyFromBuildGraph = R.filter((depPath) => nodesToBuild.has(depPath));
    const nodesToBuildArray = Array.from(nodesToBuild);
    const graph = new Map(nodesToBuildArray
        .map((depPath) => [depPath, onlyFromBuildGraph(R.values(depGraph[depPath].children))]));
    const graphSequencerResult = graphSequencer({
        graph,
        groups: [nodesToBuildArray],
    });
    const chunks = graphSequencerResult.chunks;
    const buildDepOpts = { ...opts, warn };
    const groups = chunks.map((chunk) => {
        chunk = chunk.filter((depPath) => depGraph[depPath].requiresBuild && !depGraph[depPath].isBuilt);
        if (opts.depsToBuild) {
            chunk = chunk.filter((depPath) => opts.depsToBuild.has(depPath));
        }
        return chunk.map((depPath) => async () => buildDependency(depPath, depGraph, buildDepOpts));
    });
    await run_groups_1.default(opts.childConcurrency || 4, groups);
};
async function buildDependency(depPath, depGraph, opts) {
    const depNode = depGraph[depPath];
    try {
        await linkBinsOfDependencies(depNode, depGraph, opts);
        const hasSideEffects = await lifecycle_1.runPostinstallHooks({
            depPath,
            extraBinPaths: opts.extraBinPaths,
            optional: depNode.optional,
            pkgRoot: depNode.peripheralLocation,
            prepare: depNode.prepare,
            rawConfig: opts.rawConfig,
            rootNodeModulesDir: opts.rootNodeModulesDir,
            unsafePerm: opts.unsafePerm || false,
        });
        if (hasSideEffects && opts.sideEffectsCacheWrite) {
            try {
                await opts.storeController.upload(depNode.peripheralLocation, {
                    engine: constants_1.ENGINE_NAME,
                    packageId: depNode.packageId,
                });
            }
            catch (err) {
                if (err.statusCode === 403) {
                    logger_1.default.warn({
                        message: `The store server disabled upload requests, could not upload ${depNode.packageId}`,
                        prefix: opts.lockfileDir,
                    });
                }
                else {
                    logger_1.default.warn({
                        error: err,
                        message: `An error occurred while uploading ${depNode.packageId}`,
                        prefix: opts.lockfileDir,
                    });
                }
            }
        }
    }
    catch (err) {
        if (depNode.optional) {
            // TODO: add parents field to the log
            const pkg = await read_package_json_1.fromDir(path.join(depNode.peripheralLocation));
            core_loggers_1.skippedOptionalDependencyLogger.debug({
                details: err.toString(),
                package: {
                    id: depNode.packageId,
                    name: pkg.name,
                    version: pkg.version,
                },
                prefix: opts.lockfileDir,
                reason: 'build_failure',
            });
            return;
        }
        throw err;
    }
}
function getSubgraphToBuild(graph, entryNodes, nodesToBuild, walked) {
    let currentShouldBeBuilt = false;
    for (const depPath of entryNodes) {
        if (!graph[depPath])
            return; // packages that are already in node_modules are skipped
        if (nodesToBuild.has(depPath)) {
            currentShouldBeBuilt = true;
        }
        if (walked.has(depPath))
            continue;
        walked.add(depPath);
        const childShouldBeBuilt = getSubgraphToBuild(graph, R.values(graph[depPath].children), nodesToBuild, walked)
            || graph[depPath].requiresBuild;
        if (childShouldBeBuilt) {
            nodesToBuild.add(depPath);
            currentShouldBeBuilt = true;
        }
    }
    return currentShouldBeBuilt;
}
async function linkBinsOfDependencies(depNode, depGraph, opts) {
    const childrenToLink = opts.optional
        ? depNode.children
        : Object.keys(depNode.children)
            .reduce((nonOptionalChildren, childAlias) => {
            if (!depNode.optionalDependencies.has(childAlias)) {
                nonOptionalChildren[childAlias] = depNode.children[childAlias];
            }
            return nonOptionalChildren;
        }, {});
    const binPath = path.join(depNode.peripheralLocation, 'node_modules', '.bin');
    const pkgs = await Promise.all(Object.keys(childrenToLink)
        .filter((alias) => {
        const dep = depGraph[childrenToLink[alias]];
        if (!dep) {
            // TODO: Try to reproduce this issue with a test in supi
            logger_1.default.debug({ message: `Failed to link bins of "${alias}" to "${binPath}". This is probably not an issue.` });
            return false;
        }
        return dep.hasBin && dep.installable !== false;
    })
        .map(async (alias) => {
        var _a, _b;
        const dep = depGraph[childrenToLink[alias]];
        return {
            location: dep.peripheralLocation,
            manifest: await ((_b = (_a = dep).fetchingBundledManifest) === null || _b === void 0 ? void 0 : _b.call(_a)) || await read_package_json_1.fromDir(dep.peripheralLocation),
        };
    }));
    await link_bins_1.linkBinsOfPackages(pkgs, binPath, { warn: opts.warn });
    // link also the bundled dependencies` bins
    if (depNode.hasBundledDependencies) {
        const bundledModules = path.join(depNode.peripheralLocation, 'node_modules');
        await link_bins_1.default(bundledModules, binPath, { warn: opts.warn });
    }
}
exports.linkBinsOfDependencies = linkBinsOfDependencies;

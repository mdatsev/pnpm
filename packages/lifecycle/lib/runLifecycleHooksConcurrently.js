"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const run_groups_1 = require("run-groups");
const runLifecycleHook_1 = require("./runLifecycleHook");
async function runLifecycleHooksConcurrently(stages, importers, childConcurrency, opts) {
    const importersByBuildIndex = new Map();
    for (const importer of importers) {
        if (!importersByBuildIndex.has(importer.buildIndex)) {
            importersByBuildIndex.set(importer.buildIndex, [importer]);
        }
        else {
            importersByBuildIndex.get(importer.buildIndex).push(importer);
        }
    }
    const sortedBuildIndexes = Array.from(importersByBuildIndex.keys()).sort();
    const groups = sortedBuildIndexes.map((buildIndex) => {
        const importers = importersByBuildIndex.get(buildIndex);
        return importers.map(({ manifest, modulesDir, rootDir }) => async () => {
            const runLifecycleHookOpts = {
                depPath: rootDir,
                extraBinPaths: opts.extraBinPaths,
                pkgRoot: rootDir,
                rawConfig: opts.rawConfig,
                rootNodeModulesDir: modulesDir,
                stdio: opts.stdio,
                unsafePerm: opts.unsafePerm,
            };
            for (const stage of stages) {
                if (!manifest.scripts || !manifest.scripts[stage])
                    continue;
                await runLifecycleHook_1.default(stage, manifest, runLifecycleHookOpts);
            }
        });
    });
    await run_groups_1.default(childConcurrency, groups);
}
exports.default = runLifecycleHooksConcurrently;

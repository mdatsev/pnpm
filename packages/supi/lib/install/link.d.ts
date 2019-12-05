import { Lockfile } from '@pnpm/lockfile-file';
import { IncludedDependencies } from '@pnpm/modules-yaml';
import { DependenciesTree, LinkedDependency } from '@pnpm/resolve-dependencies';
import { StoreController } from '@pnpm/store-controller-types';
import { ImporterManifest, Registries } from '@pnpm/types';
import { DependenciesGraph, DependenciesGraphNode } from './resolvePeers';
export { DependenciesGraph, DependenciesGraphNode, };
export interface Importer {
    binsDir: string;
    directNodeIdsByAlias: {
        [alias: string]: string;
    };
    id: string;
    linkedDependencies: LinkedDependency[];
    manifest: ImporterManifest;
    modulesDir: string;
    pruneDirectDependencies: boolean;
    removePackages?: string[];
    rootDir: string;
    topParents: Array<{
        name: string;
        version: string;
    }>;
}
export default function linkPackages(importers: Importer[], dependenciesTree: DependenciesTree, opts: {
    afterAllResolvedHook?: (lockfile: Lockfile) => Lockfile;
    currentLockfile: Lockfile;
    dryRun: boolean;
    force: boolean;
    hoistedAliases: {
        [depPath: string]: string[];
    };
    hoistedModulesDir: string;
    hoistPattern?: string[];
    include: IncludedDependencies;
    independentLeaves: boolean;
    lockfileDir: string;
    makePartialCurrentLockfile: boolean;
    outdatedDependencies: {
        [pkgId: string]: string;
    };
    pruneStore: boolean;
    registries: Registries;
    sideEffectsCacheRead: boolean;
    skipped: Set<string>;
    storeController: StoreController;
    strictPeerDependencies: boolean;
    updateLockfileMinorVersion: boolean;
    virtualStoreDir: string;
    wantedLockfile: Lockfile;
    wantedToBeSkippedPackageIds: Set<string>;
}): Promise<{
    currentLockfile: Lockfile;
    depGraph: DependenciesGraph;
    newDepPaths: string[];
    newHoistedAliases: {
        [depPath: string]: string[];
    };
    removedDepPaths: Set<string>;
    wantedLockfile: Lockfile;
}>;

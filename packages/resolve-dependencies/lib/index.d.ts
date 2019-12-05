import { Lockfile } from '@pnpm/lockfile-types';
import { LocalPackages, Resolution } from '@pnpm/resolver-base';
import { StoreController } from '@pnpm/store-controller-types';
import { ReadPackageHook, Registries } from '@pnpm/types';
import { WantedDependency } from './getNonDevWantedDependencies';
import { DependenciesTree, LinkedDependency, ResolvedPackagesByPackageId } from './resolveDependencies';
export { LinkedDependency, ResolvedPackage, DependenciesTree, DependenciesTreeNode } from './resolveDependencies';
export declare type ResolvedDirectDependency = {
    alias: string;
    optional: boolean;
    dev: boolean;
    resolution: Resolution;
    id: string;
    isNew: boolean;
    version: string;
    name: string;
    specRaw: string;
    normalizedPref?: string;
};
export interface Importer {
    id: string;
    modulesDir: string;
    preferredVersions?: {
        [packageName: string]: {
            selector: string;
            type: 'version' | 'range' | 'tag';
        };
    };
    rootDir: string;
    wantedDependencies: Array<WantedDependency & {
        isNew?: boolean;
        raw: string;
        updateDepth: number;
    }>;
}
export default function (importers: Importer[], opts: {
    currentLockfile: Lockfile;
    dryRun: boolean;
    engineStrict: boolean;
    force: boolean;
    hooks: {
        readPackage?: ReadPackageHook;
    };
    nodeVersion: string;
    registries: Registries;
    resolutionStrategy?: 'fast' | 'fewer-dependencies';
    pnpmVersion: string;
    sideEffectsCache: boolean;
    lockfileDir: string;
    storeController: StoreController;
    tag: string;
    virtualStoreDir: string;
    wantedLockfile: Lockfile;
    localPackages: LocalPackages;
    updateLockfile: boolean;
}): Promise<{
    dependenciesTree: DependenciesTree;
    outdatedDependencies: {
        [pkgId: string]: string;
    };
    resolvedImporters: {
        [id: string]: {
            directDependencies: ResolvedDirectDependency[];
            directNodeIdsByAlias: {
                [alias: string]: string;
            };
            linkedDependencies: LinkedDependency[];
        };
    };
    resolvedPackagesByPackageId: ResolvedPackagesByPackageId;
    wantedToBeSkippedPackageIds: Set<string>;
}>;

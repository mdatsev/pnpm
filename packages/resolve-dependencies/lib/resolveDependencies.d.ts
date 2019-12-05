import { Lockfile, ResolvedDependencies } from '@pnpm/lockfile-types';
import { DirectoryResolution, LocalPackages, Resolution } from '@pnpm/resolver-base';
import { PackageFilesResponse, StoreController } from '@pnpm/store-controller-types';
import { Dependencies, DependencyManifest, PackageManifest, PeerDependenciesMeta, ReadPackageHook, Registries } from '@pnpm/types';
import { WantedDependency } from './getNonDevWantedDependencies';
export declare function nodeIdToParents(nodeId: string, resolvedPackagesByPackageId: ResolvedPackagesByPackageId): {
    id: string;
    name: string;
    version: string;
}[];
export interface DependenciesTreeNode {
    children: (() => {
        [alias: string]: string;
    }) | {
        [alias: string]: string;
    };
    resolvedPackage: ResolvedPackage;
    depth: number;
    installable: boolean;
}
export interface DependenciesTree {
    [nodeId: string]: DependenciesTreeNode;
}
export interface ResolvedPackagesByPackageId {
    [packageId: string]: ResolvedPackage;
}
export interface LinkedDependency {
    isLinkedDependency: true;
    optional: boolean;
    dev: boolean;
    resolution: DirectoryResolution;
    id: string;
    version: string;
    name: string;
    normalizedPref?: string;
    alias: string;
}
export interface PendingNode {
    alias: string;
    nodeId: string;
    resolvedPackage: ResolvedPackage;
    depth: number;
    installable: boolean;
}
export interface ChildrenByParentId {
    [parentId: string]: Array<{
        alias: string;
        pkgId: string;
    }>;
}
export interface ResolutionContext {
    defaultTag: string;
    dryRun: boolean;
    resolvedPackagesByPackageId: ResolvedPackagesByPackageId;
    outdatedDependencies: {
        [pkgId: string]: string;
    };
    childrenByParentId: ChildrenByParentId;
    pendingNodes: PendingNode[];
    wantedLockfile: Lockfile;
    updateLockfile: boolean;
    currentLockfile: Lockfile;
    lockfileDir: string;
    sideEffectsCache: boolean;
    storeController: StoreController;
    skipped: Set<string>;
    dependenciesTree: DependenciesTree;
    force: boolean;
    prefix: string;
    readPackageHook?: ReadPackageHook;
    engineStrict: boolean;
    modulesDir: string;
    nodeVersion: string;
    pnpmVersion: string;
    registries: Registries;
    virtualStoreDir: string;
    resolutionStrategy: 'fast' | 'fewer-dependencies';
}
declare type PreferredVersions = {
    [packageName: string]: {
        type: 'version' | 'range' | 'tag';
        selector: string;
    };
};
export interface PkgAddress {
    alias: string;
    depIsLinked: boolean;
    isNew: boolean;
    isLinkedDependency?: false;
    nodeId: string;
    pkgId: string;
    normalizedPref?: string;
    installable: boolean;
    pkg: PackageManifest;
    updated: boolean;
    useManifestInfoFromLockfile: boolean;
}
export interface ResolvedPackage {
    id: string;
    resolution: Resolution;
    prod: boolean;
    dev: boolean;
    optional: boolean;
    fetchingFiles: () => Promise<PackageFilesResponse>;
    fetchingBundledManifest?: () => Promise<DependencyManifest>;
    finishing: () => Promise<void>;
    path: string;
    name: string;
    version: string;
    peerDependencies: Dependencies;
    optionalDependencies: Set<string>;
    hasBin: boolean;
    hasBundledDependencies: boolean;
    independent: boolean;
    prepare: boolean;
    requiresBuild: boolean | undefined;
    additionalInfo: {
        deprecated?: string;
        peerDependencies?: Dependencies;
        peerDependenciesMeta?: PeerDependenciesMeta;
        bundleDependencies?: string[];
        bundledDependencies?: string[];
        engines?: {
            node?: string;
            npm?: string;
        };
        cpu?: string[];
        os?: string[];
    };
    engineCache?: string;
}
export default function resolveDependencies(ctx: ResolutionContext, wantedDependencies: Array<WantedDependency & {
    updateDepth?: number;
}>, options: {
    dependentId?: string;
    parentDependsOnPeers: boolean;
    parentNodeId: string;
    proceed: boolean;
    updateDepth: number;
    currentDepth: number;
    resolvedDependencies?: ResolvedDependencies;
    preferedDependencies?: ResolvedDependencies;
    preferredVersions: PreferredVersions;
    parentIsInstallable?: boolean;
    readPackageHook?: ReadPackageHook;
    localPackages?: LocalPackages;
}): Promise<Array<PkgAddress | LinkedDependency>>;
export {};

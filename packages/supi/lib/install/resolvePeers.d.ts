import { DependenciesTree } from '@pnpm/resolve-dependencies';
import { Resolution } from '@pnpm/resolver-base';
import { PackageFilesResponse } from '@pnpm/store-controller-types';
import { Dependencies, DependencyManifest } from '@pnpm/types';
export interface DependenciesGraphNode {
    name: string;
    version: string;
    hasBin: boolean;
    hasBundledDependencies: boolean;
    centralLocation: string;
    modules: string;
    fetchingBundledManifest?: () => Promise<DependencyManifest>;
    fetchingFiles: () => Promise<PackageFilesResponse>;
    resolution: Resolution;
    peripheralLocation: string;
    children: {
        [alias: string]: string;
    };
    independent: boolean;
    optionalDependencies: Set<string>;
    depth: number;
    absolutePath: string;
    prod: boolean;
    dev: boolean;
    optional: boolean;
    packageId: string;
    installable: boolean;
    additionalInfo: {
        deprecated?: string;
        peerDependencies?: Dependencies;
        bundleDependencies?: string[];
        bundledDependencies?: string[];
        engines?: {
            node?: string;
            npm?: string;
        };
        cpu?: string[];
        os?: string[];
    };
    isBuilt?: boolean;
    requiresBuild?: boolean;
    prepare: boolean;
    isPure: boolean;
}
export interface DependenciesGraph {
    [depPath: string]: DependenciesGraphNode;
}
export default function (opts: {
    importers: Array<{
        directNodeIdsByAlias: {
            [alias: string]: string;
        };
        topParents: Array<{
            name: string;
            version: string;
        }>;
        rootDir: string;
        id: string;
    }>;
    dependenciesTree: DependenciesTree;
    independentLeaves: boolean;
    virtualStoreDir: string;
    lockfileDir: string;
    strictPeerDependencies: boolean;
}): {
    depGraph: DependenciesGraph;
    importersDirectAbsolutePathsByAlias: {
        [id: string]: {
            [alias: string]: string;
        };
    };
};

import { StoreController } from '@pnpm/store-controller-types';
import { PackageManifest } from '@pnpm/types';
declare const _default: (depGraph: DependenciesGraph, rootDepPaths: string[], opts: {
    childConcurrency?: number | undefined;
    depsToBuild?: Set<string> | undefined;
    extraBinPaths?: string[] | undefined;
    lockfileDir: string;
    optional: boolean;
    rawConfig: object;
    unsafePerm: boolean;
    userAgent: string;
    sideEffectsCacheWrite: boolean;
    storeController: StoreController;
    rootNodeModulesDir: string;
}) => Promise<void>;
export default _default;
export interface DependenciesGraphNode {
    fetchingBundledManifest?: () => Promise<PackageManifest>;
    hasBundledDependencies: boolean;
    peripheralLocation: string;
    children: {
        [alias: string]: string;
    };
    optional: boolean;
    optionalDependencies: Set<string>;
    packageId: string;
    installable?: boolean;
    isBuilt?: boolean;
    requiresBuild?: boolean;
    prepare: boolean;
    hasBin: boolean;
}
export interface DependenciesGraph {
    [depPath: string]: DependenciesGraphNode;
}
export declare function linkBinsOfDependencies(depNode: DependenciesGraphNode, depGraph: DependenciesGraph, opts: {
    optional: boolean;
    warn: (message: string) => void;
}): Promise<void>;

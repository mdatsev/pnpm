import { Lockfile } from '@pnpm/lockfile-file';
import { LogBase } from '@pnpm/logger';
import { IncludedDependencies } from '@pnpm/modules-yaml';
import { PackageFilesResponse, StoreController } from '@pnpm/store-controller-types';
import { ImporterManifest, Registries } from '@pnpm/types';
export declare type ReporterFunction = (logObj: LogBase) => void;
export interface HeadlessOptions {
    childConcurrency?: number;
    currentLockfile?: Lockfile;
    currentEngine: {
        nodeVersion: string;
        pnpmVersion: string;
    };
    engineStrict: boolean;
    extraBinPaths?: string[];
    ignoreScripts: boolean;
    include: IncludedDependencies;
    independentLeaves: boolean;
    importers: Array<{
        binsDir: string;
        buildIndex: number;
        manifest: ImporterManifest;
        modulesDir: string;
        id: string;
        pruneDirectDependencies?: boolean;
        rootDir: string;
    }>;
    hoistedAliases: {
        [depPath: string]: string[];
    };
    hoistPattern?: string[];
    lockfileDir: string;
    virtualStoreDir?: string;
    shamefullyHoist: boolean;
    storeController: StoreController;
    sideEffectsCacheRead: boolean;
    sideEffectsCacheWrite: boolean;
    force: boolean;
    storeDir: string;
    rawConfig: object;
    unsafePerm: boolean;
    userAgent: string;
    registries: Registries;
    reporter?: ReporterFunction;
    packageManager: {
        name: string;
        version: string;
    };
    pruneStore: boolean;
    wantedLockfile?: Lockfile;
    ownLifecycleHooksStdio?: 'inherit' | 'pipe';
    pendingBuilds: string[];
    skipped: Set<string>;
}
declare const _default: (opts: HeadlessOptions) => Promise<void>;
export default _default;
export interface DependenciesGraphNode {
    hasBundledDependencies: boolean;
    centralLocation: string;
    modules: string;
    name: string;
    fetchingFiles: () => Promise<PackageFilesResponse>;
    finishing: () => Promise<void>;
    peripheralLocation: string;
    children: {
        [alias: string]: string;
    };
    independent: boolean;
    optionalDependencies: Set<string>;
    optional: boolean;
    relDepPath: string;
    packageId: string;
    isBuilt: boolean;
    requiresBuild: boolean;
    prepare: boolean;
    hasBin: boolean;
}
export interface DependenciesGraph {
    [depPath: string]: DependenciesGraphNode;
}

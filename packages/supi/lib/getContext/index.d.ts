import { Lockfile } from '@pnpm/lockfile-file';
import { IncludedDependencies, Modules } from '@pnpm/modules-yaml';
import { ImporterManifest, ReadPackageHook, Registries } from '@pnpm/types';
export interface PnpmContext<T> {
    currentLockfile: Lockfile;
    existsCurrentLockfile: boolean;
    existsWantedLockfile: boolean;
    extraBinPaths: string[];
    hoistedAliases: {
        [depPath: string]: string[];
    };
    importers: Array<{
        modulesDir: string;
        id: string;
    } & T & Required<ImportersOptions>>;
    include: IncludedDependencies;
    independentLeaves: boolean;
    modulesFile: Modules | null;
    pendingBuilds: string[];
    rootModulesDir: string;
    hoistPattern: string[] | undefined;
    hoistedModulesDir: string;
    lockfileDir: string;
    virtualStoreDir: string;
    shamefullyHoist: boolean;
    skipped: Set<string>;
    storeDir: string;
    wantedLockfile: Lockfile;
    registries: Registries;
}
export interface ImportersOptions {
    binsDir?: string;
    manifest: ImporterManifest;
    rootDir: string;
}
export default function getContext<T>(importers: (ImportersOptions & T)[], opts: {
    force: boolean;
    forceSharedLockfile: boolean;
    extraBinPaths: string[];
    lockfileDir: string;
    hooks?: {
        readPackage?: ReadPackageHook;
    };
    include?: IncludedDependencies;
    registries: Registries;
    storeDir: string;
    useLockfile: boolean;
    virtualStoreDir?: string;
    independentLeaves?: boolean;
    forceIndependentLeaves?: boolean;
    hoistPattern?: string[] | undefined;
    forceHoistPattern?: boolean;
    shamefullyHoist?: boolean;
    forceShamefullyHoist?: boolean;
}): Promise<PnpmContext<T>>;
export interface PnpmSingleContext {
    currentLockfile: Lockfile;
    existsCurrentLockfile: boolean;
    existsWantedLockfile: boolean;
    extraBinPaths: string[];
    hoistedAliases: {
        [depPath: string]: string[];
    };
    hoistedModulesDir: string;
    hoistPattern: string[] | undefined;
    manifest: ImporterManifest;
    modulesDir: string;
    importerId: string;
    prefix: string;
    include: IncludedDependencies;
    independentLeaves: boolean;
    modulesFile: Modules | null;
    pendingBuilds: string[];
    registries: Registries;
    rootModulesDir: string;
    lockfileDir: string;
    virtualStoreDir: string;
    shamefullyHoist: boolean;
    skipped: Set<string>;
    storeDir: string;
    wantedLockfile: Lockfile;
}
export declare function getContextForSingleImporter(manifest: ImporterManifest, opts: {
    force: boolean;
    forceSharedLockfile: boolean;
    extraBinPaths: string[];
    lockfileDir: string;
    hooks?: {
        readPackage?: ReadPackageHook;
    };
    include?: IncludedDependencies;
    dir: string;
    registries: Registries;
    storeDir: string;
    useLockfile: boolean;
    virtualStoreDir?: string;
    hoistPattern?: string[] | undefined;
    forceHoistPattern?: boolean;
    shamefullyHoist?: boolean;
    forceShamefullyHoist?: boolean;
    independentLeaves?: boolean;
    forceIndependentLeaves?: boolean;
}): Promise<PnpmSingleContext>;

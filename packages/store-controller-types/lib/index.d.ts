import { DirectoryResolution, LocalPackages, Resolution, WantedDependency } from '@pnpm/resolver-base';
import { DependencyManifest, PackageManifest } from '@pnpm/types';
export * from '@pnpm/resolver-base';
export declare type BundledManifest = Pick<DependencyManifest, 'bin' | 'bundledDependencies' | 'bundleDependencies' | 'dependencies' | 'directories' | 'engines' | 'name' | 'optionalDependencies' | 'os' | 'peerDependencies' | 'peerDependenciesMeta' | 'scripts' | 'version'>;
export interface StoreController {
    getPackageLocation(packageId: string, packageName: string, opts: {
        lockfileDir: string;
        targetEngine?: string;
    }): Promise<{
        dir: string;
        isBuilt: boolean;
    }>;
    requestPackage: RequestPackageFunction;
    fetchPackage: FetchPackageToStoreFunction;
    importPackage: ImportPackageFunction;
    close(): Promise<void>;
    updateConnections(prefix: string, opts: {
        addDependencies: string[];
        removeDependencies: string[];
        prune: boolean;
    }): Promise<void>;
    prune(): Promise<void>;
    saveState(): Promise<void>;
    upload(builtPkgLocation: string, opts: {
        packageId: string;
        engine: string;
    }): Promise<void>;
    findPackageUsages(searchQueries: string[]): Promise<PackageUsagesBySearchQueries>;
}
export declare type PackageUsagesBySearchQueries = {
    [searchQuery: string]: PackageUsages[];
};
export declare type PackageUsages = {
    packageId: string;
    usages: string[];
};
export declare type FetchPackageToStoreFunction = (opts: FetchPackageToStoreOptions) => {
    bundledManifest?: () => Promise<BundledManifest>;
    files: () => Promise<PackageFilesResponse>;
    finishing: () => Promise<void>;
    inStoreLocation: string;
};
export interface FetchPackageToStoreOptions {
    fetchRawManifest?: boolean;
    force: boolean;
    lockfileDir: string;
    pkgId: string;
    pkgName?: string;
    resolution: Resolution;
}
export declare type ImportPackageFunction = (from: string, to: string, opts: {
    filesResponse: PackageFilesResponse;
    force: boolean;
}) => Promise<void>;
export interface PackageFilesResponse {
    fromStore: boolean;
    filenames: string[];
}
export declare type RequestPackageFunction = (wantedDependency: WantedDependency, options: RequestPackageOptions) => Promise<PackageResponse>;
export interface RequestPackageOptions {
    currentPackageId?: string;
    currentResolution?: Resolution;
    defaultTag?: string;
    downloadPriority: number;
    importerDir: string;
    localPackages?: LocalPackages;
    lockfileDir: string;
    preferredVersions: {
        [packageName: string]: {
            selector: string;
            type: 'version' | 'range' | 'tag';
        };
    };
    registry: string;
    sideEffectsCache?: boolean;
    skipFetch?: boolean;
    update?: boolean;
}
export declare type PackageResponse = {
    bundledManifest?: () => Promise<BundledManifest>;
    files?: () => Promise<PackageFilesResponse>;
    finishing?: () => Promise<void>;
    body: {
        isLocal: boolean;
        resolution: Resolution;
        manifest?: PackageManifest;
        id: string;
        normalizedPref?: string;
        updated: boolean;
        resolvedVia?: string;
        inStoreLocation?: string;
        cacheByEngine?: Map<string, string>;
        latest?: string;
    } & ({
        isLocal: true;
        resolution: DirectoryResolution;
    } | {
        isLocal: false;
    });
};

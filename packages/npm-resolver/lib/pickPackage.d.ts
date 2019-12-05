import { PackageManifest } from '@pnpm/types';
import { RegistryPackageSpec } from './parsePref';
export interface PackageMeta {
    'dist-tag': {
        [name: string]: string;
    };
    versions: {
        [name: string]: PackageInRegistry;
    };
    cachedAt?: number;
}
export interface PackageMetaCache {
    get(key: string): PackageMeta | undefined;
    set(key: string, meta: PackageMeta): void;
    has(key: string): boolean;
}
export declare type PackageInRegistry = PackageManifest & {
    dist: {
        integrity?: string;
        shasum: string;
        tarball: string;
    };
};
export declare type PickPackageOptions = {
    auth: object;
    preferredVersionSelector: {
        selector: string;
        type: 'version' | 'range' | 'tag';
    } | undefined;
    registry: string;
    dryRun: boolean;
};
declare const _default: (ctx: {
    fetch: (url: string, opts: {
        auth?: object | undefined;
    }) => Promise<{}>;
    metaFileName: string;
    metaCache: PackageMetaCache;
    storeDir: string;
    offline?: boolean | undefined;
    preferOffline?: boolean | undefined;
}, spec: RegistryPackageSpec, opts: PickPackageOptions) => Promise<{
    meta: PackageMeta;
    pickedPackage: PackageInRegistry | null;
}>;
export default _default;

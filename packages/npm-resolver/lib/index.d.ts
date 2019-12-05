import { LocalPackages, ResolveResult, WantedDependency } from '@pnpm/resolver-base';
import { PackageMeta, PackageMetaCache } from './pickPackage';
export { PackageMeta, PackageMetaCache, };
export interface ResolverFactoryOptions {
    rawConfig: object;
    metaCache: PackageMetaCache;
    storeDir: string;
    cert?: string;
    fullMetadata?: boolean;
    key?: string;
    ca?: string;
    strictSsl?: boolean;
    proxy?: string;
    httpsProxy?: string;
    localAddress?: string;
    userAgent?: string;
    offline?: boolean;
    preferOffline?: boolean;
    fetchRetries?: number;
    fetchRetryFactor?: number;
    fetchRetryMintimeout?: number;
    fetchRetryMaxtimeout?: number;
}
export default function createResolver(opts: ResolverFactoryOptions): (wantedDependency: WantedDependency, opts: ResolveFromNpmOptions) => Promise<ResolveResult | null>;
export declare type ResolveFromNpmOptions = {
    defaultTag?: string;
    dryRun?: boolean;
    registry: string;
    preferredVersions?: {
        [packageName: string]: {
            selector: string;
            type: 'version' | 'range' | 'tag';
        };
    };
} & ({
    importerDir?: string;
    localPackages?: undefined;
} | {
    importerDir: string;
    localPackages: LocalPackages;
});

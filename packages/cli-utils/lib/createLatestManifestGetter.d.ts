import { ResolveFunction } from '@pnpm/default-resolver';
import { DependencyManifest, Registries } from '@pnpm/types';
export declare function createLatestManifestGetter(opts: {
    ca?: string;
    cert?: string;
    fetchRetries?: number;
    fetchRetryFactor?: number;
    fetchRetryMaxtimeout?: number;
    fetchRetryMintimeout?: number;
    httpsProxy?: string;
    key?: string;
    localAddress?: string;
    lockfileDir: string;
    offline?: boolean;
    dir: string;
    proxy?: string;
    rawConfig: object;
    registries: Registries;
    storeDir: string;
    strictSsl?: boolean;
    userAgent?: string;
    verifyStoreIntegrity?: boolean;
}): (packageName: string) => Promise<DependencyManifest | null>;
export declare function getLatestManifest(resolve: ResolveFunction, opts: {
    lockfileDir: string;
    dir: string;
    registries: Registries;
}, packageName: string): Promise<DependencyManifest | null>;

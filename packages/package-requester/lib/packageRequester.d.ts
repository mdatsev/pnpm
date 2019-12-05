import { FetchFunction } from '@pnpm/fetcher-base';
import { ResolveFunction } from '@pnpm/resolver-base';
import { FetchPackageToStoreFunction, RequestPackageFunction } from '@pnpm/store-controller-types';
import { StoreIndex } from '@pnpm/types';
export default function (resolve: ResolveFunction, fetchers: {
    [type: string]: FetchFunction;
}, opts: {
    networkConcurrency?: number;
    storeDir: string;
    storeIndex: StoreIndex;
    verifyStoreIntegrity: boolean;
}): RequestPackageFunction & {
    fetchPackageToStore: FetchPackageToStoreFunction;
    requestPackage: RequestPackageFunction;
};
export declare function getCacheByEngine(storeDir: string, id: string): Promise<Map<string, string>>;

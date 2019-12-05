import { FetchFunction } from '@pnpm/fetcher-base';
import { ResolveFunction } from '@pnpm/resolver-base';
import { StoreController } from '@pnpm/store-controller-types';
export default function (resolve: ResolveFunction, fetchers: {
    [type: string]: FetchFunction;
}, initOpts: {
    locks?: string;
    lockStaleDuration?: number;
    storeDir: string;
    networkConcurrency?: number;
    packageImportMethod?: 'auto' | 'hardlink' | 'copy' | 'clone';
    verifyStoreIntegrity: boolean;
}): Promise<StoreController & {
    closeSync: () => void;
    saveStateSync: () => void;
}>;

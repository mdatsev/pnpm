import { Config } from '@pnpm/config';
import { CreateResolverOptions } from './createResolver';
export declare type CreateNewStoreControllerOptions = CreateResolverOptions & Pick<Config, 'alwaysAuth' | 'lock' | 'lockStaleDuration' | 'networkConcurrency' | 'packageImportMethod' | 'registry' | 'verifyStoreIntegrity'> & {
    ignoreFile?: (filename: string) => boolean;
};
declare const _default: (opts: CreateNewStoreControllerOptions) => Promise<{
    ctrl: import("@pnpm/package-store").StoreController & {
        closeSync: () => void;
        saveStateSync: () => void;
    };
    dir: string;
}>;
export default _default;

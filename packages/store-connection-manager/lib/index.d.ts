import { Config } from '@pnpm/config';
import { StoreController } from '@pnpm/package-store';
import createNewStoreController, { CreateNewStoreControllerOptions } from './createNewStoreController';
import serverConnectionInfoDir from './serverConnectionInfoDir';
export { createNewStoreController, serverConnectionInfoDir };
export declare type CreateStoreControllerOptions = Omit<CreateNewStoreControllerOptions, 'storeDir'> & Pick<Config, 'storeDir' | 'dir' | 'useRunningStoreServer' | 'useStoreServer'>;
export declare function createOrConnectStoreControllerCached(storeControllerCache: Map<string, Promise<{
    ctrl: StoreController;
    dir: string;
}>>, opts: CreateStoreControllerOptions): Promise<{
    ctrl: StoreController;
    dir: string;
}>;
export declare function createOrConnectStoreController(opts: CreateStoreControllerOptions): Promise<{
    ctrl: StoreController;
    dir: string;
}>;
export declare function tryLoadServerJson(options: {
    serverJsonPath: string;
    shouldRetryOnNoent: boolean;
}): Promise<null | {
    connectionOptions: {
        remotePrefix: string;
    };
    pid: number;
    pnpmVersion: string;
}>;

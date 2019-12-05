import { StoreController } from '@pnpm/store-controller-types';
export declare type StoreServerController = StoreController & {
    stop(): Promise<void>;
};
export default function (initOpts: {
    remotePrefix: string;
    concurrency?: number;
}): Promise<StoreServerController>;

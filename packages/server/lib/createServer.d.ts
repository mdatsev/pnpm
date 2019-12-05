import { StoreController } from '@pnpm/store-controller-types';
export default function (store: StoreController, opts: {
    path?: string;
    port?: number;
    hostname?: string;
    ignoreStopRequests?: boolean;
    ignoreUploadRequests?: boolean;
}): {
    close: () => Promise<void>;
};

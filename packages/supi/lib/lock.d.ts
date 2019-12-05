import { StoreController } from '@pnpm/store-controller-types';
export default function withLock<T>(dir: string, fn: () => Promise<T>, opts: {
    stale: number;
    storeController: StoreController;
    locks: string;
    prefix: string;
}): Promise<T>;

import { StoreController } from '@pnpm/store-controller-types';
import { Registries } from '@pnpm/types';
import { ReporterFunction } from './types';
export default function (fuzzyDeps: string[], opts: {
    prefix?: string;
    registries?: Registries;
    reporter?: ReporterFunction;
    storeController: StoreController;
    tag?: string;
}): Promise<void>;

import { StoreController } from '@pnpm/store-controller-types';
import { ReporterFunction } from './types';
export default function (opts: {
    reporter?: ReporterFunction;
    storeController: StoreController;
}): Promise<void>;

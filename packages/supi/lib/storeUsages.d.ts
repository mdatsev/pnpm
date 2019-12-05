import { PackageUsages, StoreController } from '@pnpm/store-controller-types';
import { ReporterFunction } from './types';
export default function (packageSelectors: string[], opts: {
    reporter?: ReporterFunction;
    storeController: StoreController;
}): Promise<{
    [packageSelector: string]: PackageUsages[];
}>;

import { Registries } from '@pnpm/types';
import { ReporterFunction } from '../types';
export interface StrictStoreStatusOptions {
    lockfileDir: string;
    dir: string;
    storeDir: string;
    independentLeaves: boolean;
    force: boolean;
    forceSharedLockfile: boolean;
    useLockfile: boolean;
    registries: Registries;
    shamefullyHoist: boolean;
    reporter: ReporterFunction;
    production: boolean;
    development: boolean;
    optional: boolean;
    binsDir: string;
}
export declare type StoreStatusOptions = Partial<StrictStoreStatusOptions> & Pick<StrictStoreStatusOptions, 'storeDir'>;
declare const _default: (opts: StoreStatusOptions) => Promise<StrictStoreStatusOptions>;
export default _default;

import { StoreController } from '@pnpm/store-controller-types';
import { Registries } from '@pnpm/types';
import { ReporterFunction } from '../types';
export interface StrictRebuildOptions {
    childConcurrency: number;
    extraBinPaths: string[];
    lockfileDir: string;
    sideEffectsCacheRead: boolean;
    storeDir: string;
    storeController: StoreController;
    force: boolean;
    forceSharedLockfile: boolean;
    useLockfile: boolean;
    registries: Registries;
    dir: string;
    reporter: ReporterFunction;
    production: boolean;
    development: boolean;
    optional: boolean;
    rawConfig: object;
    userAgent: string;
    packageManager: {
        name: string;
        version: string;
    };
    unsafePerm: boolean;
    pending: boolean;
    shamefullyHoist: boolean;
}
export declare type RebuildOptions = Partial<StrictRebuildOptions> & Pick<StrictRebuildOptions, 'storeDir' | 'storeController'>;
declare const _default: (opts: RebuildOptions) => Promise<StrictRebuildOptions>;
export default _default;

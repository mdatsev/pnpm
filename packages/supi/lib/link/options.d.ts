import { StoreController } from '@pnpm/store-controller-types';
import { DependenciesField, ImporterManifest, Registries } from '@pnpm/types';
import { ReporterFunction } from '../types';
interface StrictLinkOptions {
    binsDir: string;
    force: boolean;
    forceSharedLockfile: boolean;
    useLockfile: boolean;
    lockfileDir: string;
    pinnedVersion: 'major' | 'minor' | 'patch';
    storeController: StoreController;
    manifest: ImporterManifest;
    registries: Registries;
    storeDir: string;
    reporter: ReporterFunction;
    targetDependenciesField?: DependenciesField;
    dir: string;
    hoistPattern: string[] | undefined;
    forceHoistPattern: boolean;
    shamefullyHoist: boolean;
    forceShamefullyHoist: boolean;
    independentLeaves: boolean;
    forceIndependentLeaves: boolean;
}
export declare type LinkOptions = Partial<StrictLinkOptions> & Pick<StrictLinkOptions, 'storeController' | 'manifest'>;
export declare function extendOptions(opts: LinkOptions): Promise<StrictLinkOptions>;
export {};

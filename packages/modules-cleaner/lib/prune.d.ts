import { Lockfile } from '@pnpm/lockfile-types';
import { StoreController } from '@pnpm/store-controller-types';
import { DependenciesField, Registries } from '@pnpm/types';
export default function prune(importers: Array<{
    binsDir: string;
    id: string;
    modulesDir: string;
    pruneDirectDependencies?: boolean;
    removePackages?: string[];
    rootDir: string;
}>, opts: {
    dryRun?: boolean;
    include: {
        [dependenciesField in DependenciesField]: boolean;
    };
    hoistedAliases: {
        [depPath: string]: string[];
    };
    hoistedModulesDir?: string;
    wantedLockfile: Lockfile;
    currentLockfile: Lockfile;
    pruneStore?: boolean;
    registries: Registries;
    skipped: Set<string>;
    virtualStoreDir: string;
    lockfileDir: string;
    storeController: StoreController;
}): Promise<Set<string>>;

import { Lockfile } from '@pnpm/lockfile-utils';
import { Registries } from '@pnpm/types';
export default function hoistByLockfile(match: (dependencyName: string) => boolean, opts: {
    getIndependentPackageLocation?: (packageId: string, packageName: string) => Promise<string>;
    lockfile: Lockfile;
    lockfileDir: string;
    modulesDir: string;
    registries: Registries;
    virtualStoreDir: string;
}): Promise<{
    [alias: string]: string[];
}>;
export interface Dependency {
    name: string;
    location: string;
    children: {
        [alias: string]: string;
    };
    depth: number;
    absolutePath: string;
}

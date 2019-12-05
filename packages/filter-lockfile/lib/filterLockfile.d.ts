import { Lockfile } from '@pnpm/lockfile-types';
import { DependenciesField, Registries } from '@pnpm/types';
export default function filterLockfile(lockfile: Lockfile, opts: {
    include: {
        [dependenciesField in DependenciesField]: boolean;
    };
    registries: Registries;
    skipped: Set<string>;
}): Lockfile;

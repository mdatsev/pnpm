import { Lockfile } from '@pnpm/lockfile-types';
import { DependenciesField, Registries } from '@pnpm/types';
export default function filterByImporters(lockfile: Lockfile, importerIds: string[], opts: {
    include: {
        [dependenciesField in DependenciesField]: boolean;
    };
    registries: Registries;
    skipped: Set<string>;
    failOnMissingDependencies: boolean;
}): Lockfile;

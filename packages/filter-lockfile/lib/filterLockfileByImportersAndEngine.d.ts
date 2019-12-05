import { Lockfile } from '@pnpm/lockfile-types';
import { DependenciesField, Registries } from '@pnpm/types';
export default function filterByImportersAndEngine(lockfile: Lockfile, importerIds: string[], opts: {
    currentEngine: {
        nodeVersion: string;
        pnpmVersion: string;
    };
    engineStrict: boolean;
    registries: Registries;
    include: {
        [dependenciesField in DependenciesField]: boolean;
    };
    includeIncompatiblePackages?: boolean;
    failOnMissingDependencies: boolean;
    lockfileDir: string;
    skipped: Set<string>;
}): Lockfile;

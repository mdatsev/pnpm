import { LockfileImporter } from '@pnpm/lockfile-types';
import { DependenciesField } from '@pnpm/types';
export default function filterImporter(importer: LockfileImporter, include: {
    [dependenciesField in DependenciesField]: boolean;
}): {
    dependencies: import("@pnpm/lockfile-types").ResolvedDependencies;
    devDependencies: import("@pnpm/lockfile-types").ResolvedDependencies;
    optionalDependencies: import("@pnpm/lockfile-types").ResolvedDependencies;
    specifiers: import("@pnpm/lockfile-types").ResolvedDependencies;
};

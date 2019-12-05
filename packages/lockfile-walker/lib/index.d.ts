import { Lockfile, PackageSnapshot } from '@pnpm/lockfile-types';
import { DependenciesField } from '@pnpm/types';
export declare type LockedDependency = {
    relDepPath: string;
    pkgSnapshot: PackageSnapshot;
    next: () => LockfileWalkerStep;
};
export declare type LockfileWalkerStep = {
    dependencies: LockedDependency[];
    links: string[];
    missing: string[];
};
export declare function lockfileWalkerGroupImporterSteps(lockfile: Lockfile, importerIds: string[], opts?: {
    include?: {
        [dependenciesField in DependenciesField]: boolean;
    };
    skipped?: Set<string>;
}): {
    importerId: string;
    step: LockfileWalkerStep;
}[];
export default function lockfileWalker(lockfile: Lockfile, importerIds: string[], opts?: {
    include?: {
        [dependenciesField in DependenciesField]: boolean;
    };
    skipped?: Set<string>;
}): LockfileWalkerStep;

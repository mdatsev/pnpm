import { Lockfile, LockfileImporter, PackageSnapshots } from '@pnpm/lockfile-types';
import { PackageManifest } from '@pnpm/types';
export * from '@pnpm/lockfile-types';
export declare function pruneSharedLockfile(lockfile: Lockfile, opts?: {
    warn?: (msg: string) => void;
}): {
    packages: PackageSnapshots;
    importers: {
        [path: string]: LockfileImporter;
    };
    lockfileVersion: number;
};
export declare function pruneLockfile(lockfile: Lockfile, pkg: PackageManifest, importerId: string, opts?: {
    warn?: (msg: string) => void;
}): Lockfile;

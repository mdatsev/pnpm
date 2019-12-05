import { Lockfile } from '@pnpm/lockfile-types';
export declare function readCurrentLockfile(virtualStoreDir: string, opts: {
    wantedVersion?: number;
    ignoreIncompatible: boolean;
}): Promise<Lockfile | null>;
export declare function readWantedLockfile(pkgPath: string, opts: {
    wantedVersion?: number;
    ignoreIncompatible: boolean;
}): Promise<Lockfile | null>;
export declare function createLockfileObject(importerIds: string[], opts: {
    lockfileVersion: number;
}): {
    importers: {};
    lockfileVersion: number;
};

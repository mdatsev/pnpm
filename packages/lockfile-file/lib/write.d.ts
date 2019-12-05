import { Lockfile } from '@pnpm/lockfile-types';
export declare function writeWantedLockfile(pkgPath: string, wantedLockfile: Lockfile, opts?: {
    forceSharedFormat?: boolean;
}): Promise<unknown>;
export declare function writeCurrentLockfile(virtualStoreDir: string, currentLockfile: Lockfile, opts?: {
    forceSharedFormat?: boolean;
}): Promise<unknown>;
export default function writeLockfiles(opts: {
    forceSharedFormat?: boolean;
    wantedLockfile: Lockfile;
    wantedLockfileDir: string;
    currentLockfile: Lockfile;
    currentLockfileDir: string;
}): Promise<[unknown, unknown]>;

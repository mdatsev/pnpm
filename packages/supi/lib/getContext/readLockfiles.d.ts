import { Lockfile } from '@pnpm/lockfile-file';
export interface PnpmContext {
    currentLockfile: Lockfile;
    existsCurrentLockfile: boolean;
    existsWantedLockfile: boolean;
    wantedLockfile: Lockfile;
}
export default function (opts: {
    force: boolean;
    forceSharedLockfile: boolean;
    importers: Array<{
        id: string;
        rootDir: string;
    }>;
    lockfileDir: string;
    registry: string;
    useLockfile: boolean;
    virtualStoreDir: string;
}): Promise<{
    currentLockfile: Lockfile;
    existsCurrentLockfile: boolean;
    existsWantedLockfile: boolean;
    wantedLockfile: Lockfile;
}>;

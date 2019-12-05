import { Lockfile } from '@pnpm/prune-lockfile';
import { Registries } from '@pnpm/types';
import { DependenciesGraph } from './resolvePeers';
export default function (depGraph: DependenciesGraph, lockfile: Lockfile, prefix: string, registries: Registries): {
    newLockfile: Lockfile;
    pendingRequiresBuilds: PendingRequiresBuild[];
};
export interface PendingRequiresBuild {
    relativeDepPath: string;
    absoluteDepPath: string;
}

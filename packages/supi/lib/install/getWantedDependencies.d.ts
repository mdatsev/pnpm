import { ImporterManifest } from '@pnpm/types';
export declare type PinnedVersion = 'major' | 'minor' | 'patch' | 'none';
export interface WantedDependency {
    alias: string;
    pref: string;
    dev: boolean;
    optional: boolean;
    raw: string;
    pinnedVersion?: PinnedVersion;
}
export default function getWantedDependencies(pkg: Pick<ImporterManifest, 'devDependencies' | 'dependencies' | 'optionalDependencies'>, opts?: {
    updateWorkspaceDependencies?: boolean;
}): WantedDependency[];

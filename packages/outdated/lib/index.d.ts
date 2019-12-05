import { Lockfile } from '@pnpm/lockfile-file';
import { DependenciesField, ImporterManifest, PackageManifest } from '@pnpm/types';
export declare type GetLatestManifestFunction = (packageName: string) => Promise<PackageManifest | null>;
export interface OutdatedPackage {
    alias: string;
    belongsTo: DependenciesField;
    current?: string;
    latestManifest?: PackageManifest;
    packageName: string;
    wanted: string;
}
export default function outdated(opts: {
    currentLockfile: Lockfile | null;
    match?: (dependencyName: string) => boolean;
    manifest: ImporterManifest;
    prefix: string;
    getLatestManifest: GetLatestManifestFunction;
    lockfileDir: string;
    wantedLockfile: Lockfile;
}): Promise<OutdatedPackage[]>;

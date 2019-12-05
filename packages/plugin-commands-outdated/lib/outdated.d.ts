import { OutdatedPackage } from '@pnpm/outdated';
import { SEMVER_CHANGE } from '@pnpm/semver-diff';
import { ImporterManifest, Registries } from '@pnpm/types';
export declare function types(): Pick<any, never>;
export declare const commandNames: string[];
export declare function help(): string;
export declare type OutdatedWithVersionDiff = OutdatedPackage & {
    change: SEMVER_CHANGE | null;
    diff?: [string[], string[]];
};
/**
 * Default comparators used as the argument to `ramda.sortWith()`.
 */
export declare const DEFAULT_COMPARATORS: (typeof sortBySemverChange)[];
export interface OutdatedOptions {
    alwaysAuth: boolean;
    ca?: string;
    cert?: string;
    engineStrict?: boolean;
    fetchRetries: number;
    fetchRetryFactor: number;
    fetchRetryMaxtimeout: number;
    fetchRetryMintimeout: number;
    global: boolean;
    httpsProxy?: string;
    independentLeaves: boolean;
    key?: string;
    localAddress?: string;
    long?: boolean;
    networkConcurrency: number;
    offline: boolean;
    dir: string;
    proxy?: string;
    rawConfig: object;
    registries: Registries;
    lockfileDir?: string;
    store?: string;
    strictSsl: boolean;
    table?: boolean;
    tag: string;
    userAgent: string;
}
export declare function handler(args: string[], opts: OutdatedOptions, command: string): Promise<string>;
export declare function getCellWidth(data: string[][], columnNumber: number, maxWidth: number): number;
export declare function toOutdatedWithVersionDiff<T>(outdated: T & OutdatedPackage): T & OutdatedWithVersionDiff;
export declare function renderPackageName({ belongsTo, packageName }: OutdatedPackage): string;
export declare function renderCurrent({ current, wanted }: OutdatedPackage): string;
export declare function renderLatest(outdatedPkg: OutdatedWithVersionDiff): string;
export declare function sortBySemverChange(outdated1: OutdatedWithVersionDiff, outdated2: OutdatedWithVersionDiff): number;
export declare function renderDetails({ latestManifest }: OutdatedPackage): string;
export declare function outdatedDependenciesOfWorkspacePackages(pkgs: Array<{
    dir: string;
    manifest: ImporterManifest;
}>, args: string[], opts: OutdatedOptions): Promise<{
    manifest: ImporterManifest;
    outdatedPackages: OutdatedPackage[];
    prefix: string;
}[]>;

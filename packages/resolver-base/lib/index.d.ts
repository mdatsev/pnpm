import { DependencyManifest } from '@pnpm/types';
/**
 * tarball hosted remotely
 */
export interface TarballResolution {
    type?: undefined;
    tarball: string;
    integrity?: string;
    registry?: string;
}
/**
 * directory on a file system
 */
export interface DirectoryResolution {
    type: 'directory';
    directory: string;
}
export declare type Resolution = TarballResolution | DirectoryResolution | ({
    type: string;
} & object);
export interface ResolveResult {
    id: string;
    latest?: string;
    manifest?: DependencyManifest;
    normalizedPref?: string;
    resolution: Resolution;
    resolvedVia: 'npm-registry' | 'git-repository' | 'local-filesystem' | 'url' | string;
}
export interface LocalPackages {
    [name: string]: {
        [version: string]: {
            dir: string;
            manifest: DependencyManifest;
        };
    };
}
export interface ResolveOptions {
    defaultTag?: string;
    importerDir: string;
    localPackages?: LocalPackages;
    lockfileDir: string;
    preferredVersions: {
        [packageName: string]: {
            selector: string;
            type: 'version' | 'range' | 'tag';
        };
    };
    registry: string;
}
export declare type WantedDependency = {
    alias?: string;
    pref: string;
} | {
    alias: string;
    pref?: string;
};
export declare type ResolveFunction = (wantedDependency: WantedDependency, opts: ResolveOptions) => Promise<ResolveResult>;

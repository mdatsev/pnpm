import { DependenciesField, ImporterManifest } from '@pnpm/types';
import { ImportersOptions } from '../getContext';
import { InstallOptions } from './extendInstallOptions';
import { PinnedVersion, WantedDependency } from './getWantedDependencies';
export declare type DependenciesMutation = ({
    buildIndex: number;
    mutation: 'install';
    pruneDirectDependencies?: boolean;
} | {
    allowNew?: boolean;
    dependencySelectors: string[];
    mutation: 'installSome';
    peer?: boolean;
    pruneDirectDependencies?: boolean;
    pinnedVersion?: PinnedVersion;
    targetDependenciesField?: DependenciesField;
} | {
    mutation: 'uninstallSome';
    dependencyNames: string[];
    targetDependenciesField?: DependenciesField;
} | {
    mutation: 'unlink';
} | {
    mutation: 'unlinkSome';
    dependencyNames: string[];
}) & ({
    manifest: ImporterManifest;
});
export declare function install(manifest: ImporterManifest, opts: InstallOptions & {
    preferredVersions?: {
        [packageName: string]: {
            selector: string;
            type: 'version' | 'range' | 'tag';
        };
    };
}): Promise<ImporterManifest>;
export declare type MutatedImporter = ImportersOptions & DependenciesMutation;
export declare function mutateModules(importers: MutatedImporter[], maybeOpts: InstallOptions & {
    preferredVersions?: {
        [packageName: string]: {
            selector: string;
            type: 'version' | 'range' | 'tag';
        };
    };
}): Promise<{
    rootDir: string;
    manifest: ImporterManifest;
}[]>;
export declare function addDependenciesToPackage(manifest: ImporterManifest, dependencySelectors: string[], opts: InstallOptions & {
    allowNew?: boolean;
    peer?: boolean;
    pinnedVersion?: 'major' | 'minor' | 'patch';
    targetDependenciesField?: DependenciesField;
}): Promise<ImporterManifest>;
export declare type ImporterToUpdate = {
    binsDir: string;
    id: string;
    manifest: ImporterManifest;
    modulesDir: string;
    rootDir: string;
    pruneDirectDependencies: boolean;
    removePackages?: string[];
    updatePackageManifest: boolean;
    wantedDependencies: WantedDependency[];
} & DependenciesMutation;

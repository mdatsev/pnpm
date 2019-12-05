import { Config } from '@pnpm/config';
import { CreateStoreControllerOptions } from '@pnpm/store-connection-manager';
import { DependencyManifest, ImporterManifest } from '@pnpm/types';
import { PackageSelector } from './parsePackageSelectors';
export declare function types(): {
    recursive: BooleanConstructor;
};
export declare const commandNames: string[];
export declare function help(): string;
export declare function handler(input: string[], opts: RecursiveOptions & Pick<Config, 'filter' | 'depth' | 'engineStrict' | 'workspaceDir'> & {
    long?: boolean;
    table?: boolean;
}): Promise<string | undefined>;
declare type RecursiveOptions = CreateStoreControllerOptions & Pick<Config, 'bail' | 'globalPnpmfile' | 'hoistPattern' | 'ignorePnpmfile' | 'ignoreScripts' | 'include' | 'latest' | 'linkWorkspacePackages' | 'lockfileDir' | 'lockfileOnly' | 'pending' | 'pnpmfile' | 'rawLocalConfig' | 'save' | 'saveDev' | 'saveExact' | 'saveOptional' | 'savePeer' | 'savePrefix' | 'saveProd' | 'sort' | 'workspaceConcurrency'>;
export declare function recursive(allPkgs: Array<{
    dir: string;
    manifest: DependencyManifest;
    writeImporterManifest: (manifest: ImporterManifest) => Promise<void>;
}>, input: string[], opts: RecursiveOptions & {
    allowNew?: boolean;
    packageSelectors?: PackageSelector[];
    ignoredPackages?: Set<string>;
    update?: boolean;
    useBetaCli?: boolean;
} & Required<Pick<Config, 'workspaceDir'>>, cmdFullName: string, cmd: string): Promise<boolean | string>;
export {};

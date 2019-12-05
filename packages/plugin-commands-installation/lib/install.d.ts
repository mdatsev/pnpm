import { Config } from '@pnpm/config';
import { CreateStoreControllerOptions } from '@pnpm/store-connection-manager';
export declare function types(): Pick<any, never>;
export declare const commandNames: string[];
export declare function help(): string;
export declare type InstallCommandOptions = Pick<Config, 'bail' | 'bin' | 'engineStrict' | 'globalPnpmfile' | 'ignorePnpmfile' | 'ignoreScripts' | 'include' | 'latest' | 'linkWorkspacePackages' | 'lockfileDir' | 'pending' | 'pnpmfile' | 'rawLocalConfig' | 'save' | 'saveDev' | 'saveExact' | 'saveOptional' | 'savePeer' | 'savePrefix' | 'saveProd' | 'sort' | 'workspaceConcurrency' | 'workspaceDir'> & CreateStoreControllerOptions & {
    allowNew?: boolean;
    update?: boolean;
    useBetaCli?: boolean;
};
export declare function handler(input: string[], opts: InstallCommandOptions, invocation?: string): Promise<void>;

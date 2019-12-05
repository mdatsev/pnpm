import { Config } from '@pnpm/config';
import { CreateStoreControllerOptions } from '@pnpm/store-connection-manager';
export declare function types(): Pick<any, never>;
export declare const commandNames: string[];
export declare function help(): string;
export declare function handler(input: string[], opts: CreateStoreControllerOptions & Pick<Config, 'cliArgs' | 'engineStrict' | 'globalBin' | 'globalDir' | 'include' | 'linkWorkspacePackages' | 'saveDev' | 'saveOptional' | 'saveProd' | 'workspaceDir'>): Promise<void>;

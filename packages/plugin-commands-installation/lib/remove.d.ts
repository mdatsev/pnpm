import { Config } from '@pnpm/config';
import { CreateStoreControllerOptions } from '@pnpm/store-connection-manager';
export declare function types(): Pick<any, never>;
export declare function help(): string;
export declare const commandNames: string[];
export declare function handler(input: string[], opts: CreateStoreControllerOptions & Pick<Config, 'ignorePnpmfile' | 'engineStrict' | 'lockfileDir' | 'linkWorkspacePackages' | 'workspaceDir' | 'bin' | 'globalPnpmfile' | 'pnpmfile'>): Promise<void>;

import { Config } from '@pnpm/config';
import { CreateStoreControllerOptions } from '@pnpm/store-connection-manager';
import { types } from './install';
export { types };
export declare const commandNames: string[];
export declare function help(): string;
export declare function handler(input: string[], opts: CreateStoreControllerOptions & Pick<Config, 'engineStrict'>): Promise<{
    rootDir: string;
    manifest: import("../../types/lib").ImporterManifest;
}[]>;

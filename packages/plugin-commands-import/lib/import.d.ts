import { CreateStoreControllerOptions } from '@pnpm/store-connection-manager';
import { InstallOptions } from 'supi';
export declare function types(): {};
export declare function help(): string;
export declare const commandNames: string[];
export declare function handler(input: string[], opts: CreateStoreControllerOptions & Omit<InstallOptions, 'storeController' | 'lockfileOnly' | 'preferredVersions'>): Promise<void>;

import { StoreIndex } from '@pnpm/types';
export declare function read(storePath: string): Promise<StoreIndex | null>;
export declare function save(storePath: string, store: StoreIndex): Promise<void>;
export declare function saveSync(storePath: string, store: StoreIndex): void;

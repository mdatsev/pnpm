import { LogBase } from '@pnpm/logger';
export declare const importingLogger: import("@pnpm/logger").Logger<unknown>;
export interface ImportingMessage {
    from: string;
    method: string;
    to: string;
}
export declare type ImportingLog = {
    name: 'pnpm:importing';
} & LogBase & ImportingMessage;

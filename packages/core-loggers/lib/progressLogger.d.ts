import { LogBase, Logger } from '@pnpm/logger';
export declare const progressLogger: Logger<ProgressMessage>;
export declare type ProgressMessage = {
    packageId: string;
    requester: string;
    status: 'fetched' | 'found_in_store' | 'resolved';
};
export declare type ProgressLog = {
    name: 'pnpm:progress';
} & LogBase & ProgressMessage;

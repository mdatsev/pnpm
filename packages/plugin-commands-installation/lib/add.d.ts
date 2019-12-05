import { InstallCommandOptions } from './install';
export declare function types(): Pick<any, never>;
export declare const commandNames: string[];
export declare function help(): string;
export declare function handler(input: string[], opts: InstallCommandOptions & {
    allowNew?: boolean;
    update?: boolean;
    useBetaCli?: boolean;
}, invocation?: string): Promise<void>;

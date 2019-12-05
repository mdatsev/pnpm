import { UniversalOptions } from '@pnpm/config';
export declare function types(): {};
export declare const commandNames: string[];
export declare function help(): string;
export declare function handler(args: string[], opts: Pick<UniversalOptions, 'dir'> & {
    argv: {
        original: string[];
    };
    engineStrict?: boolean;
    workspaceDir?: string;
}, command: string): Promise<void>;

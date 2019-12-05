import { Config } from '@pnpm/config';
export declare function types(): Pick<any, never>;
export declare const commandNames: string[];
export declare function help(): string;
export declare function handler(args: string[], opts: Pick<Config, 'dir' | 'include'> & {
    alwaysPrintRootPackage?: boolean;
    depth?: number;
    lockfileDir?: string;
    long?: boolean;
    parseable?: boolean;
}, command: string): Promise<string>;
export declare function render(prefixes: string[], args: string[], opts: Pick<Config, 'include'> & {
    alwaysPrintRootPackage?: boolean;
    depth?: number;
    lockfileDir: string;
    long?: boolean;
    json?: boolean;
    parseable?: boolean;
}, command: string): Promise<string>;

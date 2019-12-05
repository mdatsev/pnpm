export declare function types(): Pick<any, never>;
export declare const commandNames: string[];
export declare function help(): string;
export declare function handler(args: string[], opts: {
    argv: {
        original: string[];
    };
    engineStrict?: boolean;
    workspaceDir?: string;
}, command: string): Promise<void>;
export declare function fakeRegularManifest(opts: {
    engineStrict?: boolean;
    dir: string;
    workspaceDir: string;
}, fn: () => Promise<void>): Promise<void>;

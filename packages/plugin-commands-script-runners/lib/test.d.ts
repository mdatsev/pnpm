export declare function types(): Pick<any, never>;
export declare const commandNames: string[];
export declare function help(): string;
export declare function handler(args: string[], opts: {
    extraBinPaths: string[];
    dir: string;
    rawConfig: object;
}): Promise<string | undefined>;

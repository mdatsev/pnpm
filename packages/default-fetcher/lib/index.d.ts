import { IgnoreFunction } from '@pnpm/tarball-fetcher';
export default function (opts: {
    alwaysAuth?: boolean;
    fsIsCaseSensitive?: boolean;
    registry: string;
    rawConfig: object;
    strictSsl?: boolean;
    proxy?: string;
    httpsProxy?: string;
    localAddress?: string;
    cert?: string;
    key?: string;
    ca?: string;
    fetchRetries?: number;
    fetchRetryFactor?: number;
    fetchRetryMintimeout?: number;
    fetchRetryMaxtimeout?: number;
    userAgent?: string;
    ignoreFile?: IgnoreFunction;
    offline?: boolean;
}): {
    git: (resolution: {
        repo: string;
        commit: string;
    }, targetFolder: string) => Promise<{
        filesIndex: any;
        tempLocation: string;
    }>;
    tarball: import("../../fetcher-base/lib").FetchFunction;
};

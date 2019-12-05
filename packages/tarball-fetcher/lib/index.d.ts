import { FetchFunction } from '@pnpm/fetcher-base';
export declare type IgnoreFunction = (filename: string) => boolean;
export default function (opts: {
    registry: string;
    rawConfig: object;
    alwaysAuth?: boolean;
    proxy?: string;
    httpsProxy?: string;
    localAddress?: string;
    cert?: string;
    key?: string;
    ca?: string;
    strictSsl?: boolean;
    fetchRetries?: number;
    fetchRetryFactor?: number;
    fetchRetryMintimeout?: number;
    fetchRetryMaxtimeout?: number;
    userAgent?: string;
    ignoreFile?: IgnoreFunction;
    offline?: boolean;
    fsIsCaseSensitive?: boolean;
}): {
    tarball: FetchFunction;
};

/// <reference types="node" />
import { FetchResult } from '@pnpm/fetcher-base';
import { IncomingMessage } from 'http';
export interface HttpResponse {
    body: string;
}
export declare type DownloadFunction = (url: string, saveto: string, opts: {
    auth?: {
        scope: string;
        token: string | undefined;
        password: string | undefined;
        username: string | undefined;
        email: string | undefined;
        auth: string | undefined;
        alwaysAuth: string | undefined;
    };
    unpackTo: string;
    registry?: string;
    onStart?: (totalSize: number | null, attempt: number) => void;
    onProgress?: (downloaded: number) => void;
    ignore?: (filename: string) => boolean;
    integrity?: string;
    generatePackageIntegrity?: boolean;
}) => Promise<FetchResult>;
export interface NpmRegistryClient {
    get: (url: string, getOpts: object, cb: (err: Error, data: object, raw: object, res: HttpResponse) => void) => void;
    fetch: (url: string, opts: {
        auth?: object;
    }, cb: (err: Error, res: IncomingMessage) => void) => void;
}
declare const _default: (gotOpts: {
    alwaysAuth: boolean;
    fsIsCaseSensitive: boolean;
    registry: string;
    proxy?: string | undefined;
    localAddress?: string | undefined;
    ca?: string | undefined;
    cert?: string | undefined;
    key?: string | undefined;
    strictSSL?: boolean | undefined;
    retry?: {
        retries?: number | undefined;
        factor?: number | undefined;
        minTimeout?: number | undefined;
        maxTimeout?: number | undefined;
        randomize?: boolean | undefined;
    } | undefined;
    userAgent?: string | undefined;
}) => DownloadFunction;
export default _default;

import { Response } from '@pnpm/fetch';
export declare type Auth = ({
    token: string;
} | {
    username: string;
    password: string;
} | {
    _auth: string;
}) & {
    token?: string;
    username?: string;
    password?: string;
    _auth?: string;
};
export default function (defaultOpts: {
    fullMetadata?: boolean;
    proxy?: string;
    localAddress?: string;
    ca?: string;
    cert?: string;
    key?: string;
    strictSSL?: boolean;
    retry?: {
        retries?: number;
        factor?: number;
        minTimeout?: number;
        maxTimeout?: number;
        randomize?: boolean;
    };
    userAgent?: string;
}): (url: string, opts?: {
    auth?: ({
        token: string;
    } & {
        token?: string | undefined;
        username?: string | undefined;
        password?: string | undefined;
        _auth?: string | undefined;
    }) | ({
        username: string;
        password: string;
    } & {
        token?: string | undefined;
        username?: string | undefined;
        password?: string | undefined;
        _auth?: string | undefined;
    }) | ({
        _auth: string;
    } & {
        token?: string | undefined;
        username?: string | undefined;
        password?: string | undefined;
        _auth?: string | undefined;
    }) | undefined;
} | undefined) => Promise<Response>;

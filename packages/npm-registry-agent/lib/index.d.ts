export default function getAgent(uri: string, opts: {
    localAddress?: string;
    strictSSL?: boolean;
    ca?: string;
    cert?: string;
    key?: string;
    maxSockets?: number;
    timeout?: number;
    proxy: string;
    noProxy: boolean;
}): any;

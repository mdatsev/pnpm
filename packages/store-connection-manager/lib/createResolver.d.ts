import { Config } from '@pnpm/config';
export declare type CreateResolverOptions = Pick<Config, 'ca' | 'cert' | 'fetchRetries' | 'fetchRetryFactor' | 'fetchRetryMaxtimeout' | 'fetchRetryMintimeout' | 'fetchRetryMintimeout' | 'httpsProxy' | 'key' | 'localAddress' | 'lockStaleDuration' | 'offline' | 'proxy' | 'rawConfig' | 'strictSsl' | 'userAgent' | 'verifyStoreIntegrity'> & Required<Pick<Config, 'storeDir'>>;
export default function (opts: CreateResolverOptions): import("@pnpm/default-resolver").ResolveFunction;

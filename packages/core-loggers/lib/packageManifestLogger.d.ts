import { LogBase } from '@pnpm/logger';
import { ImporterManifest } from '@pnpm/types';
export declare const packageManifestLogger: import("@pnpm/logger").Logger<PackageManifestMessage>;
export declare type PackageManifestMessage = {
    prefix: string;
} & ({
    initial: ImporterManifest;
} | {
    updated: ImporterManifest;
});
export declare type PackageManifestLog = {
    name: 'pnpm:package-manifest';
} & LogBase & PackageManifestMessage;

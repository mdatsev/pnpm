import { Registries } from '@pnpm/types';
export declare function isAbsolute(dependencyPath: string): boolean;
export declare function resolve(registries: Registries, resolutionLocation: string): string;
export declare function tryGetPackageId(registries: Registries, relDepPath: string): string | null;
export declare function refToAbsolute(reference: string, pkgName: string, registries: Registries): string | null;
export declare function getRegistryByPackageName(registries: Registries, packageName: string): string;
export declare function relative(registries: Registries, packageName: string, absoluteResolutionLoc: string): string;
export declare function refToRelative(reference: string, pkgName: string): string | null;
export declare function parse(dependencyPath: string): {
    host: string | undefined;
    isAbsolute: boolean;
    name: string | undefined;
    peersSuffix: string | undefined;
    version: string;
} | {
    host: string | undefined;
    isAbsolute: true;
    name?: undefined;
    peersSuffix?: undefined;
    version?: undefined;
};
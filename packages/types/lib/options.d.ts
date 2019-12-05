import { DependenciesField } from './misc';
import { ImporterManifest, PackageManifest } from './package';
export declare type LogBase = {
    level: 'debug' | 'error';
} | {
    level: 'info' | 'warn';
    prefix: string;
    message: string;
};
export declare type IncludedDependencies = {
    [dependenciesField in DependenciesField]: boolean;
};
export interface ReadPackageHook {
    (pkg: PackageManifest): PackageManifest;
    (pkg: ImporterManifest): ImporterManifest;
}
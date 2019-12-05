import * as logs from '@pnpm/core-loggers';
import most = require('most');
export interface PackageDiff {
    added: boolean;
    from?: string;
    name: string;
    realName?: string;
    version?: string;
    deprecated?: boolean;
    latest?: string;
}
export interface Map<T> {
    [index: string]: T;
}
export declare const propertyByDependencyType: {
    dev: string;
    nodeModulesOnly: string;
    optional: string;
    peer: string;
    prod: string;
};
export default function (log$: {
    deprecation: most.Stream<logs.DeprecationLog>;
    summary: most.Stream<logs.SummaryLog>;
    root: most.Stream<logs.RootLog>;
    packageManifest: most.Stream<logs.PackageManifestLog>;
}, opts: {
    prefix: string;
}): most.Stream<{
    dev: Map<PackageDiff>;
    nodeModulesOnly: Map<PackageDiff>;
    optional: Map<PackageDiff>;
    prod: Map<PackageDiff>;
}>;

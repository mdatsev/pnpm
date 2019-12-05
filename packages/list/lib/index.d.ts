import { DependenciesField, Registries } from '@pnpm/types';
export declare function forPackages(packages: string[], projectPaths: string[], maybeOpts: {
    alwaysPrintRootPackage?: boolean;
    depth?: number;
    lockfileDir: string;
    long?: boolean;
    include?: {
        [dependenciesField in DependenciesField]: boolean;
    };
    reportAs?: 'parseable' | 'tree' | 'json';
    registries?: Registries;
}): Promise<string>;
export default function (projectPaths: string[], maybeOpts: {
    alwaysPrintRootPackage?: boolean;
    depth?: number;
    lockfileDir: string;
    long?: boolean;
    include?: {
        [dependenciesField in DependenciesField]: boolean;
    };
    reportAs?: 'parseable' | 'tree' | 'json';
    registries?: Registries;
}): Promise<string>;

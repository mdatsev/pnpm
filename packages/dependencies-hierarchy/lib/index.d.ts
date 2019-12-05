import { DependenciesField, Registries } from '@pnpm/types';
export declare type SearchFunction = (pkg: {
    name: string;
    version: string;
}) => boolean;
export interface PackageNode {
    alias: string;
    circular?: true;
    dependencies?: PackageNode[];
    dev?: boolean;
    isPeer: boolean;
    isSkipped: boolean;
    isMissing: boolean;
    name: string;
    optional?: true;
    path: string;
    resolved?: string;
    searched?: true;
    version: string;
}
export declare type DependenciesHierarchy = {
    dependencies?: PackageNode[];
    devDependencies?: PackageNode[];
    optionalDependencies?: PackageNode[];
    unsavedDependencies?: PackageNode[];
};
export default function dependenciesHierarchy(projectPaths: string[], maybeOpts: {
    depth: number;
    include?: {
        [dependenciesField in DependenciesField]: boolean;
    };
    registries?: Registries;
    search?: SearchFunction;
    lockfileDir: string;
}): Promise<{
    [importerDir: string]: DependenciesHierarchy;
}>;

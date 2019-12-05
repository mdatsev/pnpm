import { DependenciesHierarchy } from 'dependencies-hierarchy';
export declare type PackageDependencyHierarchy = DependenciesHierarchy & {
    name?: string;
    version?: string;
    path: string;
};

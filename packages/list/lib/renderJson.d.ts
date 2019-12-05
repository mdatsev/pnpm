import { PackageNode } from 'dependencies-hierarchy';
import { PackageDependencyHierarchy } from './types';
export default function (pkgs: PackageDependencyHierarchy[], opts: {
    depth: number;
    long: boolean;
    search: boolean;
}): Promise<string>;
export declare function toJsonResult(entryNodes: PackageNode[], opts: {
    long: boolean;
}): Promise<{}>;

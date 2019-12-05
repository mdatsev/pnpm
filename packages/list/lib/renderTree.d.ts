import archy = require('archy');
import { PackageNode } from 'dependencies-hierarchy';
import { PackageDependencyHierarchy } from './types';
export default function (packages: Array<PackageDependencyHierarchy>, opts: {
    alwaysPrintRootPackage: boolean;
    depth: number;
    long: boolean;
    search: boolean;
}): Promise<string>;
declare type GetPkgColor = (node: PackageNode) => (s: string) => string;
export declare function toArchyTree(getPkgColor: GetPkgColor, entryNodes: PackageNode[], opts: {
    long: boolean;
    modules: string;
}): Promise<archy.Data[]>;
export {};

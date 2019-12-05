import { PackageDependencyHierarchy } from './types';
export default function (pkgs: PackageDependencyHierarchy[], opts: {
    long: boolean;
    depth: number;
    alwaysPrintRootPackage: boolean;
    search: boolean;
}): Promise<string>;

import { PackageNode } from 'pkgs-graph';
import { PackageSelector } from './parsePackageSelectors';
interface PackageGraph<T> {
    [id: string]: PackageNode<T>;
}
export declare function filterGraph<T>(pkgGraph: PackageGraph<T>, packageSelectors: PackageSelector[]): PackageGraph<T>;
export {};

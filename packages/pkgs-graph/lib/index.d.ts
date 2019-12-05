export declare type Manifest = {
    name: string;
    version: string;
    dependencies?: {
        [name: string]: string;
    };
    devDependencies?: {
        [name: string]: string;
    };
    optionalDependencies?: {
        [name: string]: string;
    };
};
export declare type Package = {
    manifest: Manifest;
    dir: string;
};
export declare type PackageNode<T> = {
    package: Package & T;
    dependencies: string[];
};
export default function <T>(pkgs: Array<Package & T>): {
    graph: {
        [id: string]: PackageNode<T>;
    };
    unmatched: Array<{
        pkgName: string;
        range: string;
    }>;
};

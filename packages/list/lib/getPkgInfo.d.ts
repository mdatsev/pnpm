export default function getPkgInfo(pkg: {
    alias: string;
    name: string;
    version: string;
    path: string;
    resolved?: string;
}): Promise<{
    alias: string;
    from: string;
    version: string;
    resolved: string | undefined;
    description: string | undefined;
    homepage: string | undefined;
    repository: string | undefined;
}>;

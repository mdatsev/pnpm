import { DirectoryResolution, ResolveResult, TarballResolution } from '@pnpm/resolver-base';
/**
 * Resolves a package hosted on the local filesystem
 */
export default function resolveLocal(wantedDependency: {
    pref: string;
}, opts: {
    importerDir: string;
    lockfileDir?: string;
}): Promise<(ResolveResult & Required<Pick<ResolveResult, 'normalizedPref'>> & ({
    resolution: TarballResolution;
} | ({
    resolution: DirectoryResolution;
} & Required<Pick<ResolveResult, 'manifest'>>))) | null>;

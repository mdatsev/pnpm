import { DependencyManifest, ImporterManifest } from '@pnpm/types';
export default function runLifecycleHook(stage: string, manifest: ImporterManifest | DependencyManifest, opts: {
    args?: string[];
    depPath: string;
    extraBinPaths?: string[];
    optional?: boolean;
    pkgRoot: string;
    rawConfig: object;
    rootNodeModulesDir: string;
    stdio?: string;
    unsafePerm: boolean;
}): Promise<any>;

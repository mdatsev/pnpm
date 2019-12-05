import { ImporterManifest } from '@pnpm/types';
export default function runLifecycleHooksConcurrently(stages: string[], importers: Array<{
    buildIndex: number;
    manifest: ImporterManifest;
    rootDir: string;
    modulesDir: string;
}>, childConcurrency: number, opts: {
    extraBinPaths?: string[];
    rawConfig: object;
    stdio?: string;
    unsafePerm: boolean;
}): Promise<void>;

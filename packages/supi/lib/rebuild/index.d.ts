import { ImporterManifest } from '@pnpm/types';
import { RebuildOptions } from './extendRebuildOptions';
export declare function rebuildPkgs(importers: Array<{
    manifest: ImporterManifest;
    rootDir: string;
}>, pkgSpecs: string[], maybeOpts: RebuildOptions): Promise<void>;
export declare function rebuild(importers: Array<{
    buildIndex: number;
    manifest: ImporterManifest;
    rootDir: string;
}>, maybeOpts: RebuildOptions): Promise<void>;

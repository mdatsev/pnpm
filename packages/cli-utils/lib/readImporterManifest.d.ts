import { ImporterManifest } from '@pnpm/types';
export declare function readImporterManifest(importerDir: string, opts: {
    engineStrict?: boolean;
}): Promise<{
    fileName: string;
    manifest: ImporterManifest;
    writeImporterManifest: (manifest: ImporterManifest, force?: boolean) => Promise<void>;
}>;
export declare function readImporterManifestOnly(importerDir: string, opts: {
    engineStrict?: boolean;
}): Promise<ImporterManifest>;
export declare function tryReadImporterManifest(importerDir: string, opts: {
    engineStrict?: boolean;
}): Promise<{
    fileName: string;
    manifest: ImporterManifest | null;
    writeImporterManifest: (manifest: ImporterManifest, force?: boolean) => Promise<void>;
}>;

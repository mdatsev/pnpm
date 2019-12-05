import { ImporterManifest } from '@pnpm/types';
declare type WriteImporterManifest = (manifest: ImporterManifest, force?: boolean) => Promise<void>;
export default function readImporterManifest(importerDir: string): Promise<{
    fileName: string;
    manifest: ImporterManifest;
    writeImporterManifest: WriteImporterManifest;
}>;
export declare function readImporterManifestOnly(importerDir: string): Promise<ImporterManifest>;
export declare function tryReadImporterManifest(importerDir: string): Promise<{
    fileName: string;
    manifest: ImporterManifest | null;
    writeImporterManifest: WriteImporterManifest;
}>;
export declare function readExactImporterManifest(manifestPath: string): Promise<{
    manifest: ImporterManifest;
    writeImporterManifest: WriteImporterManifest;
}>;
export {};

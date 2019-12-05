import { ImporterManifest } from '@pnpm/types';
export default function writeImporterManifest(filePath: string, manifest: ImporterManifest, opts?: {
    indent?: string | number | undefined;
}): Promise<void>;

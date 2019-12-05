import { DependenciesField, ImporterManifest } from '@pnpm/types';
export default function (packageManifest: ImporterManifest, removedPackages: string[], opts: {
    saveType?: DependenciesField;
    prefix: string;
}): Promise<ImporterManifest>;

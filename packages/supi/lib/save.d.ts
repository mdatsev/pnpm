import { DependenciesField, ImporterManifest } from '@pnpm/types';
export declare type PackageSpecObject = {
    alias: string;
    peer?: boolean;
    pref?: string;
    saveType?: DependenciesField;
};
export default function save(prefix: string, packageManifest: ImporterManifest, packageSpecs: Array<PackageSpecObject>, opts?: {
    dryRun?: boolean;
}): Promise<ImporterManifest>;
export declare function guessDependencyType(alias: string, manifest: ImporterManifest): DependenciesField | undefined;

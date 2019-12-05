import { Modules, Project } from '@pnpm/assert-project';
import { ImporterManifest } from '@pnpm/types';
import { Test } from 'tape';
export { Modules, Project };
export declare type ManifestFormat = 'JSON' | 'JSON5' | 'YAML';
export declare function tempDir(t: Test): string;
export declare function preparePackages(t: Test, pkgs: Array<{
    location: string;
    package: ImporterManifest;
} | ImporterManifest>, opts?: {
    manifestFormat?: ManifestFormat;
    tempDir?: string;
}): {
    [name: string]: Project;
};
export default function prepare(test: Test, manifest?: ImporterManifest, opts?: {
    manifestFormat?: ManifestFormat;
    tempDir?: string;
}): Project;
export declare function prepareEmpty(t: Test): Project;

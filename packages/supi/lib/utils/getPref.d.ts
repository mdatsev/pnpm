import { ResolvedDirectDependency } from '@pnpm/resolve-dependencies';
import { ImporterToUpdate } from '../install';
import { PinnedVersion } from '../install/getWantedDependencies';
export declare function updateImporterManifest(importer: ImporterToUpdate, opts: {
    directDependencies: ResolvedDirectDependency[];
    saveWorkspaceProtocol: boolean;
}): Promise<import("@pnpm/types").ImporterManifest>;
export default function getPref(alias: string, name: string, version: string, opts: {
    pinnedVersion?: PinnedVersion;
}): string;

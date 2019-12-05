import { DependencyManifest, ImporterManifest } from '@pnpm/types';
interface WorkspaceDependencyPackage {
    dir: string;
    manifest: DependencyManifest;
    writeImporterManifest(manifest: ImporterManifest, force?: boolean | undefined): Promise<void>;
}
declare const _default: (workspaceRoot: string, opts: {
    engineStrict?: boolean | undefined;
}) => Promise<WorkspaceDependencyPackage[]>;
export default _default;
export declare function arrayOfLocalPackagesToMap(pkgs: Array<{
    dir: string;
    manifest: DependencyManifest;
}>): {};

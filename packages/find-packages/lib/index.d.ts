import { ImporterManifest } from '@pnpm/types';
declare namespace findPkgs {
    interface Options {
        ignore?: string[];
        includeRoot?: boolean;
        patterns?: string[];
    }
    interface WorkspacePackage {
        dir: string;
        manifest: ImporterManifest;
        writeImporterManifest(manifest: ImporterManifest, force?: boolean | undefined): Promise<void>;
    }
}
declare function findPkgs(root: string, opts?: findPkgs.Options): Promise<findPkgs.WorkspacePackage[]>;
export = findPkgs;

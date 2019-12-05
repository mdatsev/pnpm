import { ImportPackageFunction, PackageFilesResponse } from '@pnpm/store-controller-types';
declare const _default: (packageImportMethod?: "auto" | "copy" | "hardlink" | "clone" | undefined) => ImportPackageFunction;
export default _default;
export declare function copyPkg(from: string, to: string, opts: {
    filesResponse: PackageFilesResponse;
    force: boolean;
}): Promise<void>;

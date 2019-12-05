import { Test } from 'tape';
declare const _default: (t: Test, storePath: string | Promise<string>, encodedRegistryName?: string | undefined) => {
    storeHas(pkgName: string, version?: string | undefined): Promise<void>;
    storeHasNot(pkgName: string, version?: string | undefined): Promise<void>;
    resolve(pkgName: string, version?: string | undefined, relativePath?: string | undefined): Promise<string>;
};
export default _default;

/// <reference types="node" />
import { Lockfile, LockfileImporter } from '@pnpm/lockfile-types';
import { Modules } from '@pnpm/modules-yaml';
import { Test } from 'tape';
import isExecutable from './isExecutable';
export { isExecutable, Modules };
export declare type RawLockfile = Lockfile & Partial<LockfileImporter>;
export interface Project {
    requireModule: NodeRequireFunction;
    has(pkgName: string): Promise<void>;
    hasNot(pkgName: string): Promise<void>;
    getStorePath(): Promise<string>;
    resolve(pkgName: string, version?: string, relativePath?: string): Promise<string>;
    storeHas(pkgName: string, version?: string): Promise<string>;
    storeHasNot(pkgName: string, version?: string): Promise<void>;
    isExecutable(pathToExe: string): Promise<void>;
    /**
     * TODO: Remove the `Required<T>` cast.
     *
     * https://github.com/microsoft/TypeScript/pull/32695 might help with this.
     */
    readCurrentLockfile(): Promise<Required<RawLockfile>>;
    readModulesManifest(): Promise<Modules | null>;
    /**
     * TODO: Remove the `Required<T>` cast.
     *
     * https://github.com/microsoft/TypeScript/pull/32695 might help with this.
     */
    readLockfile(): Promise<Required<RawLockfile>>;
    writePackageJson(pkgJson: object): Promise<void>;
}
declare const _default: (t: Test, projectPath: string, encodedRegistryName?: string | undefined) => Project;
export default _default;

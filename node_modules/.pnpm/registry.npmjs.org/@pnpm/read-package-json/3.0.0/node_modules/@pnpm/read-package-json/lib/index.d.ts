import { PackageManifest } from '@pnpm/types';
export default function readPkg(pkgPath: string): Promise<PackageManifest>;
export declare function fromDir(pkgPath: string): Promise<PackageManifest>;

import { PackageManifest } from '@pnpm/types';
export default function safeReadPkg(pkgPath: string): Promise<PackageManifest | null>;
export declare function fromDir(pkgPath: string): Promise<PackageManifest | null>;

export * from '@pnpm/lockfile-types';
import nameVerFromPkgSnapshot from './nameVerFromPkgSnapshot';
import packageIdFromSnapshot from './packageIdFromSnapshot';
import packageIsIndependent from './packageIsIndependent';
import pkgSnapshotToResolution from './pkgSnapshotToResolution';
import satisfiesPackageManifest from './satisfiesPackageManifest';
export { nameVerFromPkgSnapshot, packageIdFromSnapshot, packageIsIndependent, pkgSnapshotToResolution, satisfiesPackageManifest, };
import { refToRelative } from 'dependency-path';
export declare const getPkgShortId: typeof refToRelative;

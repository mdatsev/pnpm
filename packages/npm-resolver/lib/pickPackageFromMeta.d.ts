import { RegistryPackageSpec } from './parsePref';
import { PackageInRegistry, PackageMeta } from './pickPackage';
export default function (spec: RegistryPackageSpec, preferredVersionSelector: {
    selector: string;
    type: 'version' | 'range' | 'tag';
} | undefined, meta: PackageMeta): PackageInRegistry;

import { DependenciesField } from '@pnpm/types';
export default function symlinkDirectRootDependency(dependencyLocation: string, destModulesDir: string, importAs: string, opts: {
    fromDependenciesField?: DependenciesField;
    linkedPackage: {
        name: string;
        version: string;
    };
    prefix: string;
}): Promise<void>;

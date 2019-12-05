export default function symlinkDependency(dependencyRealLocation: string, destModulesDir: string, importAs: string): Promise<{
    reused: Boolean;
    warn?: string | undefined;
}>;
import symlinkDirectRootDependency from './symlinkDirectRootDependency';
export { symlinkDirectRootDependency };

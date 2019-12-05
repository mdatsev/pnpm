import { DependenciesField } from '@pnpm/types';
export default function removeDirectDependency(dependency: {
    dependenciesField?: DependenciesField | undefined;
    name: string;
}, opts: {
    binsDir: string;
    dryRun?: boolean;
    modulesDir: string;
    muteLogs?: boolean;
    rootDir: string;
}): Promise<void>;

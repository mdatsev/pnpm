import { Modules } from '@pnpm/modules-yaml';
import { DependenciesField, Registries } from '@pnpm/types';
export interface ImporterOptions {
    binsDir?: string;
    rootDir: string;
}
export default function <T>(importers: (ImporterOptions & T)[], lockfileDir: string): Promise<{
    currentHoistPattern?: string[];
    hoist?: boolean;
    hoistedAliases: {
        [depPath: string]: string[];
    };
    importers: Array<{
        id: string;
        modulesDir: string;
    } & T & Required<ImporterOptions>>;
    include: Record<DependenciesField, boolean>;
    independentLeaves: boolean | undefined;
    modules: Modules | null;
    pendingBuilds: string[];
    registries: Registries | null | undefined;
    rootModulesDir: string;
    shamefullyHoist?: boolean;
    skipped: Set<string>;
}>;

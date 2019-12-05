import { DependenciesField, Registries } from '@pnpm/types';
export declare type IncludedDependencies = {
    [dependenciesField in DependenciesField]: boolean;
};
export interface Modules {
    hoistedAliases: {
        [depPath: string]: string[];
    };
    hoistPattern?: string[];
    included: IncludedDependencies;
    independentLeaves: boolean;
    layoutVersion: number;
    packageManager: string;
    pendingBuilds: string[];
    registries?: Registries;
    shamefullyHoist: boolean;
    skipped: string[];
    store: string;
    virtualStoreDir: string;
}
export declare function read(modulesDir: string): Promise<Modules | null>;
export declare function write(modulesDir: string, modules: Modules & {
    registries: Registries;
}): Promise<void>;

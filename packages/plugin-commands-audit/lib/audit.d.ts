import { UniversalOptions } from '@pnpm/config';
import { IncludedDependencies, Registries } from '@pnpm/types';
export declare function types(): Pick<any, never>;
export declare const commandNames: string[];
export declare function help(): string;
export declare function handler(args: string[], opts: Pick<UniversalOptions, 'dir'> & {
    auditLevel?: 'low' | 'moderate' | 'high' | 'critical';
    include: IncludedDependencies;
    json?: boolean;
    lockfileDir?: string;
    registries: Registries;
}, command: string): Promise<string>;

import { Config, UniversalOptions } from './Config';
export { Config, UniversalOptions };
export declare const types: any;
declare const _default: (opts: {
    cliArgs: Record<string, any>;
    command?: string[] | undefined;
    packageManager: {
        name: string;
        version: string;
    };
}) => Promise<{
    config: Config;
    warnings: string[];
}>;
export default _default;
export declare function findWorkspacePrefix(prefix: string): Promise<string | undefined>;

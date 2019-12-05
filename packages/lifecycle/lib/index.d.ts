import runLifecycleHook from './runLifecycleHook';
import runLifecycleHooksConcurrently from './runLifecycleHooksConcurrently';
export default runLifecycleHook;
export { runLifecycleHooksConcurrently };
export declare function runPostinstallHooks(opts: {
    depPath: string;
    extraBinPaths?: string[];
    optional?: boolean;
    pkgRoot: string;
    prepare?: boolean;
    rawConfig: object;
    rootNodeModulesDir: string;
    unsafePerm: boolean;
}): Promise<boolean>;

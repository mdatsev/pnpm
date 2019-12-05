/// <reference types="node" />
export default function runNpm(args: string[]): import("child_process").SpawnSyncReturns<Buffer>;
export declare function runScriptSync(command: string, args: string[], opts: {
    cwd: string;
    stdio: string;
    userAgent?: string;
}): import("child_process").SpawnSyncReturns<Buffer>;

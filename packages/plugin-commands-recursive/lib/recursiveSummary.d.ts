interface ActionFailure {
    prefix: string;
    message: string;
    error: Error;
}
interface RecursiveSummary {
    fails: ActionFailure[];
    passes: number;
}
export default RecursiveSummary;
export declare function throwOnCommandFail(command: string, recursiveSummary: RecursiveSummary): void;

import { PackageNode } from 'pkgs-graph';
import RecursiveSummary from './recursiveSummary';
declare const _default: <T>(packageChunks: string[][], graph: {
    [id: string]: PackageNode<T>;
}, args: string[], cmd: string, opts: {
    bail: boolean;
    workspaceConcurrency: number;
    unsafePerm: boolean;
    rawConfig: object;
}) => Promise<RecursiveSummary>;
export default _default;

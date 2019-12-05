import { PackageNode } from 'pkgs-graph';
import RecursiveSummary from './recursiveSummary';
declare const _default: <T>(packageChunks: string[][], graph: {
    [id: string]: PackageNode<T>;
}, args: string[], cmd: string, opts: {
    bail: boolean;
    extraBinPaths: string[];
    workspaceConcurrency: number;
    unsafePerm: boolean;
    rawConfig: object;
    workspaceDir: string;
    allPackagesAreSelected: boolean;
}) => Promise<RecursiveSummary>;
export default _default;

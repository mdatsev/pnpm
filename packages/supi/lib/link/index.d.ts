import { ImporterManifest } from '@pnpm/types';
import { LinkOptions } from './options';
export default function link(linkFromPkgs: Array<{
    alias: string;
    path: string;
} | string>, destModules: string, maybeOpts: LinkOptions & {
    linkToBin?: string;
    dir: string;
}): Promise<ImporterManifest>;
export declare function linkFromGlobal(pkgNames: string[], linkTo: string, maybeOpts: LinkOptions & {
    globalDir: string;
}): Promise<ImporterManifest>;
export declare function linkToGlobal(linkFrom: string, maybeOpts: LinkOptions & {
    globalBin: string;
    globalDir: string;
}): Promise<ImporterManifest>;

import { Config } from '@pnpm/config';
import { ImporterManifest } from '@pnpm/types';
declare const _default: (pkgs: {
    dir: string;
    manifest: ImporterManifest;
}[], args: string[], cmd: string, opts: Config & {
    depth?: number | undefined;
    long?: boolean | undefined;
    parseable?: boolean | undefined;
    lockfileDir?: string | undefined;
}) => Promise<string>;
export default _default;

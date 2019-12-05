import { OutdatedOptions } from '@pnpm/plugin-commands-outdated/lib/outdated';
import { ImporterManifest } from '@pnpm/types';
declare const _default: (pkgs: {
    dir: string;
    manifest: ImporterManifest;
}[], args: string[], cmd: string, opts: OutdatedOptions) => Promise<string>;
export default _default;

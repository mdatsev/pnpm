import { Modules } from '@pnpm/modules-yaml';
export default function checkCompatibility(modules: Modules, opts: {
    storeDir: string;
    modulesDir: string;
    virtualStoreDir: string;
}): void;

import { Resolution } from '@pnpm/resolver-base';
import { Registries } from '@pnpm/types';
export declare function absolutePathToRef(absolutePath: string, opts: {
    alias: string;
    realName: string;
    registries: Registries;
    resolution: Resolution;
}): string;

import { Registries } from '@pnpm/types';
export declare const DEFAULT_REGISTRIES: {
    default: string;
};
export default function normalizeRegistries(registries?: {
    [scope: string]: string;
}): Registries;

import { Dependencies } from '@pnpm/types';
import { WantedDependency } from './install/getWantedDependencies';
export default function parseWantedDependencies(rawWantedDependencies: string[], opts: {
    allowNew: boolean;
    currentPrefs: Dependencies;
    defaultTag: string;
    dev: boolean;
    devDependencies: Dependencies;
    optional: boolean;
    optionalDependencies: Dependencies;
    updateWorkspaceDependencies?: boolean;
}): WantedDependency[];
export declare function parseWantedDependency(rawWantedDependency: string): {
    alias: string;
} | {
    pref: string;
} | {
    alias: string;
    pref: string;
};

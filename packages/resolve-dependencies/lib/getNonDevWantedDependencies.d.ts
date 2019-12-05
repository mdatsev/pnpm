import { DependencyManifest } from '@pnpm/types';
export interface WantedDependency {
    alias: string;
    pref: string;
    dev: boolean;
    optional: boolean;
}
export default function getNonDevWantedDependencies(pkg: DependencyManifest): WantedDependency[];

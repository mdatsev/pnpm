import { LocalPackages } from '@pnpm/resolver-base';
import { WantedDependency } from './getNonDevWantedDependencies';
export default function wantedDepIsLocallyAvailable(localPackages: LocalPackages, wantedDependency: WantedDependency, opts: {
    defaultTag: string;
    registry: string;
}): boolean;

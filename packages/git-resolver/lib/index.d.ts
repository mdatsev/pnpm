import { ResolveResult } from '@pnpm/resolver-base';
import { HostedPackageSpec } from './parsePref';
export { HostedPackageSpec };
export default function (opts: {}): (wantedDependency: {
    pref: string;
}) => Promise<ResolveResult | null>;

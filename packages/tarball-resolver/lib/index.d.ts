import { ResolveResult } from '@pnpm/resolver-base';
export default function resolveTarball(wantedDependency: {
    pref: string;
}): Promise<ResolveResult | null>;

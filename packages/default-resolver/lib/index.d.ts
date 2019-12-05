import { PackageMeta, PackageMetaCache, ResolverFactoryOptions } from '@pnpm/npm-resolver';
import { ResolveFunction } from '@pnpm/resolver-base';
export { PackageMeta, PackageMetaCache, ResolveFunction, ResolverFactoryOptions, };
export default function createResolver(pnpmOpts: ResolverFactoryOptions): ResolveFunction;

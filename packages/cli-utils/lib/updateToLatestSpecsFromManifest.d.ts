import { ImporterManifest, IncludedDependencies } from '@pnpm/types';
export declare function updateToLatestSpecsFromManifest(manifest: ImporterManifest, include: IncludedDependencies): string[];
export declare function createLatestSpecs(specs: string[], manifest: ImporterManifest): string[];

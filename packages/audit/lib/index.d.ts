import { Lockfile } from '@pnpm/lockfile-types';
import { DependenciesField } from '@pnpm/types';
import { AuditReport } from './types';
export * from './types';
export default function audit(lockfile: Lockfile, opts: {
    include?: {
        [dependenciesField in DependenciesField]: boolean;
    };
    registry: string;
}): Promise<AuditReport>;

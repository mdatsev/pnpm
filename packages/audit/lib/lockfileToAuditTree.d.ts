import { Lockfile } from '@pnpm/lockfile-types';
import { DependenciesField } from '@pnpm/types';
export declare type AuditNode = {
    version?: string;
    integrity?: string;
    requires?: Record<string, string>;
    dependencies?: {
        [name: string]: AuditNode;
    };
    dev: boolean;
};
export declare type AuditTree = AuditNode & {
    name?: string;
    install: Array<string>;
    remove: Array<string>;
    metadata: Object;
};
export default function lockfileToAuditTree(lockfile: Lockfile, opts?: {
    include?: {
        [dependenciesField in DependenciesField]: boolean;
    };
}): AuditTree;

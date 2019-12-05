import { Config } from '@pnpm/config';
import { DeprecationLog, PackageManifestLog, RootLog, SummaryLog } from '@pnpm/core-loggers';
import most = require('most');
declare const _default: (log$: {
    deprecation: most.Stream<DeprecationLog>;
    summary: most.Stream<SummaryLog>;
    root: most.Stream<RootLog>;
    packageManifest: most.Stream<PackageManifestLog>;
}, opts: {
    cwd: string;
    pnpmConfig?: Config | undefined;
}) => most.Stream<most.Stream<{
    msg: string;
}>>;
export default _default;

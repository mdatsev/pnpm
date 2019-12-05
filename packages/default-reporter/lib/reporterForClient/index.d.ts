import { Config } from '@pnpm/config';
import * as logs from '@pnpm/core-loggers';
import most = require('most');
export default function (log$: {
    fetchingProgress: most.Stream<logs.FetchingProgressLog>;
    progress: most.Stream<logs.ProgressLog>;
    stage: most.Stream<logs.StageLog>;
    deprecation: most.Stream<logs.DeprecationLog>;
    summary: most.Stream<logs.SummaryLog>;
    lifecycle: most.Stream<logs.LifecycleLog>;
    stats: most.Stream<logs.StatsLog>;
    installCheck: most.Stream<logs.InstallCheckLog>;
    registry: most.Stream<logs.RegistryLog>;
    root: most.Stream<logs.RootLog>;
    packageManifest: most.Stream<logs.PackageManifestLog>;
    link: most.Stream<logs.LinkLog>;
    other: most.Stream<logs.Log>;
    hook: most.Stream<logs.HookLog>;
    scope: most.Stream<logs.ScopeLog>;
    skippedOptionalDependency: most.Stream<logs.SkippedOptionalDependencyLog>;
}, opts: {
    isRecursive: boolean;
    cmd: string;
    subCmd?: string;
    width?: number;
    appendOnly?: boolean;
    throttleProgress?: number;
    pnpmConfig?: Config;
}): Array<most.Stream<most.Stream<{
    msg: string;
}>>>;

import { SkippedOptionalDependencyLog } from '@pnpm/core-loggers';
import most = require('most');
declare const _default: (skippedOptionalDependency$: most.Stream<SkippedOptionalDependencyLog>, opts: {
    cwd: string;
}) => most.Stream<most.Stream<{
    msg: string;
}>>;
export default _default;

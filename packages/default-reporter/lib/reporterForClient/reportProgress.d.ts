import { ProgressLog, StageLog } from '@pnpm/core-loggers';
import most = require('most');
declare const _default: (log$: {
    progress: most.Stream<ProgressLog>;
    stage: most.Stream<StageLog>;
}, opts: {
    cwd: string;
    throttleProgress?: number | undefined;
}) => most.Stream<most.Stream<any>>;
export default _default;

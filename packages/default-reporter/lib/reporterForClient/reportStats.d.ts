import { StatsLog } from '@pnpm/core-loggers';
import most = require('most');
declare const _default: (log$: {
    stats: most.Stream<StatsLog>;
}, opts: {
    cmd: string;
    cwd: string;
    isRecursive: boolean;
    subCmd?: string | undefined;
    width: number;
}) => most.Stream<most.Stream<{
    msg: string;
}>>[];
export default _default;

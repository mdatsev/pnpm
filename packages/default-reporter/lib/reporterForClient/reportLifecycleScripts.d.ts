import { LifecycleLog } from '@pnpm/core-loggers';
import most = require('most');
declare const _default: (log$: {
    lifecycle: most.Stream<LifecycleLog>;
}, opts: {
    appendOnly?: boolean | undefined;
    cwd: string;
    width: number;
}) => most.Stream<most.Stream<{
    msg: string;
}>>;
export default _default;

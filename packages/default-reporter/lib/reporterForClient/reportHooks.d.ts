import { HookLog } from '@pnpm/core-loggers';
import most = require('most');
declare const _default: (hook$: most.Stream<HookLog>, opts: {
    cwd: string;
    isRecursive: boolean;
}) => most.Stream<most.Stream<{
    msg: string;
}>>;
export default _default;

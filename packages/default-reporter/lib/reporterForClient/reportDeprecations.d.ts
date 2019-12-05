import { DeprecationLog } from '@pnpm/core-loggers';
import most = require('most');
declare const _default: (deprecation$: most.Stream<DeprecationLog>, opts: {
    cwd: string;
    isRecursive: boolean;
}) => most.Stream<most.Stream<{
    msg: string;
}>>;
export default _default;

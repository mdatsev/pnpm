import { ScopeLog } from '@pnpm/core-loggers';
import most = require('most');
declare const _default: (scope$: most.Stream<ScopeLog>, opts: {
    isRecursive: boolean;
    cmd: string;
    subCmd?: string | undefined;
}) => most.Stream<any>;
export default _default;

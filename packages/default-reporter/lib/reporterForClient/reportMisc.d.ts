import { Log, RegistryLog } from '@pnpm/core-loggers';
import most = require('most');
declare const _default: (log$: {
    registry: most.Stream<RegistryLog>;
    other: most.Stream<Log>;
}, opts: {
    cwd: string;
    zoomOutCurrent: boolean;
}) => most.Stream<most.Stream<{
    msg: any;
}>>;
export default _default;

import { InstallCheckLog } from '@pnpm/core-loggers';
import most = require('most');
declare const _default: (installCheck$: most.Stream<InstallCheckLog>, opts: {
    cwd: string;
}) => most.Stream<most.Stream<{
    msg: string;
}>>;
export default _default;

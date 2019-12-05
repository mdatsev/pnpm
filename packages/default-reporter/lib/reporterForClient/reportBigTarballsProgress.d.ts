import { FetchingProgressLog } from '@pnpm/core-loggers';
import most = require('most');
declare const _default: (log$: {
    fetchingProgress: most.Stream<FetchingProgressLog>;
}) => most.Stream<most.Stream<{
    fixed: boolean;
    msg: string;
}>>;
export default _default;

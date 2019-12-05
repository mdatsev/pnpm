import BreakingChangeError from './BreakingChangeError';
import ErrorRelatedSources from './ErrorRelatedSources';
export declare type ModulesBreakingChangeErrorOptions = ErrorRelatedSources & {
    modulesPath: string;
};
export default class ModulesBreakingChangeError extends BreakingChangeError {
    modulesPath: string;
    constructor(opts: ModulesBreakingChangeErrorOptions);
}

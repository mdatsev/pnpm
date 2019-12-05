import PnpmError from '@pnpm/error';
import ErrorRelatedSources from './ErrorRelatedSources';
export declare type BreakingChangeErrorOptions = ErrorRelatedSources & {
    code: string;
    message: string;
};
export default class BreakingChangeError extends PnpmError {
    relatedIssue?: number;
    relatedPR?: number;
    additionalInformation?: string;
    constructor(opts: BreakingChangeErrorOptions);
}

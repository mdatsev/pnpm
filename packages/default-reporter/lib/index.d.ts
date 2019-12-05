import { Config } from '@pnpm/config';
import most = require('most');
export default function (opts: {
    streamParser: object;
    reportingOptions?: {
        appendOnly?: boolean;
        throttleProgress?: number;
        outputMaxWidth?: number;
    };
    context: {
        argv: string[];
        config?: Config;
    };
}): void;
export declare function toOutput$(opts: {
    streamParser: object;
    reportingOptions?: {
        appendOnly?: boolean;
        throttleProgress?: number;
        outputMaxWidth?: number;
    };
    context: {
        argv: string[];
        config?: Config;
    };
}): most.Stream<string>;

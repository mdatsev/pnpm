"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const default_reporter_1 = require("@pnpm/default-reporter");
const logger_1 = require("@pnpm/logger");
const silentReporter_1 = require("./silentReporter");
exports.default = (reporterType, opts) => {
    switch (reporterType) {
        case 'default':
            default_reporter_1.default({
                context: {
                    argv: opts.subCmd ? [opts.cmd, opts.subCmd] : [opts.cmd],
                    config: opts.config,
                },
                reportingOptions: {
                    appendOnly: false,
                    throttleProgress: 200,
                },
                streamParser: logger_1.streamParser,
            });
            return;
        case 'append-only':
            default_reporter_1.default({
                context: {
                    argv: opts.subCmd ? [opts.cmd, opts.subCmd] : [opts.cmd],
                    config: opts.config,
                },
                reportingOptions: {
                    appendOnly: true,
                    throttleProgress: 1000,
                },
                streamParser: logger_1.streamParser,
            });
            return;
        case 'ndjson':
            logger_1.writeToConsole();
            return;
        case 'silent':
            silentReporter_1.default(logger_1.streamParser);
            return;
    }
};

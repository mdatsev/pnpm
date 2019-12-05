"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chalk = require("chalk");
const reportError_1 = require("./reportError");
function default_1(log$) {
    log$.subscribe({
        complete: () => undefined,
        error: () => undefined,
        next(log) {
            if (log.name === 'pnpm:fetching-progress') {
                console.log(`${chalk.cyan(`fetching_${log.status}`)} ${log.packageId}`);
                return;
            }
            switch (log.level) {
                case 'warn':
                    console.log(formatWarn(log['message']));
                    return;
                case 'error':
                    console.log(reportError_1.default(log));
                    return;
                case 'debug':
                    return;
                default:
                    console.log(log['message']);
                    return;
            }
        },
    });
}
exports.default = default_1;
function formatWarn(message) {
    // The \u2009 is the "thin space" unicode character
    // It is used instead of ' ' because chalk (as of version 2.1.0)
    // trims whitespace at the beginning
    return `${chalk.bgYellow.black('\u2009WARN\u2009')} ${message}`;
}
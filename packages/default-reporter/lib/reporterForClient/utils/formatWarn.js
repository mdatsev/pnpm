"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chalk = require("chalk");
function formatWarn(message) {
    // The \u2009 is the "thin space" unicode character
    // It is used instead of ' ' because chalk (as of version 2.1.0)
    // trims whitespace at the beginning
    return `${chalk.bgYellow.black('\u2009WARN\u2009')} ${message}`;
}
exports.default = formatWarn;

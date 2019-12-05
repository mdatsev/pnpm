"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = require("@pnpm/logger");
function err(error) {
    // bole passes only the name, message and stack of an error
    // that is why we pass error as a message as well, to pass
    // any additional info
    logger_1.default.error(error, error);
    process.exit(1);
}
exports.default = err;
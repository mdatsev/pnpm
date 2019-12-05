"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = require("@pnpm/logger");
async function default_1(opts) {
    var _a;
    const reporter = (_a = opts) === null || _a === void 0 ? void 0 : _a.reporter;
    if (reporter) {
        logger_1.streamParser.on('data', reporter);
    }
    await opts.storeController.prune();
    await opts.storeController.saveState();
    await opts.storeController.close();
    if (reporter) {
        logger_1.streamParser.removeListener('data', reporter);
    }
}
exports.default = default_1;

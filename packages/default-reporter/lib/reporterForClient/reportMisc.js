"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const most = require("most");
const os = require("os");
const reportError_1 = require("../reportError");
const formatWarn_1 = require("./utils/formatWarn");
const zooming_1 = require("./utils/zooming");
exports.default = (log$, opts) => {
    return most.merge(log$.registry, log$.other)
        .filter((obj) => obj.level !== 'debug' && (obj.level !== 'info' || !obj['prefix'] || obj['prefix'] === opts.cwd))
        .map((obj) => {
        var _a;
        switch (obj.level) {
            case 'warn':
                return zooming_1.autozoom(opts.cwd, obj.prefix, formatWarn_1.default(obj.message), opts);
            case 'error':
                if (((_a = obj['message']) === null || _a === void 0 ? void 0 : _a['prefix']) && obj['message']['prefix'] !== opts.cwd) {
                    return `${obj['message']['prefix']}:` + os.EOL + reportError_1.default(obj);
                }
                return reportError_1.default(obj);
            default:
                return obj['message'];
        }
    })
        .map((msg) => ({ msg }))
        .map(most.of);
};
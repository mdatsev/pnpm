"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const most = require("most");
const formatWarn_1 = require("./utils/formatWarn");
const zooming_1 = require("./utils/zooming");
exports.default = (installCheck$, opts) => {
    return installCheck$
        .map(formatInstallCheck.bind(null, opts.cwd))
        .filter(Boolean)
        .map((msg) => ({ msg }))
        .map(most.of);
};
function formatInstallCheck(currentPrefix, logObj, opts) {
    var _a, _b;
    const zoomOutCurrent = (_b = (_a = opts) === null || _a === void 0 ? void 0 : _a.zoomOutCurrent, (_b !== null && _b !== void 0 ? _b : false));
    switch (logObj.code) {
        case 'EBADPLATFORM':
            return zooming_1.autozoom(currentPrefix, logObj['prefix'], formatWarn_1.default(`Unsupported system. Skipping dependency ${logObj.pkgId}`), { zoomOutCurrent });
        case 'ENOTSUP':
            return zooming_1.autozoom(currentPrefix, logObj['prefix'], logObj.toString(), { zoomOutCurrent });
        default:
            return;
    }
}

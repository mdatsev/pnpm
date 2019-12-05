"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rightPad = require("right-pad");
const outputConstants_1 = require("../outputConstants");
const formatPrefix_1 = require("./formatPrefix");
function autozoom(currentPrefix, logPrefix, line, opts) {
    if (!logPrefix || !opts.zoomOutCurrent && currentPrefix === logPrefix) {
        return line;
    }
    return zoomOut(currentPrefix, logPrefix, line);
}
exports.autozoom = autozoom;
function zoomOut(currentPrefix, logPrefix, line) {
    return `${rightPad(formatPrefix_1.default(currentPrefix, logPrefix), outputConstants_1.PREFIX_MAX_LENGTH)} | ${line}`;
}
exports.zoomOut = zoomOut;
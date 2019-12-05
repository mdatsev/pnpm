"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chalk = require("chalk");
const most = require("most");
const zooming_1 = require("./utils/zooming");
exports.default = (hook$, opts) => {
    return hook$
        .map((log) => ({
        msg: zooming_1.autozoom(opts.cwd, log.prefix, `${chalk.magentaBright(log.hook)}: ${log.message}`, {
            zoomOutCurrent: opts.isRecursive,
        }),
    }))
        .map(most.of);
};
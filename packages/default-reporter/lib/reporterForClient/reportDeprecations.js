"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chalk = require("chalk");
const most = require("most");
const formatWarn_1 = require("./utils/formatWarn");
const zooming_1 = require("./utils/zooming");
exports.default = (deprecation$, opts) => {
    return deprecation$
        // print warnings only about deprecated packages from the root
        .filter((log) => log.depth === 0)
        .map((log) => {
        if (!opts.isRecursive && log.prefix === opts.cwd) {
            return {
                msg: formatWarn_1.default(`${chalk.red('deprecated')} ${log.pkgName}@${log.pkgVersion}: ${log.deprecated}`),
            };
        }
        return {
            msg: zooming_1.zoomOut(opts.cwd, log.prefix, formatWarn_1.default(`${chalk.red('deprecated')} ${log.pkgName}@${log.pkgVersion}`)),
        };
    })
        .map(most.of);
};
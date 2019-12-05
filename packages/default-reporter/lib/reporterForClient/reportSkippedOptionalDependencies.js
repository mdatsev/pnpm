"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const most = require("most");
exports.default = (skippedOptionalDependency$, opts) => {
    return skippedOptionalDependency$
        .filter((log) => Boolean(log['prefix'] === opts.cwd && log.parents && log.parents.length === 0))
        .map((log) => most.of({
        msg: `info: ${log.package['id'] || log.package.name && (`${log.package.name}@${log.package.version}`) || log.package['pref']} is an optional dependency and failed compatibility check. Excluding it from installation.`,
    }));
};

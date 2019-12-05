"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_loggers_1 = require("@pnpm/core-loggers");
const path = require("path");
const symlinkDir = require("symlink-dir");
function symlinkDependency(dependencyRealLocation, destModulesDir, importAs) {
    const link = path.join(destModulesDir, importAs);
    core_loggers_1.linkLogger.debug({ target: dependencyRealLocation, link });
    return symlinkDir(dependencyRealLocation, link);
}
exports.default = symlinkDependency;
const symlinkDirectRootDependency_1 = require("./symlinkDirectRootDependency");
exports.symlinkDirectRootDependency = symlinkDirectRootDependency_1.default;

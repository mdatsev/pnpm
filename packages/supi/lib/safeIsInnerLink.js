"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = require("@pnpm/logger");
const isInnerLink = require("is-inner-link");
const isSubdir = require("is-subdir");
const makeDir = require("make-dir");
const fs = require("mz/fs");
const path = require("path");
async function safeIsInnerLink(importerModulesDir, depName, opts) {
    try {
        const link = await isInnerLink(importerModulesDir, depName);
        if (link.isInner)
            return true;
        if (isSubdir(opts.virtualStoreDir, link.target) || isSubdir(opts.storeDir, link.target))
            return true;
        return link.target;
    }
    catch (err) {
        if (err.code === 'ENOENT')
            return true;
        if (opts.hideAlienModules) {
            logger_1.default.warn({
                message: `Moving ${depName} that was installed by a different package manager to "node_modules/.ignored`,
                prefix: opts.importerDir,
            });
            const ignoredDir = path.join(importerModulesDir, '.ignored', depName);
            await makeDir(path.dirname(ignoredDir));
            await fs.rename(path.join(importerModulesDir, depName), ignoredDir);
        }
        return true;
    }
}
exports.default = safeIsInnerLink;

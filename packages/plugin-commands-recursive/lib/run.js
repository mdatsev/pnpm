"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const error_1 = require("@pnpm/error");
const lifecycle_1 = require("@pnpm/lifecycle");
const logger_1 = require("@pnpm/logger");
const utils_1 = require("@pnpm/utils");
const p_limit_1 = require("p-limit");
exports.default = async (packageChunks, graph, args, cmd, opts) => {
    const scriptName = args[0];
    let hasCommand = 0;
    const result = {
        fails: [],
        passes: 0,
    };
    const limitRun = p_limit_1.default(opts.workspaceConcurrency);
    const stdio = (opts.workspaceConcurrency === 1 ||
        packageChunks.length === 1 && packageChunks[0].length === 1) ? 'inherit' : 'pipe';
    const passedThruArgs = args.slice(1);
    for (const chunk of packageChunks) {
        await Promise.all(chunk.map((prefix) => limitRun(async () => {
            const pkg = graph[prefix];
            if (!pkg.package.manifest.scripts || !pkg.package.manifest.scripts[scriptName]) {
                return;
            }
            hasCommand++;
            try {
                const lifecycleOpts = {
                    depPath: prefix,
                    extraBinPaths: opts.extraBinPaths,
                    pkgRoot: prefix,
                    rawConfig: opts.rawConfig,
                    rootNodeModulesDir: await utils_1.realNodeModulesDir(prefix),
                    stdio,
                    unsafePerm: true,
                };
                if (pkg.package.manifest.scripts[`pre${scriptName}`]) {
                    await lifecycle_1.default(`pre${scriptName}`, pkg.package.manifest, lifecycleOpts);
                }
                await lifecycle_1.default(scriptName, pkg.package.manifest, { ...lifecycleOpts, args: passedThruArgs });
                if (pkg.package.manifest.scripts[`post${scriptName}`]) {
                    await lifecycle_1.default(`post${scriptName}`, pkg.package.manifest, lifecycleOpts);
                }
                result.passes++;
            }
            catch (err) {
                logger_1.default.info(err);
                if (!opts.bail) {
                    result.fails.push({
                        error: err,
                        message: err.message,
                        prefix,
                    });
                    return;
                }
                // tslint:disable:no-string-literal
                err['code'] = 'ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL';
                err['prefix'] = prefix;
                // tslint:enable:no-string-literal
                throw err;
            }
        })));
    }
    if (scriptName !== 'test' && !hasCommand) {
        if (opts.allPackagesAreSelected) {
            throw new error_1.default('RECURSIVE_RUN_NO_SCRIPT', `None of the packages has a "${scriptName}" script`);
        }
        else {
            logger_1.default.info({
                message: `None of the selected packages has a "${scriptName}" script`,
                prefix: opts.workspaceDir
            });
        }
    }
    return result;
};

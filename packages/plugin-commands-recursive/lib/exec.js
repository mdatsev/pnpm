"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = require("@pnpm/logger");
const execa = require("execa");
const p_limit_1 = require("p-limit");
exports.default = async (packageChunks, graph, args, cmd, opts) => {
    const limitRun = p_limit_1.default(opts.workspaceConcurrency);
    const result = {
        fails: [],
        passes: 0,
    };
    for (const chunk of packageChunks) {
        await Promise.all(chunk.map((prefix) => limitRun(async () => {
            try {
                await execa(args[0], args.slice(1), {
                    cwd: prefix,
                    env: {
                        ...process.env,
                        PNPM_PACKAGE_NAME: graph[prefix].package.manifest.name,
                    },
                    stdio: 'inherit',
                });
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
                err['code'] = 'ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL';
                err['prefix'] = prefix;
                // tslint:enable:no-string-literal
                throw err;
            }
        })));
    }
    return result;
};

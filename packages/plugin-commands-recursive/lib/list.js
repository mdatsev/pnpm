"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = require("@pnpm/logger");
const plugin_commands_listing_1 = require("@pnpm/plugin-commands-listing");
exports.default = async (pkgs, args, cmd, opts) => {
    var _a;
    const depth = (_a = opts.depth, (_a !== null && _a !== void 0 ? _a : 0));
    if (opts.lockfileDir) {
        return plugin_commands_listing_1.list.render(pkgs.map((pkg) => pkg.dir), args, {
            ...opts,
            alwaysPrintRootPackage: depth === -1,
            lockfileDir: opts.lockfileDir,
        }, cmd);
    }
    const outputs = [];
    for (const { dir } of pkgs) {
        try {
            const output = await plugin_commands_listing_1.list.render([dir], args, {
                ...opts,
                alwaysPrintRootPackage: depth === -1,
                lockfileDir: opts.lockfileDir || dir,
            }, cmd);
            if (!output)
                continue;
            outputs.push(output);
        }
        catch (err) {
            logger_1.default.info(err);
            err['prefix'] = dir; // tslint:disable-line:no-string-literal
            throw err;
        }
    }
    if (outputs.length === 0)
        return '';
    const joiner = typeof depth === 'number' && depth > -1 ? '\n\n' : '\n';
    return outputs.join(joiner);
};

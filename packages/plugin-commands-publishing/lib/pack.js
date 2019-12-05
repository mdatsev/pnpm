"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const run_npm_1 = require("@pnpm/run-npm");
const renderHelp = require("render-help");
const publish_1 = require("./publish");
function types() {
    return {};
}
exports.types = types;
exports.commandNames = ['pack'];
function help() {
    return renderHelp({
        description: 'Creates a compressed gzip archive of package dependencies.',
        usages: ['pnpm pack'],
    });
}
exports.help = help;
async function handler(args, opts, command) {
    let _status;
    await publish_1.fakeRegularManifest({
        dir: opts.dir,
        engineStrict: opts.engineStrict,
        workspaceDir: opts.workspaceDir || opts.dir,
    }, async () => {
        const { status } = await run_npm_1.default(['pack', ...opts.argv.original.slice(1)]);
        _status = status;
    });
    if (_status !== 0) {
        process.exit(_status);
    }
}
exports.handler = handler;

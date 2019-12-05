"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("@pnpm/config");
const path = require("path");
const R = require("ramda");
const renderHelp = require("render-help");
function types() {
    return R.pick([
        'global',
    ], config_1.types);
}
exports.types = types;
exports.commandNames = ['root'];
function help() {
    return renderHelp({
        description: 'Print the effective \`node_modules\` directory.',
        descriptionLists: [
            {
                title: 'Options',
                list: [
                    {
                        description: 'Print the global \`node_modules\` directory',
                        name: '--global',
                        shortAlias: '-g',
                    },
                ],
            },
        ],
        usages: ['pnpm root [-g [--independent-leaves]]'],
    });
}
exports.help = help;
async function handler(args, opts, command) {
    return `${path.join(opts.dir, 'node_modules')}\n`;
}
exports.handler = handler;

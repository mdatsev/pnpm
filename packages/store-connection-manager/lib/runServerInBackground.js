"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const diable = require("diable");
const pnpm = require.resolve('pnpm/bin/pnpm.js', { paths: [__dirname] });
exports.default = (storePath) => {
    return diable.daemonize(pnpm, ['server', 'start', '--store-dir', storePath], { stdio: 'inherit' });
};

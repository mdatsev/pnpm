"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("@pnpm/config");
const npx = require("@zkochan/libnpx/index");
const path = require("path");
const PNPM_PATH = path.join(__dirname, 'pnpm.js');
(async () => {
    const workspaceRoot = await config_1.findWorkspacePrefix(process.cwd());
    if (workspaceRoot) {
        process.env.PATH = `${path.join(workspaceRoot, 'node_modules/.bin')}${path.delimiter}${process.env.PATH}`;
    }
    npx({
        ...npx.parseArgs(process.argv, PNPM_PATH),
        installerStdio: 'inherit',
    });
})();

"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
const getConfig_1 = require("./getConfig");
exports.getConfig = getConfig_1.default;
const getSaveType_1 = require("./getSaveType");
exports.getSaveType = getSaveType_1.default;
const pnpmPkgJson_1 = require("./pnpmPkgJson");
exports.packageManager = pnpmPkgJson_1.default;
__export(require("./createLatestManifestGetter"));
__export(require("./getPinnedVersion"));
__export(require("./packageIsInstallable"));
__export(require("./readImporterManifest"));
__export(require("./style"));
__export(require("./updateToLatestSpecsFromManifest"));
exports.docsUrl = (cmd) => `https://pnpm.js.org/en/cli/${cmd}`;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const read_package_json_1 = require("@pnpm/read-package-json");
const p_limit_1 = require("p-limit");
const limitPkgReads = p_limit_1.default(4);
exports.default = (pkgPath) => limitPkgReads(() => read_package_json_1.default(pkgPath));

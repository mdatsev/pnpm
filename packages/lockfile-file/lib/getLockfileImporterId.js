"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const normalize = require("normalize-path");
const path = require("path");
exports.default = (lockfileDir, prefix) => normalize(path.relative(lockfileDir, prefix)) || '.';

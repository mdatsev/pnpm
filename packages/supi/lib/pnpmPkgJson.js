"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const load_json_file_1 = require("load-json-file");
const path = require("path");
exports.default = load_json_file_1.sync(path.resolve(__dirname, '../package.json'));
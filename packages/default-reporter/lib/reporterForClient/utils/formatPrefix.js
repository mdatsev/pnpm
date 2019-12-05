"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const normalize = require("normalize-path");
const path = require("path");
const outputConstants_1 = require("../outputConstants");
function formatPrefix(cwd, prefix) {
    prefix = formatPrefixNoTrim(cwd, prefix);
    if (prefix.length <= outputConstants_1.PREFIX_MAX_LENGTH) {
        return prefix;
    }
    const shortPrefix = prefix.substr(-outputConstants_1.PREFIX_MAX_LENGTH + 3);
    const separatorLocation = shortPrefix.indexOf('/');
    if (separatorLocation <= 0) {
        return `...${shortPrefix}`;
    }
    return `...${shortPrefix.substr(separatorLocation)}`;
}
exports.default = formatPrefix;
function formatPrefixNoTrim(cwd, prefix) {
    return normalize(path.relative(cwd, prefix) || '.');
}
exports.formatPrefixNoTrim = formatPrefixNoTrim;

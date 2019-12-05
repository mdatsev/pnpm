"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const replaceString = require("replace-string");
// The only reason package IDs are encoded is to avoid '>' signs.
// Otherwise, it would be impossible to split the node ID back to package IDs reliably.
// See issue https://github.com/pnpm/pnpm/issues/986
function encodePkgId(pkgId) {
    return replaceString(replaceString(pkgId, '%', '%25'), '>', '%3E');
}
exports.default = encodePkgId;

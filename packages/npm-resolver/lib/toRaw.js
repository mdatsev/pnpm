"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function toRaw(spec) {
    return `${spec.name}@${spec.fetchSpec}`;
}
exports.default = toRaw;
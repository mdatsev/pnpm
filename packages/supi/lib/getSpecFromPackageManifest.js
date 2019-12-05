"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = (manifest, depName) => {
    var _a, _b, _c;
    return ((_a = manifest.dependencies) === null || _a === void 0 ? void 0 : _a[depName]) || ((_b = manifest.devDependencies) === null || _b === void 0 ? void 0 : _b[depName])
        || ((_c = manifest.optionalDependencies) === null || _c === void 0 ? void 0 : _c[depName])
        || '';
};

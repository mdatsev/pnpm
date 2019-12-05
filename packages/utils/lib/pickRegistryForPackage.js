"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = (registries, packageName) => {
    var _a;
    const scope = getScope(packageName);
    return _a = (scope && registries[scope]), (_a !== null && _a !== void 0 ? _a : registries.default);
};
function getScope(pkgName) {
    if (pkgName[0] === '@') {
        return pkgName.substr(0, pkgName.indexOf('/'));
    }
    return null;
}

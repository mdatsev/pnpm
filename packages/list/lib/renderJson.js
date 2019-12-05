"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("@pnpm/types");
const R = require("ramda");
const getPkgInfo_1 = require("./getPkgInfo");
const sortPackages = R.sortBy(R.path(['pkg', 'alias']));
async function default_1(pkgs, opts) {
    const jsonArr = await Promise.all(pkgs.map(async (pkg) => {
        var _a;
        const jsonObj = {
            name: pkg.name,
            version: pkg.version,
        };
        for (const dependenciesField of [...types_1.DEPENDENCIES_FIELDS.sort(), 'unsavedDependencies']) {
            if ((_a = pkg[dependenciesField]) === null || _a === void 0 ? void 0 : _a.length) {
                jsonObj[dependenciesField] = await toJsonResult(pkg[dependenciesField], { long: opts.long });
            }
        }
        return jsonObj;
    }));
    return JSON.stringify(jsonArr, null, 2);
}
exports.default = default_1;
async function toJsonResult(entryNodes, opts) {
    const dependencies = {};
    await Promise.all(sortPackages(entryNodes).map(async (node) => {
        const subDependencies = await toJsonResult(node.dependencies || [], opts);
        const dep = opts.long ? await getPkgInfo_1.default(node) : { alias: node.alias, from: node.name, version: node.version, resolved: node.resolved };
        if (Object.keys(subDependencies).length) {
            dep['dependencies'] = subDependencies;
        }
        if (!dep.resolved) {
            delete dep.resolved;
        }
        const alias = dep.alias;
        delete dep.alias;
        dependencies[alias] = dep;
    }));
    return dependencies;
}
exports.toJsonResult = toJsonResult;

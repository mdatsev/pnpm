"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const registry_mock_1 = require("@pnpm/registry-mock");
const path = require("path");
const exists = require("path-exists");
exports.default = (t, storePath, encodedRegistryName) => {
    const ern = encodedRegistryName || `localhost+${registry_mock_1.REGISTRY_MOCK_PORT}`;
    const store = {
        async storeHas(pkgName, version) {
            const pathToCheck = await store.resolve(pkgName, version);
            t.ok(await exists(pathToCheck), `${pkgName}@${version} is in store (at ${pathToCheck})`);
        },
        async storeHasNot(pkgName, version) {
            const pathToCheck = await store.resolve(pkgName, version);
            t.notOk(await exists(pathToCheck), `${pkgName}@${version} is not in store (at ${pathToCheck})`);
        },
        async resolve(pkgName, version, relativePath) {
            const pkgFolder = version ? path.join(ern, pkgName, version) : pkgName;
            if (relativePath) {
                return path.join(await storePath, pkgFolder, 'package', relativePath);
            }
            return path.join(await storePath, pkgFolder, 'package');
        },
    };
    return store;
};

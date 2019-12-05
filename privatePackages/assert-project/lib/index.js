"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert_store_1 = require("@pnpm/assert-store");
const constants_1 = require("@pnpm/constants");
const modules_yaml_1 = require("@pnpm/modules-yaml");
const registry_mock_1 = require("@pnpm/registry-mock");
const path = require("path");
const exists = require("path-exists");
const read_yaml_file_1 = require("read-yaml-file");
const writePkg = require("write-pkg");
const isExecutable_1 = require("./isExecutable");
exports.isExecutable = isExecutable_1.default;
exports.default = (t, projectPath, encodedRegistryName) => {
    const ern = encodedRegistryName || `localhost+${registry_mock_1.REGISTRY_MOCK_PORT}`;
    const modules = path.join(projectPath, 'node_modules');
    let cachedStore;
    async function getStoreInstance() {
        if (!cachedStore) {
            const modulesYaml = await modules_yaml_1.read(modules);
            if (!modulesYaml) {
                throw new Error(`Cannot find module store. No .modules.yaml found at "${modules}"`);
            }
            const storePath = modulesYaml.store;
            cachedStore = {
                storePath,
                ...assert_store_1.default(t, storePath, ern),
            };
        }
        return cachedStore;
    }
    async function getVirtualStoreDir() {
        const modulesYaml = await modules_yaml_1.read(modules);
        if (!modulesYaml) {
            return path.join(modules, '.pnpm');
        }
        return modulesYaml.virtualStoreDir;
    }
    return {
        requireModule(pkgName) {
            return require(path.join(modules, pkgName));
        },
        async has(pkgName) {
            t.ok(await exists(path.join(modules, pkgName)), `${pkgName} is in node_modules`);
        },
        async hasNot(pkgName) {
            t.notOk(await exists(path.join(modules, pkgName)), `${pkgName} is not in node_modules`);
        },
        async getStorePath() {
            const store = await getStoreInstance();
            return store.storePath;
        },
        async resolve(pkgName, version, relativePath) {
            const store = await getStoreInstance();
            return store.resolve(pkgName, version, relativePath);
        },
        async storeHas(pkgName, version) {
            const store = await getStoreInstance();
            return store.resolve(pkgName, version);
        },
        async storeHasNot(pkgName, version) {
            try {
                const store = await getStoreInstance();
                return store.storeHasNot(pkgName, version);
            }
            catch (err) {
                if (err.message.startsWith('Cannot find module store')) {
                    t.pass(`${pkgName}@${version} is not in store (store does not even exist)`);
                    return;
                }
                throw err;
            }
        },
        isExecutable(pathToExe) {
            return isExecutable_1.default(t, path.join(modules, pathToExe));
        },
        async readCurrentLockfile() {
            try {
                return await read_yaml_file_1.default(path.join(await getVirtualStoreDir(), 'lock.yaml')); // tslint:disable-line
            }
            catch (err) {
                if (err.code === 'ENOENT')
                    return null;
                throw err;
            }
        },
        readModulesManifest: () => modules_yaml_1.read(modules),
        async readLockfile() {
            try {
                return await read_yaml_file_1.default(path.join(projectPath, constants_1.WANTED_LOCKFILE)); // tslint:disable-line
            }
            catch (err) {
                if (err.code === 'ENOENT')
                    return null;
                throw err;
            }
        },
        async writePackageJson(pkgJson) {
            await writePkg(projectPath, pkgJson); // tslint:disable-line
        },
    };
};

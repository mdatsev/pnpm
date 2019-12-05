"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const loadJsonFile = require("load-json-file");
const path = require("path");
const writeJsonFile = require("write-json-file");
const STORE_JSON = 'store.json';
async function read(storePath) {
    const storeJsonPath = path.join(storePath, STORE_JSON);
    try {
        return await loadJsonFile(storeJsonPath);
    }
    catch (err) {
        if (err.code !== 'ENOENT') {
            throw err;
        }
        return null;
    }
}
exports.read = read;
function save(storePath, store) {
    const storeJsonPath = path.join(storePath, STORE_JSON);
    return writeJsonFile(storeJsonPath, store);
}
exports.save = save;
function saveSync(storePath, store) {
    const storeJsonPath = path.join(storePath, STORE_JSON);
    return writeJsonFile.sync(storeJsonPath, store);
}
exports.saveSync = saveSync;

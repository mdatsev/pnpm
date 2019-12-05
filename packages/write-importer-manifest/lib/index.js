"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const writeJsonFile = require("write-json-file");
const writeJson5File = require("write-json5-file");
const writeYamlFile = require("write-yaml-file");
const YAML_FORMAT = {
    noCompatMode: true,
    noRefs: true,
};
function writeImporterManifest(filePath, manifest, opts) {
    switch (filePath.substr(filePath.lastIndexOf('.') + 1).toLowerCase()) {
        case 'json5':
            return writeJson5File(filePath, manifest, opts);
        case 'yaml':
            return writeYamlFile(filePath, manifest, YAML_FORMAT);
        case 'json':
        default:
            return writeJsonFile(filePath, manifest, opts);
    }
}
exports.default = writeImporterManifest;

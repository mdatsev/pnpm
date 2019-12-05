"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("graceful-fs");
const JSON5 = require("json5");
const parseJson = require("parse-json");
const stripBom = require("strip-bom");
const util_1 = require("util");
const readFile = util_1.promisify(fs.readFile);
async function readJson5File(filePath) {
    const text = await readFileWithoutBom(filePath);
    try {
        return {
            data: JSON5.parse(text),
            text,
        };
    }
    catch (err) {
        err.message += ` in ${filePath}`;
        err['code'] = 'ERR_PNPM_JSON5_PARSE';
        throw err;
    }
}
exports.readJson5File = readJson5File;
async function readJsonFile(filePath) {
    const text = await readFileWithoutBom(filePath);
    try {
        return {
            data: parseJson(text, filePath),
            text,
        };
    }
    catch (err) {
        err['code'] = 'ERR_PNPM_JSON_PARSE';
        throw err;
    }
}
exports.readJsonFile = readJsonFile;
async function readFileWithoutBom(path) {
    return stripBom(await readFile(path, 'utf8'));
}
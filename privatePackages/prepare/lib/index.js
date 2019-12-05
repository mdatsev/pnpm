"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert_project_1 = require("@pnpm/assert-project");
const makeDir = require("make-dir");
const path = require("path");
const tempy = require("tempy");
const write_json5_file_1 = require("write-json5-file");
const writePkg = require("write-pkg");
const write_yaml_file_1 = require("write-yaml-file");
// the testing folder should be outside of the project to avoid lookup in the project's node_modules
const tmpPath = tempy.directory();
let dirNumber = 0;
function tempDir(t) {
    dirNumber++;
    const dirname = dirNumber.toString();
    const tmpDir = path.join(tmpPath, dirname);
    makeDir.sync(tmpDir);
    t.pass(`create testing dir ${path.join(tmpDir)}`);
    process.chdir(tmpDir);
    return tmpDir;
}
exports.tempDir = tempDir;
function preparePackages(t, pkgs, opts) {
    var _a, _b, _c;
    const pkgTmpPath = (_b = (_a = opts) === null || _a === void 0 ? void 0 : _a.tempDir, (_b !== null && _b !== void 0 ? _b : path.join(tempDir(t), 'project')));
    const manifestFormat = (_c = opts) === null || _c === void 0 ? void 0 : _c.manifestFormat;
    const dirname = path.dirname(pkgTmpPath);
    const result = {};
    for (let aPkg of pkgs) {
        if (typeof aPkg['location'] === 'string') {
            result[aPkg['package']['name']] = prepare(t, aPkg['package'], {
                manifestFormat,
                tempDir: path.join(dirname, aPkg['location']),
            });
        }
        else {
            result[aPkg['name']] = prepare(t, aPkg, {
                manifestFormat,
                tempDir: path.join(dirname, aPkg['name']),
            });
        }
    }
    process.chdir('..');
    return result;
}
exports.preparePackages = preparePackages;
function prepare(test, manifest, opts) {
    var _a, _b, _c, _d;
    const dir = (_b = (_a = opts) === null || _a === void 0 ? void 0 : _a.tempDir, (_b !== null && _b !== void 0 ? _b : path.join(tempDir(test), 'project')));
    makeDir.sync(dir);
    switch ((_d = (_c = opts) === null || _c === void 0 ? void 0 : _c.manifestFormat, (_d !== null && _d !== void 0 ? _d : 'JSON'))) {
        case 'JSON':
            writePkg.sync(dir, { name: 'project', version: '0.0.0', ...manifest }); // tslint:disable-line
            break;
        case 'JSON5':
            write_json5_file_1.sync(path.join(dir, 'package.json5'), { name: 'project', version: '0.0.0', ...manifest }); // tslint:disable-line
            break;
        case 'YAML':
            write_yaml_file_1.sync(path.join(dir, 'package.yaml'), { name: 'project', version: '0.0.0', ...manifest }); // tslint:disable-line
            break;
    }
    process.chdir(dir);
    return assert_project_1.default(test, dir);
}
exports.default = prepare;
function prepareEmpty(t) {
    const pkgTmpPath = path.join(tempDir(t), 'project');
    makeDir.sync(pkgTmpPath);
    process.chdir(pkgTmpPath);
    return assert_project_1.default(t, pkgTmpPath);
}
exports.prepareEmpty = prepareEmpty;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lockfile_utils_1 = require("@pnpm/lockfile-utils");
const lockfile_walker_1 = require("@pnpm/lockfile-walker");
function lockfileToAuditTree(lockfile, opts) {
    var _a;
    const importerWalkers = lockfile_walker_1.lockfileWalkerGroupImporterSteps(lockfile, Object.keys(lockfile.importers), { include: (_a = opts) === null || _a === void 0 ? void 0 : _a.include });
    const dependencies = {};
    importerWalkers.forEach((importerWalker) => {
        const importerDeps = lockfileToAuditNode(importerWalker.step);
        dependencies[importerWalker.importerId] = {
            dependencies: importerDeps,
            requires: toRequires(importerDeps),
            version: '0.0.0',
        };
    });
    const auditTree = {
        name: undefined,
        version: undefined,
        dependencies,
        dev: false,
        install: [],
        integrity: undefined,
        metadata: {},
        remove: [],
        requires: toRequires(dependencies),
    };
    return auditTree;
}
exports.default = lockfileToAuditTree;
function lockfileToAuditNode(step) {
    const dependencies = {};
    for (const { relDepPath, pkgSnapshot, next } of step.dependencies) {
        const { name, version } = lockfile_utils_1.nameVerFromPkgSnapshot(relDepPath, pkgSnapshot);
        const subdeps = lockfileToAuditNode(next());
        const dep = {
            dev: pkgSnapshot.dev === true,
            integrity: pkgSnapshot.resolution['integrity'],
            version,
        };
        if (Object.keys(subdeps).length) {
            dep.dependencies = subdeps;
            dep.requires = toRequires(subdeps);
        }
        dependencies[name] = dep;
    }
    return dependencies;
}
function toRequires(auditNodesByDepName) {
    const requires = {};
    for (const subdepName of Object.keys(auditNodesByDepName)) {
        requires[subdepName] = auditNodesByDepName[subdepName].version;
    }
    return requires;
}

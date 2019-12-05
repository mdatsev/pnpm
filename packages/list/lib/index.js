"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const read_importer_manifest_1 = require("@pnpm/read-importer-manifest");
const dependencies_hierarchy_1 = require("dependencies-hierarchy");
const R = require("ramda");
const createPackagesSearcher_1 = require("./createPackagesSearcher");
const renderJson_1 = require("./renderJson");
const renderParseable_1 = require("./renderParseable");
const renderTree_1 = require("./renderTree");
const DEFAULTS = {
    alwaysPrintRootPackage: true,
    depth: 0,
    long: false,
    registries: undefined,
    reportAs: 'tree',
};
async function forPackages(packages, projectPaths, maybeOpts) {
    var _a, _b;
    const opts = { ...DEFAULTS, ...maybeOpts };
    const search = createPackagesSearcher_1.default(packages);
    const pkgs = await Promise.all(R.toPairs(await dependencies_hierarchy_1.default(projectPaths, {
        depth: opts.depth,
        include: (_a = maybeOpts) === null || _a === void 0 ? void 0 : _a.include,
        lockfileDir: (_b = maybeOpts) === null || _b === void 0 ? void 0 : _b.lockfileDir,
        registries: opts.registries,
        search,
    }))
        .map(async ([projectPath, dependenciesHierarchy]) => {
        const entryPkg = await read_importer_manifest_1.readImporterManifestOnly(projectPath);
        return {
            name: entryPkg.name,
            version: entryPkg.version,
            path: projectPath,
            ...dependenciesHierarchy,
        };
    }));
    const print = getPrinter(opts.reportAs);
    return print(pkgs, {
        alwaysPrintRootPackage: opts.alwaysPrintRootPackage,
        depth: opts.depth,
        long: opts.long,
        search: Boolean(packages.length),
    });
}
exports.forPackages = forPackages;
async function default_1(projectPaths, maybeOpts) {
    var _a, _b;
    const opts = { ...DEFAULTS, ...maybeOpts };
    const pkgs = await Promise.all(R.toPairs(opts.depth === -1
        ? projectPaths.reduce((acc, projectPath) => {
            acc[projectPath] = {};
            return acc;
        }, {})
        : await dependencies_hierarchy_1.default(projectPaths, {
            depth: opts.depth,
            include: (_a = maybeOpts) === null || _a === void 0 ? void 0 : _a.include,
            lockfileDir: (_b = maybeOpts) === null || _b === void 0 ? void 0 : _b.lockfileDir,
            registries: opts.registries,
        }))
        .map(async ([projectPath, dependenciesHierarchy]) => {
        const entryPkg = await read_importer_manifest_1.readImporterManifestOnly(projectPath);
        return {
            name: entryPkg.name,
            version: entryPkg.version,
            path: projectPath,
            ...dependenciesHierarchy,
        };
    }));
    const print = getPrinter(opts.reportAs);
    return print(pkgs, {
        alwaysPrintRootPackage: opts.alwaysPrintRootPackage,
        depth: opts.depth,
        long: opts.long,
        search: false,
    });
}
exports.default = default_1;
function getPrinter(reportAs) {
    switch (reportAs) {
        case 'parseable': return renderParseable_1.default;
        case 'json': return renderJson_1.default;
        case 'tree': return renderTree_1.default;
    }
}

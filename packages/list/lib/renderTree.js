"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("@pnpm/types");
const archy = require("archy");
const chalk = require("chalk");
const cliColumns = require("cli-columns");
const path = require("path");
const R = require("ramda");
const getPkgInfo_1 = require("./getPkgInfo");
const sortPackages = R.sortBy(R.path(['name']));
const DEV_DEP_ONLY_CLR = chalk.yellow;
const PROD_DEP_CLR = (s) => s; // just use the default color
const OPTIONAL_DEP_CLR = chalk.blue;
const NOT_SAVED_DEP_CLR = chalk.red;
const LEGEND = `Legend: ${PROD_DEP_CLR('production dependency')}, ${OPTIONAL_DEP_CLR('optional only')}, ${DEV_DEP_ONLY_CLR('dev only')}\n\n`;
async function default_1(packages, opts) {
    return (await Promise.all(packages.map((pkg) => renderTreeForPackage(pkg, opts)))).filter(Boolean).join('\n\n');
}
exports.default = default_1;
async function renderTreeForPackage(pkg, opts) {
    var _a, _b, _c, _d, _e;
    if (!opts.alwaysPrintRootPackage &&
        !((_a = pkg.dependencies) === null || _a === void 0 ? void 0 : _a.length) &&
        !((_b = pkg.devDependencies) === null || _b === void 0 ? void 0 : _b.length) &&
        !((_c = pkg.optionalDependencies) === null || _c === void 0 ? void 0 : _c.length) &&
        !((_d = pkg.unsavedDependencies) === null || _d === void 0 ? void 0 : _d.length))
        return '';
    let label = '';
    if (pkg.name) {
        label += pkg.name;
        if (pkg.version) {
            label += `@${pkg.version}`;
        }
        label += ' ';
    }
    label += pkg.path;
    let output = (opts.depth > -1 ? LEGEND : '') + label + '\n';
    const useColumns = opts.depth === 0 && opts.long === false && !opts.search;
    for (let dependenciesField of [...types_1.DEPENDENCIES_FIELDS.sort(), 'unsavedDependencies']) {
        if ((_e = pkg[dependenciesField]) === null || _e === void 0 ? void 0 : _e.length) {
            const depsLabel = chalk.cyanBright(dependenciesField !== 'unsavedDependencies'
                ? `${dependenciesField}:`
                : 'not saved (you should add these dependencies to package.json if you need them):');
            output += `\n${depsLabel}\n`;
            const gPkgColor = dependenciesField === 'unsavedDependencies' ? () => NOT_SAVED_DEP_CLR : getPkgColor;
            if (useColumns && pkg[dependenciesField].length > 10) {
                output += cliColumns(pkg[dependenciesField].map(printLabel.bind(printLabel, gPkgColor))) + '\n';
                continue;
            }
            const data = await toArchyTree(gPkgColor, pkg[dependenciesField], {
                long: opts.long,
                modules: path.join(pkg.path, 'node_modules'),
            });
            for (const d of data) {
                output += archy(d);
            }
        }
    }
    return output.replace(/\n$/, '');
}
async function toArchyTree(getPkgColor, entryNodes, opts) {
    return Promise.all(sortPackages(entryNodes).map(async (node) => {
        const nodes = await toArchyTree(getPkgColor, node.dependencies || [], opts);
        if (opts.long) {
            const pkg = await getPkgInfo_1.default(node);
            const labelLines = [
                printLabel(getPkgColor, node),
                pkg.description,
            ];
            if (pkg.repository) {
                labelLines.push(pkg.repository);
            }
            if (pkg.homepage) {
                labelLines.push(pkg.homepage);
            }
            return {
                label: labelLines.join('\n'),
                nodes,
            };
        }
        return {
            label: printLabel(getPkgColor, node),
            nodes,
        };
    }));
}
exports.toArchyTree = toArchyTree;
function printLabel(getPkgColor, node) {
    let color = getPkgColor(node);
    let txt = `${color(node.name)} ${chalk.gray(node.version)}`;
    if (node.isPeer) {
        txt += ' peer';
    }
    if (node.isSkipped) {
        txt += ' skipped';
    }
    return node.searched ? chalk.bold.bgBlack(txt) : txt;
}
function getPkgColor(node) {
    if (node.dev === true)
        return DEV_DEP_ONLY_CLR;
    if (node.optional)
        return OPTIONAL_DEP_CLR;
    return PROD_DEP_CLR;
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chalk = require("chalk");
const most = require("most");
const path = require("path");
const R = require("ramda");
const semver = require("semver");
const constants_1 = require("../constants");
const outputConstants_1 = require("./outputConstants");
const pkgsDiff_1 = require("./pkgsDiff");
exports.default = (log$, opts) => {
    const pkgsDiff$ = pkgsDiff_1.default(log$, { prefix: opts.cwd });
    const summaryLog$ = log$.summary
        .take(1);
    return most.combine((pkgsDiff) => {
        let msg = '';
        for (const depType of ['prod', 'optional', 'peer', 'dev', 'nodeModulesOnly']) {
            const diffs = R.values(pkgsDiff[depType]);
            if (diffs.length) {
                msg += constants_1.EOL;
                if (opts.pnpmConfig && opts.pnpmConfig.global) {
                    msg += chalk.cyanBright(`${opts.cwd}:`);
                }
                else {
                    msg += chalk.cyanBright(`${pkgsDiff_1.propertyByDependencyType[depType]}:`);
                }
                msg += constants_1.EOL;
                msg += printDiffs(diffs, { prefix: opts.cwd });
                msg += constants_1.EOL;
            }
        }
        return { msg };
    }, pkgsDiff$, summaryLog$)
        .take(1)
        .map(most.of);
};
function printDiffs(pkgsDiff, opts) {
    // Sorts by alphabet then by removed/added
    // + ava 0.10.0
    // - chalk 1.0.0
    // + chalk 2.0.0
    pkgsDiff.sort((a, b) => (a.name.localeCompare(b.name) * 10 + (Number(!b.added) - Number(!a.added))));
    const msg = pkgsDiff.map((pkg) => {
        let result = pkg.added
            ? outputConstants_1.ADDED_CHAR
            : outputConstants_1.REMOVED_CHAR;
        if (!pkg.realName || pkg.name === pkg.realName) {
            result += ` ${pkg.name}`;
        }
        else {
            result += ` ${pkg.name} <- ${pkg.realName}`;
        }
        if (pkg.version) {
            result += ` ${chalk.grey(pkg.version)}`;
            if (pkg.latest && semver.lt(pkg.version, pkg.latest)) {
                result += ` ${chalk.grey(`(${pkg.latest} is available)`)}`;
            }
        }
        if (pkg.deprecated) {
            result += ` ${chalk.red('deprecated')}`;
        }
        if (pkg.from) {
            result += ` ${chalk.grey(`<- ${pkg.from && path.relative(opts.prefix, pkg.from) || '???'}`)}`;
        }
        return result;
    }).join(constants_1.EOL);
    return msg;
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cli_utils_1 = require("@pnpm/cli-utils");
const common_cli_options_help_1 = require("@pnpm/common-cli-options-help");
const config_1 = require("@pnpm/config");
const error_1 = require("@pnpm/error");
const lockfile_file_1 = require("@pnpm/lockfile-file");
const matcher_1 = require("@pnpm/matcher");
const modules_yaml_1 = require("@pnpm/modules-yaml");
const outdated_1 = require("@pnpm/outdated");
const semver_diff_1 = require("@pnpm/semver-diff");
const store_path_1 = require("@pnpm/store-path");
const chalk = require("chalk");
const common_tags_1 = require("common-tags");
const path = require("path");
const R = require("ramda");
const renderHelp = require("render-help");
const stripAnsi = require("strip-ansi");
const table_1 = require("table");
const wrapAnsi = require("wrap-ansi");
function types() {
    return R.pick([
        'depth',
        'global-dir',
        'global',
        'long',
        'recursive',
        'table',
    ], config_1.types);
}
exports.types = types;
exports.commandNames = ['outdated'];
function help() {
    return renderHelp({
        description: common_tags_1.stripIndent `
      Check for outdated packages. The check can be limited to a subset of the installed packages by providing arguments (patterns are supported).

      Examples:
      pnpm outdated
      pnpm outdated --long
      pnpm outdated gulp-* @babel/core`,
        descriptionLists: [
            {
                title: 'Options',
                list: [
                    {
                        description: common_tags_1.oneLine `
            By default, details about the outdated packages (such as a link to the repo) are not displayed.
            To display the details, pass this option.`,
                        name: '--long'
                    },
                    {
                        description: common_tags_1.oneLine `
              Check for outdated dependencies in every package found in subdirectories
              or in every workspace package, when executed inside a workspace.
              For options that may be used with \`-r\`, see "pnpm help recursive"`,
                        name: '--recursive',
                        shortAlias: '-r',
                    },
                    {
                        description: 'Prints the outdated packages in a list. Good for small consoles',
                        name: '--no-table',
                    },
                    common_cli_options_help_1.OPTIONS.globalDir,
                    ...common_cli_options_help_1.UNIVERSAL_OPTIONS,
                ],
            },
            common_cli_options_help_1.FILTERING,
        ],
        url: cli_utils_1.docsUrl('outdated'),
        usages: ['pnpm outdated [<pkg> ...]'],
    });
}
exports.help = help;
/**
 * Default comparators used as the argument to `ramda.sortWith()`.
 */
exports.DEFAULT_COMPARATORS = [
    sortBySemverChange,
    (o1, o2) => o1.packageName.localeCompare(o2.packageName),
];
async function handler(args, opts, command) {
    const packages = [
        {
            dir: opts.dir,
            manifest: await cli_utils_1.readImporterManifestOnly(opts.dir, opts),
        },
    ];
    const { outdatedPackages } = (await outdatedDependenciesOfWorkspacePackages(packages, args, opts))[0];
    if (!outdatedPackages.length)
        return '';
    if (opts.table !== false) {
        return renderOutdatedTable(outdatedPackages, opts);
    }
    else {
        return renderOutdatedList(outdatedPackages, opts);
    }
}
exports.handler = handler;
function renderOutdatedTable(outdatedPackages, opts) {
    let columnNames = [
        'Package',
        'Current',
        'Latest'
    ];
    let columnFns = [
        renderPackageName,
        renderCurrent,
        renderLatest,
    ];
    if (opts.long) {
        columnNames.push('Details');
        columnFns.push(renderDetails);
    }
    // Avoid the overhead of allocating a new array caused by calling `array.map()`
    for (let i = 0; i < columnNames.length; i++)
        columnNames[i] = chalk.blueBright(columnNames[i]);
    return table_1.table([
        columnNames,
        ...sortOutdatedPackages(outdatedPackages)
            .map((outdatedPkg) => columnFns.map((fn) => fn(outdatedPkg))),
    ], cli_utils_1.TABLE_OPTIONS);
}
function renderOutdatedList(outdatedPackages, opts) {
    return sortOutdatedPackages(outdatedPackages)
        .map((outdatedPkg) => {
        let info = common_tags_1.stripIndent `
        ${chalk.bold(renderPackageName(outdatedPkg))}
        ${renderCurrent(outdatedPkg)} ${chalk.grey('=>')} ${renderLatest(outdatedPkg)}`;
        if (opts.long) {
            const details = renderDetails(outdatedPkg);
            if (details) {
                info += `\n${details}`;
            }
        }
        return info;
    })
        .join('\n\n') + '\n';
}
function sortOutdatedPackages(outdatedPackages) {
    return R.sortWith(exports.DEFAULT_COMPARATORS, outdatedPackages.map(toOutdatedWithVersionDiff));
}
function getCellWidth(data, columnNumber, maxWidth) {
    const maxCellWidth = data.reduce((cellWidth, row) => {
        const cellLines = stripAnsi(row[columnNumber]).split('\n');
        const currentCellWidth = cellLines.reduce((lineWidth, line) => {
            return Math.max(lineWidth, line.length);
        }, 0);
        return Math.max(cellWidth, currentCellWidth);
    }, 0);
    return Math.min(maxWidth, maxCellWidth);
}
exports.getCellWidth = getCellWidth;
function toOutdatedWithVersionDiff(outdated) {
    if (outdated.latestManifest) {
        return {
            ...outdated,
            ...semver_diff_1.default(outdated.wanted, outdated.latestManifest.version),
        };
    }
    return {
        ...outdated,
        change: 'unknown',
    };
}
exports.toOutdatedWithVersionDiff = toOutdatedWithVersionDiff;
function renderPackageName({ belongsTo, packageName }) {
    switch (belongsTo) {
        case 'devDependencies': return `${packageName} ${chalk.dim('(dev)')}`;
        case 'optionalDependencies': return `${packageName} ${chalk.dim('(optional)')}`;
        default: return packageName;
    }
}
exports.renderPackageName = renderPackageName;
function renderCurrent({ current, wanted }) {
    let output = current || 'missing';
    if (current === wanted)
        return output;
    return `${output} (wanted ${wanted})`;
}
exports.renderCurrent = renderCurrent;
const DIFF_COLORS = {
    feature: chalk.yellowBright.bold,
    fix: chalk.greenBright.bold,
};
function renderLatest(outdatedPkg) {
    const { latestManifest, change, diff } = outdatedPkg;
    if (!latestManifest)
        return '';
    if (change === null || !diff) {
        return latestManifest.deprecated
            ? chalk.redBright.bold('Deprecated')
            : latestManifest.version;
    }
    const highlight = DIFF_COLORS[change] || chalk.redBright.bold;
    const same = joinVersionTuples(diff[0], 0);
    const other = highlight(joinVersionTuples(diff[1], diff[0].length));
    if (!same)
        return other;
    if (!other) {
        // Happens when current is 1.0.0-rc.0 and latest is 1.0.0
        return same;
    }
    return diff[0].length === 3 ? `${same}-${other}` : `${same}.${other}`;
}
exports.renderLatest = renderLatest;
function joinVersionTuples(versionTuples, startIndex) {
    const neededForSemver = 3 - startIndex;
    if (versionTuples.length <= neededForSemver || neededForSemver === 0) {
        return versionTuples.join('.');
    }
    return `${versionTuples.slice(0, neededForSemver).join('.')}-${versionTuples.slice(neededForSemver).join('.')}`;
}
function sortBySemverChange(outdated1, outdated2) {
    return pkgPriority(outdated1) - pkgPriority(outdated2);
}
exports.sortBySemverChange = sortBySemverChange;
function pkgPriority(pkg) {
    switch (pkg.change) {
        case null: return 0;
        case 'fix': return 1;
        case 'feature': return 2;
        case 'breaking': return 3;
        default: return 4;
    }
}
function renderDetails({ latestManifest }) {
    if (!latestManifest)
        return '';
    const outputs = [];
    if (latestManifest.deprecated) {
        outputs.push(wrapAnsi(chalk.redBright(latestManifest.deprecated), 40));
    }
    if (latestManifest.homepage) {
        outputs.push(chalk.underline(latestManifest.homepage));
    }
    return outputs.join('\n');
}
exports.renderDetails = renderDetails;
async function outdatedDependenciesOfWorkspacePackages(pkgs, args, opts) {
    var _a;
    const lockfileDir = opts.lockfileDir || opts.dir;
    const modules = await modules_yaml_1.read(path.join(lockfileDir, 'node_modules'));
    const virtualStoreDir = ((_a = modules) === null || _a === void 0 ? void 0 : _a.virtualStoreDir) || path.join(lockfileDir, 'node_modules/.pnpm');
    const currentLockfile = await lockfile_file_1.readCurrentLockfile(virtualStoreDir, { ignoreIncompatible: false });
    const wantedLockfile = await lockfile_file_1.readWantedLockfile(lockfileDir, { ignoreIncompatible: false }) || currentLockfile;
    if (!wantedLockfile) {
        throw new error_1.default('OUTDATED_NO_LOCKFILE', 'No lockfile in this directory. Run `pnpm install` to generate one.');
    }
    const storeDir = await store_path_1.default(opts.dir, opts.store);
    const getLatestManifest = cli_utils_1.createLatestManifestGetter({
        ...opts,
        lockfileDir,
        storeDir,
    });
    return Promise.all(pkgs.map(async ({ dir, manifest }) => {
        let match = args.length && matcher_1.default(args) || undefined;
        return {
            manifest,
            outdatedPackages: await outdated_1.default({
                currentLockfile,
                getLatestManifest,
                lockfileDir,
                manifest,
                match,
                prefix: dir,
                wantedLockfile,
            }),
            prefix: lockfile_file_1.getLockfileImporterId(lockfileDir, dir),
        };
    }));
}
exports.outdatedDependenciesOfWorkspacePackages = outdatedDependenciesOfWorkspacePackages;

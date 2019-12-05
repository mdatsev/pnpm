"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cli_utils_1 = require("@pnpm/cli-utils");
const lockfile_file_1 = require("@pnpm/lockfile-file");
const outdated_1 = require("@pnpm/plugin-commands-outdated/lib/outdated");
const chalk = require("chalk");
const common_tags_1 = require("common-tags");
const R = require("ramda");
const table_1 = require("table");
const DEP_PRIORITY = {
    dependencies: 1,
    devDependencies: 2,
    optionalDependencies: 0,
};
const COMPARATORS = [
    ...outdated_1.DEFAULT_COMPARATORS,
    (o1, o2) => DEP_PRIORITY[o1.belongsTo] - DEP_PRIORITY[o2.belongsTo],
];
exports.default = async (pkgs, args, cmd, opts) => {
    const outdatedByNameAndType = {};
    if (opts.lockfileDir) {
        const outdatedPackagesByProject = await outdated_1.outdatedDependenciesOfWorkspacePackages(pkgs, args, opts);
        for (let { prefix, outdatedPackages, manifest } of outdatedPackagesByProject) {
            outdatedPackages.forEach((outdatedPkg) => {
                const key = JSON.stringify([outdatedPkg.packageName, outdatedPkg.belongsTo]);
                if (!outdatedByNameAndType[key]) {
                    outdatedByNameAndType[key] = { ...outdatedPkg, dependentPkgs: [] };
                }
                outdatedByNameAndType[key].dependentPkgs.push({ location: prefix, manifest });
            });
        }
    }
    else {
        await Promise.all(pkgs.map(async ({ dir, manifest }) => {
            const { outdatedPackages } = (await outdated_1.outdatedDependenciesOfWorkspacePackages([{ manifest, dir }], args, { ...opts, lockfileDir: dir }))[0];
            outdatedPackages.forEach((outdatedPkg) => {
                const key = JSON.stringify([outdatedPkg.packageName, outdatedPkg.belongsTo]);
                if (!outdatedByNameAndType[key]) {
                    outdatedByNameAndType[key] = { ...outdatedPkg, dependentPkgs: [] };
                }
                outdatedByNameAndType[key].dependentPkgs.push({ location: lockfile_file_1.getLockfileImporterId(opts.dir, dir), manifest });
            });
        }));
    }
    if (opts.table !== false) {
        return renderOutdatedTable(outdatedByNameAndType, opts);
    }
    return renderOutdatedList(outdatedByNameAndType, opts);
};
function renderOutdatedTable(outdatedByNameAndType, opts) {
    let columnNames = [
        'Package',
        'Current',
        'Latest',
        'Dependents'
    ];
    let columnFns = [
        outdated_1.renderPackageName,
        outdated_1.renderCurrent,
        outdated_1.renderLatest,
        dependentPackages,
    ];
    if (opts.long) {
        columnNames.push('Details');
        columnFns.push(outdated_1.renderDetails);
    }
    // Avoid the overhead of allocating a new array caused by calling `array.map()`
    for (let i = 0; i < columnNames.length; i++)
        columnNames[i] = chalk.blueBright(columnNames[i]);
    const data = [
        columnNames,
        ...sortOutdatedPackages(Object.values(outdatedByNameAndType))
            .map((outdatedPkg) => columnFns.map((fn) => fn(outdatedPkg))),
    ];
    return table_1.table(data, {
        ...cli_utils_1.TABLE_OPTIONS,
        columns: {
            ...cli_utils_1.TABLE_OPTIONS.columns,
            // Dependents column:
            3: {
                width: outdated_1.getCellWidth(data, 3, 30),
                wrapWord: true,
            },
        },
    });
}
function renderOutdatedList(outdatedByNameAndType, opts) {
    return sortOutdatedPackages(Object.values(outdatedByNameAndType))
        .map((outdatedPkg) => {
        let info = common_tags_1.stripIndent `
        ${chalk.bold(outdated_1.renderPackageName(outdatedPkg))}
        ${outdated_1.renderCurrent(outdatedPkg)} ${chalk.grey('=>')} ${outdated_1.renderLatest(outdatedPkg)}`;
        const dependents = dependentPackages(outdatedPkg);
        if (dependents) {
            info += `\n${chalk.bold(outdatedPkg.dependentPkgs.length > 1
                ? 'Dependents:'
                : 'Dependent:')} ${dependents}`;
        }
        if (opts.long) {
            const details = outdated_1.renderDetails(outdatedPkg);
            if (details) {
                info += `\n${details}`;
            }
        }
        return info;
    })
        .join('\n\n') + '\n';
}
function dependentPackages({ dependentPkgs }) {
    return dependentPkgs
        .map(({ manifest, location }) => manifest.name || location)
        .sort()
        .join(', ');
}
function sortOutdatedPackages(outdatedPackages) {
    return R.sortWith(COMPARATORS, outdatedPackages.map(outdated_1.toOutdatedWithVersionDiff));
}

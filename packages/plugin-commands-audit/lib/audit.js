"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const audit_1 = require("@pnpm/audit");
const cli_utils_1 = require("@pnpm/cli-utils");
const config_1 = require("@pnpm/config");
const constants_1 = require("@pnpm/constants");
const error_1 = require("@pnpm/error");
const lockfile_file_1 = require("@pnpm/lockfile-file");
const chalk = require("chalk");
const R = require("ramda");
const renderHelp = require("render-help");
const table_1 = require("table");
// tslint:disable
const AUDIT_LEVEL_NUMBER = {
    'low': 0,
    'moderate': 1,
    'high': 2,
    'critical': 3,
};
const AUDIT_COLOR = {
    'low': chalk.bold,
    'moderate': chalk.bold.yellow,
    'high': chalk.bold.red,
    'critical': chalk.bold.red,
};
// tslint:enable
function types() {
    return R.pick([
        'audit-level',
        'dev',
        'json',
        'only',
        'optional',
        'production',
    ], config_1.types);
}
exports.types = types;
exports.commandNames = ['audit'];
function help() {
    return renderHelp({
        description: 'Checks for known security issues with the installed packages.',
        descriptionLists: [
            {
                title: 'Options',
                list: [
                    {
                        description: 'Output audit report in JSON format',
                        name: '--json',
                    },
                    {
                        description: 'Only print advisories with severity greater than or equal to one of the following: low|moderate|high|critical. Default: low',
                        name: '--audit-level <severity>',
                    },
                    {
                        description: 'Only audit dev dependencies',
                        name: '--dev',
                    },
                    {
                        description: 'Only audit prod dependencies',
                        name: '--prod',
                    },
                ],
            },
        ],
        url: cli_utils_1.docsUrl('audit'),
        usages: ['pnpm audit [options]'],
    });
}
exports.help = help;
async function handler(args, opts, command) {
    const lockfile = await lockfile_file_1.readWantedLockfile(opts.lockfileDir || opts.dir, { ignoreIncompatible: true });
    if (!lockfile) {
        throw new error_1.default('AUDIT_NO_LOCKFILE', `No ${constants_1.WANTED_LOCKFILE} found: Cannot audit a project without a lockfile`);
    }
    const auditReport = await audit_1.default(lockfile, { include: opts.include, registry: opts.registries.default });
    if (opts.json) {
        return JSON.stringify(auditReport, null, 2);
    }
    let output = '';
    const auditLevel = AUDIT_LEVEL_NUMBER[opts.auditLevel || 'low'];
    const advisories = Object.values(auditReport.advisories)
        .filter(({ severity }) => AUDIT_LEVEL_NUMBER[severity] >= auditLevel)
        .sort((a1, a2) => AUDIT_LEVEL_NUMBER[a2.severity] - AUDIT_LEVEL_NUMBER[a1.severity]);
    for (const advisory of advisories) {
        output += table_1.table([
            [AUDIT_COLOR[advisory.severity](advisory.severity), chalk.bold(advisory.title)],
            ['Package', advisory.module_name],
            ['Vulnerable versions', advisory.vulnerable_versions],
            ['Patched versions', advisory.patched_versions],
            ['More info', advisory.url],
        ], cli_utils_1.TABLE_OPTIONS);
    }
    return `${output}${reportSummary(auditReport.metadata.vulnerabilities)}`;
}
exports.handler = handler;
function reportSummary(vulnerabilities) {
    const totalVulnerabilityCount = Object.values(vulnerabilities).reduce((sum, vulnerabilitiesCount) => sum + vulnerabilitiesCount, 0);
    if (totalVulnerabilityCount === 0)
        return 'No known vulnerabilities found';
    return `${chalk.red(totalVulnerabilityCount)} vulnerabilities found\nSeverity: ${Object.entries(vulnerabilities)
        .filter(([auditLevel, vulnerabilitiesCount]) => vulnerabilitiesCount > 0)
        .map(([auditLevel, vulnerabilitiesCount]) => AUDIT_COLOR[auditLevel](`${vulnerabilitiesCount} ${auditLevel}`))
        .join(' | ')}`;
}

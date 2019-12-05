"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Map SIGINT & SIGTERM to process exit
// so that lockfiles are removed automatically
process
    .once('SIGINT', () => process.exit(0))
    .once('SIGTERM', () => process.exit(0));
// Patch the global fs module here at the app level
const chalk = require("chalk");
const fs = require("fs");
const gfs = require("graceful-fs");
gfs.gracefulify(fs);
const loud_rejection_1 = require("loud-rejection");
loud_rejection_1.default();
const cli_utils_1 = require("@pnpm/cli-utils");
const config_1 = require("@pnpm/config");
const core_loggers_1 = require("@pnpm/core-loggers");
const logger_1 = require("@pnpm/logger");
const isCI = require("is-ci");
const nopt = require("nopt");
const R = require("ramda");
const checkForUpdates_1 = require("./checkForUpdates");
const cmd_1 = require("./cmd");
require("./logging/fileLogger");
const reporter_1 = require("./reporter");
const GLOBAL_OPTIONS = R.pick(['color', 'filter', 'help', 'dir', 'prefix'], config_1.types);
const RENAMED_OPTIONS = {
    'lockfile-directory': 'lockfile-dir',
    'prefix': 'dir',
    'shrinkwrap-directory': 'lockfile-dir',
    'store': 'store-dir',
};
async function run(inputArgv) {
    // tslint:disable
    const shortHands = {
        's': ['--reporter', 'silent'],
        'd': ['--loglevel', 'info'],
        'dd': ['--loglevel', 'verbose'],
        'ddd': ['--loglevel', 'silly'],
        'L': ['--latest'],
        'r': ['--recursive'],
        'silent': ['--reporter', 'silent'],
        'verbose': ['--loglevel', 'verbose'],
        'quiet': ['--loglevel', 'warn'],
        'q': ['--loglevel', 'warn'],
        'h': ['--usage'],
        'H': ['--usage'],
        '?': ['--usage'],
        'help': ['--usage'],
        'v': ['--version'],
        'f': ['--force'],
        'local': ['--no-global'],
        'l': ['--long'],
        'p': ['--parseable'],
        'porcelain': ['--parseable'],
        'prod': ['--production'],
        'g': ['--global'],
        'S': ['--save'],
        'D': ['--save-dev'],
        'P': ['--save-prod'],
        'E': ['--save-exact'],
        'O': ['--save-optional'],
        'C': ['--dir'],
        'shrinkwrap-only': ['--lockfile-only'],
        'shared-workspace-shrinkwrap': ['--shared-workspace-lockfile'],
        'frozen-shrinkwrap': ['--frozen-lockfile'],
        'prefer-frozen-shrinkwrap': ['--prefer-frozen-lockfile'],
        'W': ['--ignore-workspace-root-check'],
    };
    // tslint:enable
    const noptExploratoryResults = nopt({ recursive: Boolean, filter: [String] }, { 'r': ['--recursive'] }, inputArgv, 0);
    const types = (() => {
        if (cmd_1.getCommandFullName(noptExploratoryResults.argv.remain[0]) === 'recursive') {
            return {
                ...GLOBAL_OPTIONS,
                ...cmd_1.getTypes('recursive'),
                ...cmd_1.getTypes(getCommandName(noptExploratoryResults.argv.remain.slice(1))),
            };
        }
        if (noptExploratoryResults['filter'] || noptExploratoryResults['recursive'] === true) {
            return {
                ...GLOBAL_OPTIONS,
                ...cmd_1.getTypes('recursive'),
                ...cmd_1.getTypes(getCommandName(noptExploratoryResults.argv.remain)),
            };
        }
        return {
            ...GLOBAL_OPTIONS,
            ...cmd_1.getTypes(getCommandName(noptExploratoryResults.argv.remain)),
        };
    })(); // tslint:disable-line:no-any
    function getCommandName(cliArgs) {
        if (cmd_1.getCommandFullName(cliArgs[0]) !== 'install' || cliArgs.length === 1)
            return cliArgs[0];
        return 'add';
    }
    const { argv, ...cliConf } = nopt(types, shortHands, inputArgv, 0);
    for (const cliOption of Object.keys(cliConf)) {
        if (RENAMED_OPTIONS[cliOption]) {
            cliConf[RENAMED_OPTIONS[cliOption]] = cliConf[cliOption];
            delete cliConf[cliOption];
        }
    }
    process.env['npm_config_argv'] = JSON.stringify(argv);
    let cmd = cmd_1.getCommandFullName(argv.remain[0])
        || 'help';
    if (!cmd_1.default[cmd]) {
        cmd = 'help';
    }
    let subCmd = argv.remain[1] && cmd_1.getCommandFullName(argv.remain[1]);
    const filterArgs = [];
    // `pnpm install ""` is going to be just `pnpm install`
    const cliArgs = argv.remain.slice(1).filter(Boolean);
    if (cmd !== 'recursive' && (cliConf['filter'] || cliConf['recursive'] === true)) {
        subCmd = cmd;
        cmd = 'recursive';
        cliArgs.unshift(subCmd);
    }
    else if (subCmd && !cmd_1.default[subCmd]) {
        subCmd = null;
    }
    let config;
    try {
        config = await cli_utils_1.getConfig(cliConf, {
            command: subCmd ? [cmd, subCmd] : [cmd],
            excludeReporter: false,
        });
        config.forceSharedLockfile = typeof config.workspaceDir === 'string' && config.sharedWorkspaceLockfile === true;
        config.argv = argv;
        if (config.filter) {
            Array.prototype.push.apply(config.filter, filterArgs);
        }
        else {
            config.filter = filterArgs;
        }
    }
    catch (err) {
        // Reporting is not initialized at this point, so just printing the error
        console.error(`${chalk.bgRed.black('\u2009ERROR\u2009')} ${chalk.red(err.message)}`);
        console.log(`For help, run: pnpm help ${cmd}`);
        process.exit(1);
        return;
    }
    // chalk reads the FORCE_COLOR env variable
    if (config.color === 'always') {
        process.env['FORCE_COLOR'] = '1';
    }
    else if (config.color === 'never') {
        process.env['FORCE_COLOR'] = '0';
    }
    if ((cmd === 'add' || cmd === 'install') &&
        typeof config.workspaceDir === 'string') {
        if (cliArgs.length === 0) {
            subCmd = cmd;
            cmd = 'recursive';
            cliArgs.unshift(subCmd);
        }
        else if (config.workspaceDir === config.dir &&
            !config.ignoreWorkspaceRootCheck) {
            // Reporting is not initialized at this point, so just printing the error
            console.error(`${chalk.bgRed.black('\u2009ERROR\u2009')} ${chalk.red('Running this command will add the dependency to the workspace root, ' +
                'which might not be what you want - if you really meant it, ' +
                'make it explicit by running this command again with the -W flag (or --ignore-workspace-root-check).')}`);
            console.log(`For help, run: pnpm help ${cmd}`);
            process.exit(1);
            return;
        }
    }
    if (cmd === 'install' && cliArgs.length > 0) {
        cmd = 'add';
    }
    else if (subCmd === 'install' && cliArgs.length > 1) {
        subCmd = 'add';
    }
    const allowedOptions = new Set(Object.keys(types));
    for (const cliOption of Object.keys(cliConf)) {
        if (!allowedOptions.has(cliOption) && !cliOption.startsWith('//')) {
            console.error(`${chalk.bgRed.black('\u2009ERROR\u2009')} ${chalk.red(`Unknown option '${cliOption}'`)}`);
            console.log(`For help, run: pnpm help ${cmd}`);
            process.exit(1);
            return;
        }
    }
    const selfUpdate = config.global && (cmd === 'add' || cmd === 'update') && argv.remain.includes(cli_utils_1.packageManager.name);
    // Don't check for updates
    //   1. on CI environments
    //   2. when in the middle of an actual update
    if (!isCI && !selfUpdate) {
        checkForUpdates_1.default();
    }
    const reporterType = (() => {
        if (config.loglevel === 'silent')
            return 'silent';
        if (config.reporter)
            return config.reporter;
        if (isCI || !process.stdout.isTTY)
            return 'append-only';
        return 'default';
    })();
    reporter_1.default(reporterType, {
        cmd,
        config,
        subCmd,
    });
    delete config.reporter; // This is a silly workaround because supi expects a function as config.reporter
    if (selfUpdate) {
        await cmd_1.default.server(['stop'], config); // tslint:disable-line:no-any
    }
    // NOTE: we defer the next stage, otherwise reporter might not catch all the logs
    await new Promise((resolve, reject) => {
        setTimeout(() => {
            if (config.force === true) {
                logger_1.default.warn({
                    message: 'using --force I sure hope you know what you are doing',
                    prefix: config.dir,
                });
            }
            if (cmd !== 'recursive') {
                core_loggers_1.scopeLogger.debug(config.workspaceDir
                    ? { selected: 1, workspacePrefix: config.workspaceDir }
                    : { selected: 1 });
            }
            try {
                const result = cmd_1.default[cmd](cliArgs, 
                // TypeScript doesn't currently infer that the type of config
                // is `Omit<typeof config, 'reporter'>` after the `delete config.reporter` statement
                config, argv.remain[0]);
                if (result instanceof Promise) {
                    result
                        .then((output) => {
                        if (typeof output === 'string') {
                            process.stdout.write(output);
                        }
                        resolve();
                    })
                        .catch(reject);
                }
                else {
                    if (typeof result === 'string') {
                        process.stdout.write(result);
                    }
                    resolve();
                }
            }
            catch (err) {
                reject(err);
            }
        }, 0);
    });
}
exports.default = run;
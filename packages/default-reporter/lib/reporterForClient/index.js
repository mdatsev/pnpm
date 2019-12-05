"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const reportBigTarballsProgress_1 = require("./reportBigTarballsProgress");
const reportDeprecations_1 = require("./reportDeprecations");
const reportHooks_1 = require("./reportHooks");
const reportInstallChecks_1 = require("./reportInstallChecks");
const reportLifecycleScripts_1 = require("./reportLifecycleScripts");
const reportMisc_1 = require("./reportMisc");
const reportProgress_1 = require("./reportProgress");
const reportScope_1 = require("./reportScope");
const reportSkippedOptionalDependencies_1 = require("./reportSkippedOptionalDependencies");
const reportStats_1 = require("./reportStats");
const reportSummary_1 = require("./reportSummary");
function default_1(log$, opts) {
    var _a, _b, _c, _d;
    const width = (_b = (_a = opts.width, (_a !== null && _a !== void 0 ? _a : process.stdout.columns)), (_b !== null && _b !== void 0 ? _b : 80));
    const cwd = (_d = (_c = opts.pnpmConfig) === null || _c === void 0 ? void 0 : _c.dir, (_d !== null && _d !== void 0 ? _d : process.cwd()));
    const outputs = [
        reportProgress_1.default(log$, {
            cwd,
            throttleProgress: opts.throttleProgress,
        }),
        reportLifecycleScripts_1.default(log$, {
            appendOnly: opts.appendOnly,
            cwd,
            width,
        }),
        reportDeprecations_1.default(log$.deprecation, { cwd, isRecursive: opts.isRecursive }),
        reportMisc_1.default(log$, {
            cwd,
            zoomOutCurrent: opts.isRecursive,
        }),
        ...reportStats_1.default(log$, {
            cmd: opts.cmd,
            cwd,
            isRecursive: opts.isRecursive,
            subCmd: opts.subCmd,
            width,
        }),
        reportInstallChecks_1.default(log$.installCheck, { cwd }),
        reportScope_1.default(log$.scope, { isRecursive: opts.isRecursive, cmd: opts.cmd, subCmd: opts.subCmd }),
        reportSkippedOptionalDependencies_1.default(log$.skippedOptionalDependency, { cwd }),
        reportHooks_1.default(log$.hook, { cwd, isRecursive: opts.isRecursive }),
    ];
    if (!opts.appendOnly) {
        outputs.push(reportBigTarballsProgress_1.default(log$));
    }
    if (!opts.isRecursive) {
        outputs.push(reportSummary_1.default(log$, {
            cwd,
            pnpmConfig: opts.pnpmConfig,
        }));
    }
    return outputs;
}
exports.default = default_1;

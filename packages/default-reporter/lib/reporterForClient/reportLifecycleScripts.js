"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const zen_push_1 = require("@zkochan/zen-push");
const chalk = require("chalk");
const most = require("most");
const path = require("path");
const prettyTime = require("pretty-time");
const stripAnsi = require("strip-ansi");
const constants_1 = require("../constants");
const outputConstants_1 = require("./outputConstants");
const formatPrefix_1 = require("./utils/formatPrefix");
const NODE_MODULES = `${path.sep}node_modules${path.sep}`;
exports.default = (log$, opts) => {
    // When the reporter is not append-only, the length of output is limited
    // in order to reduce flickering
    if (opts.appendOnly) {
        return most.of(log$.lifecycle
            .map((log) => ({ msg: formatLifecycleHideOverflowForAppendOnly(opts.cwd, log) })));
    }
    const lifecycleMessages = {};
    const lifecycleStreamByDepPath = {};
    const lifecyclePushStream = new zen_push_1.default();
    // TODO: handle promise of .forEach?!
    log$.lifecycle // tslint:disable-line
        .forEach((log) => {
        const key = `${log.stage}:${log.depPath}`;
        lifecycleMessages[key] = lifecycleMessages[key] || {
            collapsed: log.wd.includes(NODE_MODULES),
            output: [],
            startTime: process.hrtime(),
            status: formatIndentedStatus(chalk.magentaBright('Running...')),
        };
        const exit = typeof log['exitCode'] === 'number';
        let msg;
        if (lifecycleMessages[key].collapsed) {
            msg = renderCollapsedScriptOutput(log, lifecycleMessages[key], { cwd: opts.cwd, exit, maxWidth: opts.width });
        }
        else {
            msg = renderScriptOutput(log, lifecycleMessages[key], { cwd: opts.cwd, exit, maxWidth: opts.width });
        }
        if (exit) {
            delete lifecycleMessages[key];
        }
        if (!lifecycleStreamByDepPath[key]) {
            lifecycleStreamByDepPath[key] = new zen_push_1.default();
            lifecyclePushStream.next(most.from(lifecycleStreamByDepPath[key].observable));
        }
        lifecycleStreamByDepPath[key].next({ msg });
        if (exit) {
            lifecycleStreamByDepPath[key].complete();
        }
    });
    return most.from(lifecyclePushStream.observable);
};
function renderCollapsedScriptOutput(log, messageCache, opts) {
    messageCache['label'] = messageCache['label'] ||
        `${highlightLastFolder(formatPrefix_1.formatPrefixNoTrim(opts.cwd, log.wd))}: Running ${log.stage} script`;
    if (!opts.exit) {
        updateMessageCache(log, messageCache, opts);
        return `${messageCache['label']}...`;
    }
    const time = prettyTime(process.hrtime(messageCache.startTime));
    if (log['exitCode'] === 0) {
        return `${messageCache['label']}, done in ${time}`;
    }
    if (log['optional'] === true) {
        return `${messageCache['label']}, failed in ${time} (skipped as optional)`;
    }
    return `${messageCache['label']}, failed in ${time}${constants_1.EOL}${renderScriptOutput(log, messageCache, opts)}`;
}
function renderScriptOutput(log, messageCache, opts) {
    updateMessageCache(log, messageCache, opts);
    if (opts.exit && log['exitCode'] !== 0) {
        return [
            messageCache.script,
            ...messageCache.output,
            messageCache.status,
        ].join(constants_1.EOL);
    }
    if (messageCache.output.length > 10) {
        return [
            messageCache.script,
            `[${messageCache.output.length - 10} lines collapsed]`,
            ...messageCache.output.slice(messageCache.output.length - 10),
            messageCache.status,
        ].join(constants_1.EOL);
    }
    return [
        messageCache.script,
        ...messageCache.output,
        messageCache.status,
    ].join(constants_1.EOL);
}
function updateMessageCache(log, messageCache, opts) {
    if (log['script']) {
        const prefix = formatLifecycleScriptPrefix(opts.cwd, log.wd, log.stage);
        const maxLineWidth = opts.maxWidth - prefix.length - 2 + ANSI_ESCAPES_LENGTH_OF_PREFIX;
        messageCache.script = `${prefix}$ ${cutLine(log['script'], maxLineWidth)}`;
    }
    else if (opts.exit) {
        const time = prettyTime(process.hrtime(messageCache.startTime));
        if (log['exitCode'] === 0) {
            messageCache.status = formatIndentedStatus(chalk.magentaBright(`Done in ${time}`));
        }
        else {
            messageCache.status = formatIndentedStatus(chalk.red(`Failed in ${time}`));
        }
    }
    else {
        messageCache.output.push(formatIndentedOutput(opts.maxWidth, log));
    }
}
function formatIndentedStatus(status) {
    return `${chalk.magentaBright('└─')} ${status}`;
}
function highlightLastFolder(p) {
    const lastSlash = p.lastIndexOf('/') + 1;
    return `${chalk.gray(p.substr(0, lastSlash))}${p.substr(lastSlash)}`;
}
const ANSI_ESCAPES_LENGTH_OF_PREFIX = outputConstants_1.hlValue(' ').length - 1;
function formatLifecycleHideOverflowForAppendOnly(cwd, logObj) {
    const prefix = formatLifecycleScriptPrefix(cwd, logObj.wd, logObj.stage);
    if (typeof logObj['exitCode'] === 'number') {
        if (logObj['exitCode'] === 0) {
            return `${prefix}: Done`;
        }
        else {
            return `${prefix}: Failed`;
        }
    }
    if (logObj['script']) {
        return `${prefix}$ ${logObj['script']}`;
    }
    const line = formatLine(Infinity, logObj);
    return `${prefix}: ${line}`;
}
function formatIndentedOutput(maxWidth, logObj) {
    return `${chalk.magentaBright('│')} ${formatLine(maxWidth - 2, logObj)}`;
}
function formatLifecycleScriptPrefix(cwd, wd, stage) {
    return `${formatPrefix_1.default(cwd, wd)} ${outputConstants_1.hlValue(stage)}`;
}
function formatLine(maxWidth, logObj) {
    const line = cutLine(logObj['line'], maxWidth);
    // TODO: strip only the non-color/style ansi escape codes
    if (logObj['stdio'] === 'stderr') {
        return chalk.gray(line);
    }
    return line;
}
function cutLine(line, maxLength) {
    return stripAnsi(line).substr(0, maxLength);
}

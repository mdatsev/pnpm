"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const zen_push_1 = require("@zkochan/zen-push");
const createDiffer = require("ansi-diff");
const most = require("most");
const constants_1 = require("./constants");
const mergeOutputs_1 = require("./mergeOutputs");
const reporterForClient_1 = require("./reporterForClient");
const reporterForServer_1 = require("./reporterForServer");
let lastChar = '';
process.on('exit', () => {
    if (lastChar && lastChar !== constants_1.EOL)
        process.stdout.write(constants_1.EOL);
});
function default_1(opts) {
    var _a, _b, _c, _d;
    if (opts.context.argv[0] === 'server') {
        const log$ = most.fromEvent('data', opts.streamParser);
        reporterForServer_1.default(log$);
        return;
    }
    const outputMaxWidth = (_c = (_b = (_a = opts.reportingOptions) === null || _a === void 0 ? void 0 : _a.outputMaxWidth, (_b !== null && _b !== void 0 ? _b : (process.stdout.columns && process.stdout.columns - 2))), (_c !== null && _c !== void 0 ? _c : 80));
    const output$ = toOutput$({ ...opts, reportingOptions: { ...opts.reportingOptions, outputMaxWidth } });
    if ((_d = opts.reportingOptions) === null || _d === void 0 ? void 0 : _d.appendOnly) {
        output$
            .subscribe({
            complete() { },
            error: (err) => console.error(err.message),
            next: (line) => console.log(line),
        });
        return;
    }
    const diff = createDiffer({
        height: process.stdout.rows,
        outputMaxWidth,
    });
    output$
        .subscribe({
        complete() { },
        error: (err) => logUpdate(err.message),
        next: logUpdate,
    });
    function logUpdate(view) {
        lastChar = view[view.length - 1];
        process.stdout.write(diff.update(view));
    }
}
exports.default = default_1;
function toOutput$(opts) {
    var _a, _b, _c, _d;
    opts = opts || {};
    const fetchingProgressPushStream = new zen_push_1.default();
    const progressPushStream = new zen_push_1.default();
    const stagePushStream = new zen_push_1.default();
    const deprecationPushStream = new zen_push_1.default();
    const summaryPushStream = new zen_push_1.default();
    const lifecyclePushStream = new zen_push_1.default();
    const statsPushStream = new zen_push_1.default();
    const installCheckPushStream = new zen_push_1.default();
    const registryPushStream = new zen_push_1.default();
    const rootPushStream = new zen_push_1.default();
    const packageManifestPushStream = new zen_push_1.default();
    const linkPushStream = new zen_push_1.default();
    const otherPushStream = new zen_push_1.default();
    const hookPushStream = new zen_push_1.default();
    const skippedOptionalDependencyPushStream = new zen_push_1.default();
    const scopePushStream = new zen_push_1.default();
    setTimeout(() => {
        opts.streamParser['on']('data', (log) => {
            switch (log.name) {
                case 'pnpm:fetching-progress':
                    fetchingProgressPushStream.next(log);
                    break;
                case 'pnpm:progress':
                    progressPushStream.next(log);
                    break;
                case 'pnpm:stage':
                    stagePushStream.next(log);
                    break;
                case 'pnpm:deprecation':
                    deprecationPushStream.next(log);
                    break;
                case 'pnpm:summary':
                    summaryPushStream.next(log);
                    break;
                case 'pnpm:lifecycle':
                    lifecyclePushStream.next(log);
                    break;
                case 'pnpm:stats':
                    statsPushStream.next(log);
                    break;
                case 'pnpm:install-check':
                    installCheckPushStream.next(log);
                    break;
                case 'pnpm:registry':
                    registryPushStream.next(log);
                    break;
                case 'pnpm:root':
                    rootPushStream.next(log);
                    break;
                case 'pnpm:package-manifest':
                    packageManifestPushStream.next(log);
                    break;
                case 'pnpm:link':
                    linkPushStream.next(log);
                    break;
                case 'pnpm:hook':
                    hookPushStream.next(log);
                    break;
                case 'pnpm:skipped-optional-dependency':
                    skippedOptionalDependencyPushStream.next(log);
                    break;
                case 'pnpm:scope':
                    scopePushStream.next(log);
                    break;
                case 'pnpm': // tslint:disable-line
                case 'pnpm:store': // tslint:disable-line
                case 'pnpm:lockfile': // tslint:disable-line
                    otherPushStream.next(log);
                    break;
            }
        });
    }, 0);
    const log$ = {
        deprecation: most.from(deprecationPushStream.observable),
        fetchingProgress: most.from(fetchingProgressPushStream.observable),
        hook: most.from(hookPushStream.observable),
        installCheck: most.from(installCheckPushStream.observable),
        lifecycle: most.from(lifecyclePushStream.observable),
        link: most.from(linkPushStream.observable),
        other: most.from(otherPushStream.observable),
        packageManifest: most.from(packageManifestPushStream.observable),
        progress: most.from(progressPushStream.observable),
        registry: most.from(registryPushStream.observable),
        root: most.from(rootPushStream.observable),
        scope: most.from(scopePushStream.observable),
        skippedOptionalDependency: most.from(skippedOptionalDependencyPushStream.observable),
        stage: most.from(stagePushStream.observable),
        stats: most.from(statsPushStream.observable),
        summary: most.from(summaryPushStream.observable),
    };
    const outputs = reporterForClient_1.default(log$, {
        appendOnly: (_a = opts.reportingOptions) === null || _a === void 0 ? void 0 : _a.appendOnly,
        cmd: opts.context.argv[0],
        isRecursive: opts.context.argv[0] === 'recursive',
        pnpmConfig: opts.context.config,
        subCmd: opts.context.argv[1],
        throttleProgress: (_b = opts.reportingOptions) === null || _b === void 0 ? void 0 : _b.throttleProgress,
        width: (_c = opts.reportingOptions) === null || _c === void 0 ? void 0 : _c.outputMaxWidth,
    });
    if ((_d = opts.reportingOptions) === null || _d === void 0 ? void 0 : _d.appendOnly) {
        return most.join(most.mergeArray(outputs)
            .map((log) => log.map((msg) => msg.msg)));
    }
    return mergeOutputs_1.default(outputs).multicast();
}
exports.toOutput$ = toOutput$;

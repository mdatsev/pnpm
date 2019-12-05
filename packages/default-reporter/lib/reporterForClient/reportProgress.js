"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const zen_push_1 = require("@zkochan/zen-push");
const most = require("most");
const outputConstants_1 = require("./outputConstants");
const zooming_1 = require("./utils/zooming");
exports.default = (log$, opts) => {
    const progressOutput = typeof opts.throttleProgress === 'number' && opts.throttleProgress > 0
        ? throttledProgressOutput.bind(null, opts.throttleProgress)
        : nonThrottledProgressOutput;
    return getModulesInstallProgress$(log$.stage, log$.progress)
        .map(({ importingDone$, progress$, requirer }) => {
        const output$ = progressOutput(importingDone$, progress$);
        if (requirer === opts.cwd) {
            return output$;
        }
        return output$.map((msg) => {
            msg['msg'] = zooming_1.zoomOut(opts.cwd, requirer, msg['msg']);
            return msg;
        });
    });
};
function throttledProgressOutput(throttleProgress, importingDone$, progress$) {
    // Reporting is done every `throttleProgress` milliseconds
    // and once all packages are fetched.
    const sampler = most.merge(most.periodic(throttleProgress).until(importingDone$.skip(1)), importingDone$);
    return most.sample(createStatusMessage, sampler, progress$, importingDone$)
        // Avoid logs after all resolved packages were downloaded.
        // Fixing issue: https://github.com/pnpm/pnpm/issues/1028#issuecomment-364782901
        .skipAfter((msg) => msg['done'] === true);
}
function nonThrottledProgressOutput(importingDone$, progress$) {
    return most.combine(createStatusMessage, progress$, importingDone$);
}
function getModulesInstallProgress$(stage$, progress$) {
    const modulesInstallProgressPushStream = new zen_push_1.default();
    const progessStatsPushStreamByRequirer = getProgessStatsPushStreamByRequirer(progress$);
    const stagePushStreamByRequirer = {};
    stage$
        .forEach((log) => {
        if (!stagePushStreamByRequirer[log.prefix]) {
            stagePushStreamByRequirer[log.prefix] = new zen_push_1.default();
            if (!progessStatsPushStreamByRequirer[log.prefix]) {
                progessStatsPushStreamByRequirer[log.prefix] = new zen_push_1.default();
            }
            modulesInstallProgressPushStream.next({
                importingDone$: stage$ToImportingDone$(most.from(stagePushStreamByRequirer[log.prefix].observable)),
                progress$: most.from(progessStatsPushStreamByRequirer[log.prefix].observable),
                requirer: log.prefix,
            });
        }
        setTimeout(() => {
            stagePushStreamByRequirer[log.prefix].next(log);
            if (log.stage === 'importing_done') {
                progessStatsPushStreamByRequirer[log.prefix].complete();
                stagePushStreamByRequirer[log.prefix].complete();
            }
        }, 0);
    });
    return most.from(modulesInstallProgressPushStream.observable);
}
function stage$ToImportingDone$(stage$) {
    return stage$
        .filter((log) => log.stage === 'importing_done')
        .constant(true)
        .take(1)
        .startWith(false)
        .multicast();
}
function getProgessStatsPushStreamByRequirer(progress$) {
    const progessStatsPushStreamByRequirer = {};
    const previousProgressStatsByRequirer = {};
    progress$
        .forEach((log) => {
        previousProgressStatsByRequirer[log.requester] = {
            fetched: 0,
            resolved: 0,
            reused: 0,
            ...previousProgressStatsByRequirer[log.requester],
        };
        switch (log.status) {
            case 'resolved':
                previousProgressStatsByRequirer[log.requester].resolved++;
                break;
            case 'fetched':
                previousProgressStatsByRequirer[log.requester].fetched++;
                break;
            case 'found_in_store':
                previousProgressStatsByRequirer[log.requester].reused++;
                break;
        }
        if (!progessStatsPushStreamByRequirer[log.requester]) {
            progessStatsPushStreamByRequirer[log.requester] = new zen_push_1.default();
        }
        progessStatsPushStreamByRequirer[log.requester].next(previousProgressStatsByRequirer[log.requester]);
    });
    return progessStatsPushStreamByRequirer;
}
function createStatusMessage(progress, importingDone) {
    const msg = `Resolving: total ${outputConstants_1.hlValue(progress.resolved.toString())}, reused ${outputConstants_1.hlValue(progress.reused.toString())}, downloaded ${outputConstants_1.hlValue(progress.fetched.toString())}`;
    if (importingDone) {
        return {
            done: true,
            fixed: false,
            msg: `${msg}, done`,
        };
    }
    return {
        fixed: true,
        msg,
    };
}
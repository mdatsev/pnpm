"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const most = require("most");
const constants_1 = require("./constants");
function mergeOutputs(outputs) {
    let blockNo = 0;
    let fixedBlockNo = 0;
    let started = false;
    return most.join(most.mergeArray(outputs)
        .map((log) => {
        let currentBlockNo = -1;
        let currentFixedBlockNo = -1;
        return log
            .map((msg) => {
            if (msg['fixed']) {
                if (currentFixedBlockNo === -1) {
                    currentFixedBlockNo = fixedBlockNo++;
                }
                return {
                    blockNo: currentFixedBlockNo,
                    fixed: true,
                    msg: msg.msg,
                };
            }
            if (currentBlockNo === -1) {
                currentBlockNo = blockNo++;
            }
            return {
                blockNo: currentBlockNo,
                fixed: false,
                msg: typeof msg === 'string' ? msg : msg.msg,
                prevFixedBlockNo: currentFixedBlockNo,
            };
        });
    }))
        .scan((acc, log) => {
        if (log.fixed === true) {
            acc.fixedBlocks[log.blockNo] = log.msg;
        }
        else {
            delete acc.fixedBlocks[log['prevFixedBlockNo']];
            acc.blocks[log.blockNo] = log.msg;
        }
        return acc;
    }, { fixedBlocks: [], blocks: [] })
        .map((sections) => {
        const fixedBlocks = sections.fixedBlocks.filter(Boolean);
        const nonFixedPart = sections.blocks.filter(Boolean).join(constants_1.EOL);
        if (!fixedBlocks.length) {
            return nonFixedPart;
        }
        const fixedPart = fixedBlocks.join(constants_1.EOL);
        if (!nonFixedPart) {
            return fixedPart;
        }
        return `${nonFixedPart}${constants_1.EOL}${fixedPart}`;
    })
        .filter((msg) => {
        if (started) {
            return true;
        }
        if (msg === '')
            return false;
        started = true;
        return true;
    })
        .skipRepeats();
}
exports.default = mergeOutputs;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const prettyBytes = require("pretty-bytes");
const outputConstants_1 = require("./outputConstants");
const BIG_TARBALL_SIZE = 1024 * 1024 * 5; // 5 MB
exports.default = (log$) => {
    return log$.fetchingProgress
        .filter((log) => log.status === 'started' &&
        typeof log.size === 'number' && log.size >= BIG_TARBALL_SIZE &&
        // When retrying the download, keep the existing progress line.
        // Fixing issue: https://github.com/pnpm/pnpm/issues/1013
        log.attempt === 1)
        .map((startedLog) => {
        const size = prettyBytes(startedLog['size']);
        return log$.fetchingProgress
            .filter((log) => log.status === 'in_progress' && log.packageId === startedLog['packageId'])
            .map((log) => log['downloaded'])
            .startWith(0)
            .map((downloadedRaw) => {
            const done = startedLog['size'] === downloadedRaw;
            const downloaded = prettyBytes(downloadedRaw);
            return {
                fixed: !done,
                msg: `Downloading ${outputConstants_1.hlPkgId(startedLog['packageId'])}: ${outputConstants_1.hlValue(downloaded)}/${outputConstants_1.hlValue(size)}${done ? ', done' : ''}`,
            };
        });
    });
};

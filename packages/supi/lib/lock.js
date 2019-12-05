"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_locker_1 = require("@pnpm/fs-locker");
const logger_1 = require("@pnpm/logger");
async function withLock(dir, fn, opts) {
    const unlock = await fs_locker_1.default(dir, {
        locks: opts.locks,
        stale: opts.stale,
        whenLocked() {
            logger_1.default.warn({
                message: 'waiting for another installation to complete...',
                prefix: opts.prefix,
            });
        },
    });
    try {
        const result = await fn();
        await unlock();
        return result;
    }
    catch (err) {
        await unlock();
        // TODO: revise how store locking works
        // maybe it needs to happen outside of supi
        await opts.storeController.close();
        throw err;
    }
}
exports.default = withLock;
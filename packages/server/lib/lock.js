"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Save promises for later
 */
function lock() {
    const locks = {};
    return (key, fn) => {
        if (locks[key])
            return locks[key];
        locks[key] = fn();
        fn()
            .then(() => delete locks[key], () => delete locks[key]);
        return locks[key];
    };
}
exports.default = lock;

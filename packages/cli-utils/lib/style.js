"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chalk = require("chalk");
exports.TABLE_OPTIONS = {
    border: {
        topBody: '─',
        topJoin: '┬',
        topLeft: '┌',
        topRight: '┐',
        bottomBody: '─',
        bottomJoin: '┴',
        bottomLeft: '└',
        bottomRight: '┘',
        bodyJoin: '│',
        bodyLeft: '│',
        bodyRight: '│',
        joinBody: '─',
        joinJoin: '┼',
        joinLeft: '├',
        joinRight: '┤'
    },
    columns: {},
};
for (let [key, value] of Object.entries(exports.TABLE_OPTIONS.border)) {
    exports.TABLE_OPTIONS.border[key] = chalk.grey(value);
}

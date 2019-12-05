"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const escapeStringRegexp = require("escape-string-regexp");
function matcher(patterns) {
    if (typeof patterns === 'string')
        return matcherFromPattern(patterns);
    if (patterns.length === 0)
        return matcherFromPattern(patterns[0]);
    const matchArr = patterns.map(matcherFromPattern);
    return (input) => matchArr.some((match) => match(input));
}
exports.default = matcher;
function matcherFromPattern(pattern) {
    if (pattern === '*') {
        return () => true;
    }
    const escapedPattern = escapeStringRegexp(pattern).replace(/\\\*/g, '.*');
    if (escapedPattern === pattern) {
        return (input) => input === pattern;
    }
    const regexp = new RegExp(`^${escapedPattern}$`);
    return (input) => regexp.test(input);
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const matcher_1 = require("@pnpm/matcher");
const npa = require("@zkochan/npm-package-arg");
const semver = require("semver");
function createPatternSearcher(queries) {
    const searchers = queries
        .map(parseSearchQuery)
        .map((packageSelector) => search.bind(null, packageSelector));
    return (pkg) => searchers.some((search) => search(pkg));
}
exports.default = createPatternSearcher;
function search(packageSelector, pkg) {
    if (!packageSelector.matchName(pkg.name)) {
        return false;
    }
    if (!packageSelector.matchVersion) {
        return true;
    }
    return !pkg.version.startsWith('link:') && packageSelector.matchVersion(pkg.version);
}
function parseSearchQuery(query) {
    const parsed = npa(query);
    if (parsed.raw === parsed.name) {
        return { matchName: matcher_1.default(parsed.name) };
    }
    if (parsed.type !== 'version' && parsed.type !== 'range') {
        throw new Error(`Invalid queryument - ${query}. List can search only by version or range`);
    }
    return {
        matchName: matcher_1.default(parsed.name),
        matchVersion: (version) => semver.satisfies(version, parsed.fetchSpec),
    };
}

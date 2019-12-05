"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = require("@pnpm/logger");
const parseWantedDependencies_1 = require("./parseWantedDependencies");
async function default_1(packageSelectors, opts) {
    var _a;
    const reporter = (_a = opts) === null || _a === void 0 ? void 0 : _a.reporter;
    if (reporter) {
        logger_1.streamParser.on('data', reporter);
    }
    const packageSelectorsBySearchQueries = packageSelectors.reduce((acc, packageSelector) => {
        const searchQuery = parsedPackageSelectorToSearchQuery(parseWantedDependencies_1.parseWantedDependency(packageSelector));
        acc[searchQuery] = packageSelector;
        return acc;
    }, {});
    const packageUsagesBySearchQueries = await opts.storeController.findPackageUsages(Object.keys(packageSelectorsBySearchQueries));
    const results = {};
    for (const searchQuery of Object.keys(packageSelectorsBySearchQueries)) {
        results[packageSelectorsBySearchQueries[searchQuery]] = packageUsagesBySearchQueries[searchQuery] || [];
    }
    if (reporter) {
        logger_1.streamParser.removeListener('data', reporter);
    }
    return results;
}
exports.default = default_1;
function parsedPackageSelectorToSearchQuery(parsedPackageSelector) {
    if (!parsedPackageSelector['alias'])
        return parsedPackageSelector['pref'];
    if (!parsedPackageSelector['pref'])
        return `/${parsedPackageSelector['alias']}/`;
    return `/${parsedPackageSelector['alias']}/${parsedPackageSelector['pref']}`;
}
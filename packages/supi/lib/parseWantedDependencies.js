"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const validateNpmPackageName = require("validate-npm-package-name");
const guessPinnedVersionFromExistingSpec_1 = require("./guessPinnedVersionFromExistingSpec");
function parseWantedDependencies(rawWantedDependencies, opts) {
    return rawWantedDependencies
        .map((rawWantedDependency) => {
        const parsed = parseWantedDependency(rawWantedDependency);
        // tslint:disable:no-string-literal
        const alias = parsed['alias'];
        let pref = parsed['pref'];
        let pinnedVersion;
        // tslint:enable:no-string-literal
        if (!opts.allowNew && (!alias || !opts.currentPrefs[alias])) {
            return null;
        }
        if (!pref && alias && opts.currentPrefs[alias]) {
            pref = (opts.currentPrefs[alias].startsWith('workspace:') && opts.updateWorkspaceDependencies === true)
                ? 'workspace:*' : opts.currentPrefs[alias];
            pinnedVersion = guessPinnedVersionFromExistingSpec_1.default(opts.currentPrefs[alias]);
        }
        return {
            alias,
            dev: Boolean(opts.dev || alias && !!opts.devDependencies[alias]),
            optional: Boolean(opts.optional || alias && !!opts.optionalDependencies[alias]),
            pinnedVersion,
            pref: (pref !== null && pref !== void 0 ? pref : opts.defaultTag),
            raw: rawWantedDependency,
        };
    })
        .filter((wd) => wd !== null);
}
exports.default = parseWantedDependencies;
function parseWantedDependency(rawWantedDependency) {
    const versionDelimiter = rawWantedDependency.indexOf('@', 1); // starting from 1 to skip the @ that marks scope
    if (versionDelimiter !== -1) {
        const alias = rawWantedDependency.substr(0, versionDelimiter);
        if (validateNpmPackageName(alias).validForOldPackages) {
            return {
                alias,
                pref: rawWantedDependency.substr(versionDelimiter + 1),
            };
        }
        return {
            pref: rawWantedDependency,
        };
    }
    if (validateNpmPackageName(rawWantedDependency).validForOldPackages) {
        return {
            alias: rawWantedDependency,
        };
    }
    return {
        pref: rawWantedDependency,
    };
}
exports.parseWantedDependency = parseWantedDependency;

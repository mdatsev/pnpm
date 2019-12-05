"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const parse_npm_tarball_url_1 = require("parse-npm-tarball-url");
const getVersionSelectorType = require("version-selector-type");
function parsePref(pref, alias, defaultTag, registry) {
    let name = alias;
    if (pref.startsWith('npm:')) {
        pref = pref.substr(4);
        const index = pref.lastIndexOf('@');
        if (index < 1) {
            name = pref;
            pref = defaultTag;
        }
        else {
            name = pref.substr(0, index);
            pref = pref.substr(index + 1);
        }
    }
    if (name) {
        const selector = getVersionSelectorType(pref);
        if (selector) {
            return {
                fetchSpec: selector.normalized,
                name,
                type: selector.type,
            };
        }
    }
    if (pref.startsWith(registry)) {
        const pkg = parse_npm_tarball_url_1.default(pref);
        if (pkg) {
            return {
                fetchSpec: pkg.version,
                name: pkg.name,
                normalizedPref: pref,
                type: 'version',
            };
        }
    }
    return null;
}
exports.default = parsePref;

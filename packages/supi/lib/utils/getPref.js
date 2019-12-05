"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const error_1 = require("@pnpm/error");
const versionSelectorType = require("version-selector-type");
const save_1 = require("../save");
async function updateImporterManifest(importer, opts) {
    if (!importer.manifest) {
        throw new Error('Cannot save because no package.json found');
    }
    const specsToUpsert = opts.directDependencies.map((rdd, index) => {
        var _a, _b, _c;
        return resolvedDirectDepToSpecObject(rdd, importer, {
            pinnedVersion: (_c = (_b = (_a = importer.wantedDependencies[index]) === null || _a === void 0 ? void 0 : _a.pinnedVersion, (_b !== null && _b !== void 0 ? _b : importer['pinnedVersion'])), (_c !== null && _c !== void 0 ? _c : 'major')),
            saveWorkspaceProtocol: opts.saveWorkspaceProtocol,
        });
    });
    for (const pkgToInstall of importer.wantedDependencies) {
        if (pkgToInstall.alias && !specsToUpsert.some(({ alias }) => alias === pkgToInstall.alias)) {
            specsToUpsert.push({
                alias: pkgToInstall.alias,
                peer: importer['peer'],
                saveType: importer['targetDependenciesField'],
            });
        }
    }
    return save_1.default(importer.rootDir, importer.manifest, specsToUpsert, { dryRun: true });
}
exports.updateImporterManifest = updateImporterManifest;
function resolvedDirectDepToSpecObject({ alias, isNew, name, normalizedPref, resolution, specRaw, version, }, importer, opts) {
    let pref;
    if (normalizedPref) {
        pref = normalizedPref;
    }
    else {
        if (isNew) {
            pref = getPrefPreferSpecifiedSpec({
                alias,
                name,
                pinnedVersion: opts.pinnedVersion,
                specRaw,
                version,
            });
        }
        else {
            pref = getPrefPreferSpecifiedExoticSpec({
                alias,
                name,
                pinnedVersion: opts.pinnedVersion,
                specRaw,
                version,
            });
        }
        if (resolution.type === 'directory' &&
            opts.saveWorkspaceProtocol &&
            !pref.startsWith('workspace:')) {
            pref = `workspace:${pref}`;
        }
    }
    return {
        alias,
        peer: importer['peer'],
        pref,
        saveType: isNew ? importer['targetDependenciesField'] : undefined,
    };
}
const getPrefix = (alias, name) => alias !== name ? `npm:${name}@` : '';
function getPref(alias, name, version, opts) {
    const prefix = getPrefix(alias, name);
    return `${prefix}${createVersionSpec(version, opts.pinnedVersion)}`;
}
exports.default = getPref;
function getPrefPreferSpecifiedSpec(opts) {
    var _a;
    const prefix = getPrefix(opts.alias, opts.name);
    if ((_a = opts.specRaw) === null || _a === void 0 ? void 0 : _a.startsWith(`${opts.alias}@${prefix}`)) {
        const selector = versionSelectorType(opts.specRaw.substr(`${opts.alias}@${prefix}`.length));
        if (selector && (selector.type === 'version' || selector.type === 'range')) {
            return opts.specRaw.substr(opts.alias.length + 1);
        }
    }
    return `${prefix}${createVersionSpec(opts.version, opts.pinnedVersion)}`;
}
function getPrefPreferSpecifiedExoticSpec(opts) {
    var _a;
    const prefix = getPrefix(opts.alias, opts.name);
    if (((_a = opts.specRaw) === null || _a === void 0 ? void 0 : _a.startsWith(`${opts.alias}@${prefix}`)) && opts.specRaw !== `${opts.alias}@workspace:*`) {
        const specWithoutName = opts.specRaw.substr(`${opts.alias}@${prefix}`.length);
        const selector = versionSelectorType(specWithoutName);
        if (!(selector && (selector.type === 'version' || selector.type === 'range'))) {
            return opts.specRaw.substr(opts.alias.length + 1);
        }
    }
    return `${prefix}${createVersionSpec(opts.version, opts.pinnedVersion)}`;
}
function createVersionSpec(version, pinnedVersion) {
    switch (pinnedVersion || 'major') {
        case 'none':
            return '*';
        case 'major':
            return `^${version}`;
        case 'minor':
            return `~${version}`;
        case 'patch':
            return `${version}`;
        default:
            throw new error_1.default('BAD_PINNED_VERSION', `Cannot pin '${pinnedVersion}'`);
    }
}

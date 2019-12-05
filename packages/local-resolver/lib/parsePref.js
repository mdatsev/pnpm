"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const error_1 = require("@pnpm/error");
const normalize = require("normalize-path");
const os = require("os");
const path = require("path");
// tslint:disable-next-line
const isWindows = process.platform === 'win32' || global['FAKE_WINDOWS'];
const isFilespec = isWindows ? /^(?:[.]|~[/]|[/\\]|[a-zA-Z]:)/ : /^(?:[.]|~[/]|[/]|[a-zA-Z]:)/;
const isFilename = /[.](?:tgz|tar.gz|tar)$/i;
const isAbsolutePath = /^[/]|^[A-Za-z]:/;
function parsePref(pref, importerDir, lockfileDir) {
    if (pref.startsWith('link:')) {
        return fromLocal(pref, importerDir, lockfileDir, 'directory');
    }
    if (pref.endsWith('.tgz')
        || pref.endsWith('.tar.gz')
        || pref.endsWith('.tar')
        || pref.includes(path.sep)
        || pref.startsWith('file:')
        || isFilespec.test(pref)) {
        const type = isFilename.test(pref) ? 'file' : 'directory';
        return fromLocal(pref, importerDir, lockfileDir, type);
    }
    if (pref.startsWith('path:')) {
        const err = new error_1.default('PATH_IS_UNSUPPORTED_PROTOCOL', 'Local dependencies via `path:` protocol are not supported. ' +
            'Use the `link:` protocol for folder dependencies and `file:` for local tarballs');
        // tslint:disable:no-string-literal
        err['pref'] = pref;
        err['protocol'] = 'path:';
        // tslint:enable:no-string-literal
        throw err;
    }
    return null;
}
exports.default = parsePref;
function fromLocal(pref, importerDir, lockfileDir, type) {
    const spec = pref.replace(/\\/g, '/')
        .replace(/^(file|link):[/]*([A-Za-z]:)/, '$2') // drive name paths on windows
        .replace(/^(file|link):(?:[/]*([~./]))?/, '$2');
    const protocol = type === 'directory' ? 'link:' : 'file:';
    let fetchSpec;
    let normalizedPref;
    if (/^~[/]/.test(spec)) {
        // this is needed for windows and for file:~/foo/bar
        fetchSpec = resolvePath(os.homedir(), spec.slice(2));
        normalizedPref = `${protocol}${spec}`;
    }
    else {
        fetchSpec = resolvePath(importerDir, spec);
        if (isAbsolute(spec)) {
            normalizedPref = `${protocol}${spec}`;
        }
        else {
            normalizedPref = `${protocol}${path.relative(importerDir, fetchSpec)}`;
        }
    }
    const dependencyPath = normalize(path.relative(importerDir, fetchSpec));
    const id = type === 'directory' || importerDir === lockfileDir
        ? `${protocol}${dependencyPath}`
        : `${protocol}${normalize(path.relative(lockfileDir, fetchSpec))}`;
    return {
        dependencyPath,
        fetchSpec,
        id,
        normalizedPref,
        type,
    };
}
function resolvePath(where, spec) {
    if (isAbsolutePath.test(spec))
        return spec;
    return path.resolve(where, spec);
}
function isAbsolute(dir) {
    if (dir[0] === '/')
        return true;
    if (/^[A-Za-z]:/.test(dir))
        return true;
    return false;
}

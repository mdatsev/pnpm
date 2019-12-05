"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fetch_1 = require("@pnpm/fetch");
const git = require("graceful-git");
const HostedGit = require("hosted-git-info");
const url = require("url");
const url_1 = require("url");
const gitProtocols = new Set([
    'git',
    'git+http',
    'git+https',
    'git+rsync',
    'git+ftp',
    'git+file',
    'git+ssh',
    'ssh',
]);
async function parsePref(pref) {
    var _a;
    const hosted = HostedGit.fromUrl(pref);
    if (hosted) {
        return fromHostedGit(hosted);
    }
    const colonsPos = pref.indexOf(':');
    if (colonsPos === -1)
        return null;
    const protocol = pref.substr(0, colonsPos);
    if (protocol && gitProtocols.has(protocol.toLocaleLowerCase())) {
        const urlparse = new url_1.URL(pref);
        if (!urlparse || !urlparse.protocol)
            return null;
        const match = urlparse.protocol === 'git+ssh:' && matchGitScp(pref);
        if (match) {
            return {
                ...match,
                normalizedPref: pref,
            };
        }
        const committish = (((_a = urlparse.hash) === null || _a === void 0 ? void 0 : _a.length) > 1) ? decodeURIComponent(urlparse.hash.slice(1)) : null;
        return {
            fetchSpec: urlToFetchSpec(urlparse),
            normalizedPref: pref,
            ...setGitCommittish(committish),
        };
    }
    return null;
}
exports.default = parsePref;
function urlToFetchSpec(urlparse) {
    urlparse.hash = '';
    const fetchSpec = url.format(urlparse);
    if (fetchSpec.startsWith('git+')) {
        return fetchSpec.substr(4);
    }
    return fetchSpec;
}
async function fromHostedGit(hosted) {
    let fetchSpec = null;
    // try git/https url before fallback to ssh url
    const gitUrl = hosted.git({ noCommittish: true });
    if (gitUrl) {
        try {
            await git(['ls-remote', '--exit-code', gitUrl, 'HEAD'], { retries: 0 });
            fetchSpec = gitUrl;
        }
        catch (e) {
            // ignore
        }
    }
    if (!fetchSpec) {
        const httpsUrl = hosted.https({ noGitPlus: true, noCommittish: true });
        if (httpsUrl) {
            try {
                // when git ls-remote private repo, it asks for login credentials.
                // use HTTP HEAD request to test whether this is a private repo, to avoid login prompt.
                // this is very similar to yarn's behaviour.
                // npm instead tries git ls-remote directly which prompts user for login credentials.
                // HTTP HEAD on https://domain/user/repo, strip out ".git"
                const response = await fetch_1.default(httpsUrl.substr(0, httpsUrl.length - 4), { method: 'HEAD', follow: 0 });
                if (response.ok) {
                    fetchSpec = httpsUrl;
                }
            }
            catch (e) {
                // ignore
            }
        }
    }
    if (!fetchSpec) {
        // use ssh url for likely private repo
        fetchSpec = hosted.sshurl({ noCommittish: true });
    }
    return {
        fetchSpec: fetchSpec,
        hosted: {
            ...hosted,
            _fill: hosted._fill,
            tarball: hosted.tarball,
        },
        normalizedPref: hosted.shortcut(),
        ...setGitCommittish(hosted.committish),
    };
}
function setGitCommittish(committish) {
    if (committish !== null && committish.length >= 7 && committish.slice(0, 7) === 'semver:') {
        return {
            gitCommittish: null,
            gitRange: committish.slice(7),
        };
    }
    return { gitCommittish: committish };
}
function matchGitScp(spec) {
    // git ssh specifiers are overloaded to also use scp-style git
    // specifiers, so we have to parse those out and treat them special.
    // They are NOT true URIs, so we can't hand them to `url.parse`.
    //
    // This regex looks for things that look like:
    // git+ssh://git@my.custom.git.com:username/project.git#deadbeef
    //
    // ...and various combinations. The username in the beginning is *required*.
    const matched = spec.match(/^git\+ssh:\/\/([^:#]+:[^#]+(?:\.git)?)(?:#(.*))?$/i);
    return matched && !matched[1].match(/:[0-9]+\/?.*$/i) && {
        fetchSpec: matched[1],
        gitCommittish: matched[2],
    };
}

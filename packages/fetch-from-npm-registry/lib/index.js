"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fetch_1 = require("@pnpm/fetch");
const npm_registry_agent_1 = require("@pnpm/npm-registry-agent");
const url_1 = require("url");
const USER_AGENT = 'pnpm'; // or maybe make it `${pkg.name}/${pkg.version} (+https://npm.im/${pkg.name})`
const CORGI_DOC = 'application/vnd.npm.install-v1+json; q=1.0, application/json; q=0.8, */*';
const JSON_DOC = 'application/json';
const MAX_FOLLOWED_REDIRECTS = 20;
function default_1(defaultOpts) {
    return async (url, opts) => {
        var _a;
        const headers = {
            'user-agent': USER_AGENT,
            ...getHeaders({
                auth: (_a = opts) === null || _a === void 0 ? void 0 : _a.auth,
                fullMetadata: defaultOpts.fullMetadata,
                userAgent: defaultOpts.userAgent,
            }),
        };
        let redirects = 0;
        while (true) {
            const agent = npm_registry_agent_1.default(url, {
                ...defaultOpts,
                ...opts,
            }); // tslint:disable-line
            headers['connection'] = agent ? 'keep-alive' : 'close';
            // We should pass a URL object to node-fetch till this is not resolved:
            // https://github.com/bitinn/node-fetch/issues/245
            const urlObject = new url_1.URL(url);
            let response = await fetch_1.default(urlObject, {
                agent,
                // if verifying integrity, node-fetch must not decompress
                compress: false,
                headers,
                redirect: 'manual',
                retry: defaultOpts.retry,
            });
            if (!fetch_1.default.isRedirect(response.status) || redirects >= MAX_FOLLOWED_REDIRECTS) {
                return response;
            }
            // This is a workaround to remove authorization headers on redirect.
            // Related pnpm issue: https://github.com/pnpm/pnpm/issues/1815
            redirects++;
            url = response.headers.get('location');
            delete headers['authorization'];
        }
    };
}
exports.default = default_1;
function getHeaders(opts) {
    const headers = {
        accept: opts.fullMetadata === true ? JSON_DOC : CORGI_DOC,
    };
    if (opts.auth) {
        const authorization = authObjectToHeaderValue(opts.auth);
        if (authorization) {
            headers['authorization'] = authorization; // tslint:disable-line
        }
    }
    if (opts.userAgent) {
        headers['user-agent'] = opts.userAgent;
    }
    return headers;
}
function authObjectToHeaderValue(auth) {
    if (auth.token) {
        return `Bearer ${auth.token}`;
    }
    if (auth.username && auth.password) {
        const encoded = Buffer.from(`${auth.username}:${auth.password}`, 'utf8').toString('base64');
        return `Basic ${encoded}`;
    }
    if (auth._auth) {
        return `Basic ${auth._auth}`;
    }
    return undefined;
}

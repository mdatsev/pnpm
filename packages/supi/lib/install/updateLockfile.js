"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = require("@pnpm/logger");
const prune_lockfile_1 = require("@pnpm/prune-lockfile");
const dp = require("dependency-path");
const get_npm_tarball_url_1 = require("get-npm-tarball-url");
const R = require("ramda");
const lockfile_1 = require("./lockfile");
function default_1(depGraph, lockfile, prefix, registries) {
    lockfile.packages = lockfile.packages || {};
    const pendingRequiresBuilds = [];
    for (const depPath of Object.keys(depGraph)) {
        const depNode = depGraph[depPath];
        const relDepPath = dp.relative(registries, depNode.name, depPath);
        const result = R.partition((child) => depNode.optionalDependencies.has(depGraph[child.depPath].name), Object.keys(depNode.children).map((alias) => ({ alias, depPath: depNode.children[alias] })));
        lockfile.packages[relDepPath] = toLockfileDependency(pendingRequiresBuilds, depNode.additionalInfo, {
            depGraph,
            depPath,
            prevSnapshot: lockfile.packages[relDepPath],
            registries,
            registry: dp.getRegistryByPackageName(registries, depNode.name),
            relDepPath,
            updatedDeps: result[1],
            updatedOptionalDeps: result[0],
        });
    }
    const warn = (message) => logger_1.default.warn({ message, prefix });
    return {
        newLockfile: prune_lockfile_1.pruneSharedLockfile(lockfile, { warn }),
        pendingRequiresBuilds,
    };
}
exports.default = default_1;
function toLockfileDependency(pendingRequiresBuilds, pkg, opts) {
    var _a, _b, _c, _d;
    const depNode = opts.depGraph[opts.depPath];
    const lockfileResolution = toLockfileResolution({ name: depNode.name, version: depNode.version }, opts.relDepPath, depNode.resolution, opts.registry);
    const newResolvedDeps = updateResolvedDeps((_b = (_a = opts.prevSnapshot) === null || _a === void 0 ? void 0 : _a.dependencies, (_b !== null && _b !== void 0 ? _b : {})), opts.updatedDeps, opts.registries, opts.depGraph);
    const newResolvedOptionalDeps = updateResolvedDeps((_d = (_c = opts.prevSnapshot) === null || _c === void 0 ? void 0 : _c.optionalDependencies, (_d !== null && _d !== void 0 ? _d : {})), opts.updatedOptionalDeps, opts.registries, opts.depGraph);
    const result = {
        resolution: lockfileResolution,
    };
    // tslint:disable:no-string-literal
    if (dp.isAbsolute(opts.relDepPath)) {
        result['name'] = depNode.name;
        // There is no guarantee that a non-npmjs.org-hosted package
        // is going to have a version field
        if (depNode.version) {
            result['version'] = depNode.version;
        }
    }
    if (!R.isEmpty(newResolvedDeps)) {
        result['dependencies'] = newResolvedDeps;
    }
    if (!R.isEmpty(newResolvedOptionalDeps)) {
        result['optionalDependencies'] = newResolvedOptionalDeps;
    }
    if (depNode.dev && !depNode.prod) {
        result['dev'] = true;
    }
    else if (depNode.prod && !depNode.dev) {
        result['dev'] = false;
    }
    if (depNode.optional) {
        result['optional'] = true;
    }
    if (opts.relDepPath[0] !== '/' && opts.depPath !== depNode.packageId) {
        result['id'] = depNode.packageId;
    }
    if (pkg.peerDependencies) {
        result['peerDependencies'] = pkg.peerDependencies;
    }
    if (pkg.peerDependenciesMeta) {
        const normalizedPeerDependenciesMeta = {};
        for (const peer of Object.keys(pkg.peerDependenciesMeta)) {
            if (pkg.peerDependenciesMeta[peer].optional) {
                normalizedPeerDependenciesMeta[peer] = { optional: true };
            }
        }
        if (Object.keys(normalizedPeerDependenciesMeta).length) {
            result['peerDependenciesMeta'] = normalizedPeerDependenciesMeta;
        }
    }
    if (pkg.engines) {
        for (const engine of R.keys(pkg.engines)) {
            if (pkg.engines[engine] === '*')
                continue;
            result['engines'] = result['engines'] || {};
            result['engines'][engine] = pkg.engines[engine];
        }
    }
    if (pkg.cpu) {
        result['cpu'] = pkg.cpu;
    }
    if (pkg.os) {
        result['os'] = pkg.os;
    }
    if (pkg.bundledDependencies || pkg.bundleDependencies) {
        result['bundledDependencies'] = pkg.bundledDependencies || pkg.bundleDependencies;
    }
    if (pkg.deprecated) {
        result['deprecated'] = pkg.deprecated;
    }
    if (depNode.hasBin) {
        result['hasBin'] = true;
    }
    if (opts.prevSnapshot) {
        if (opts.prevSnapshot.requiresBuild) {
            result['requiresBuild'] = opts.prevSnapshot.requiresBuild;
        }
        if (opts.prevSnapshot.prepare) {
            result['prepare'] = opts.prevSnapshot.prepare;
        }
    }
    else if (depNode.prepare) {
        result['prepare'] = true;
        result['requiresBuild'] = true;
    }
    else if (depNode.requiresBuild !== undefined) {
        if (depNode.requiresBuild) {
            result['requiresBuild'] = true;
        }
    }
    else {
        pendingRequiresBuilds.push({
            absoluteDepPath: opts.depPath,
            relativeDepPath: opts.relDepPath,
        });
    }
    depNode.requiresBuild = result['requiresBuild'];
    // tslint:enable:no-string-literal
    return result;
}
// previous resolutions should not be removed from lockfile
// as installation might not reanalize the whole dependency graph
// the `depth` property defines how deep should dependencies be checked
function updateResolvedDeps(prevResolvedDeps, updatedDeps, registries, depGraph) {
    const newResolvedDeps = R.fromPairs(updatedDeps
        .map(({ alias, depPath }) => {
        const depNode = depGraph[depPath];
        return [
            alias,
            lockfile_1.absolutePathToRef(depNode.absolutePath, {
                alias,
                realName: depNode.name,
                registries,
                resolution: depNode.resolution,
            }),
        ];
    }));
    return R.merge(prevResolvedDeps, newResolvedDeps);
}
function toLockfileResolution(pkg, relDepPath, resolution, registry) {
    // tslint:disable:no-string-literal
    if (dp.isAbsolute(relDepPath) || resolution.type !== undefined || !resolution['integrity']) {
        return resolution;
    }
    const base = registry !== resolution['registry'] ? { registry: resolution['registry'] } : {};
    // Sometimes packages are hosted under non-standard tarball URLs.
    // For instance, when they are hosted on npm Enterprise. See https://github.com/pnpm/pnpm/issues/867
    // Or in othere weird cases, like https://github.com/pnpm/pnpm/issues/1072
    const expectedTarball = get_npm_tarball_url_1.default(pkg.name, pkg.version, { registry });
    const actualTarball = resolution['tarball'].replace('%2f', '/');
    if (removeProtocol(expectedTarball) !== removeProtocol(actualTarball)) {
        return {
            ...base,
            integrity: resolution['integrity'],
            tarball: relativeTarball(resolution['tarball'], registry),
        };
    }
    return {
        ...base,
        integrity: resolution['integrity'],
    };
    // tslint:enable:no-string-literal
}
function removeProtocol(url) {
    return url.split('://')[1];
}
function relativeTarball(tarball, registry) {
    // It is important to save the tarball URL as "relative-path" (without the leading '/').
    // Sometimes registries are located in a subdirectory of a website.
    // For instance, https://mycompany.jfrog.io/mycompany/api/npm/npm-local/
    // So the tarball location should be relative to the directory,
    // it is not an absolute-path reference.
    // So we add @mycompany/mypackage/-/@mycompany/mypackage-2.0.0.tgz
    // not /@mycompany/mypackage/-/@mycompany/mypackage-2.0.0.tgz
    // Related issue: https://github.com/pnpm/pnpm/issues/1827
    if (tarball.substr(0, registry.length) === registry) {
        return tarball.substr(registry.length);
    }
    return tarball;
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const error_1 = require("@pnpm/error");
const logger_1 = require("@pnpm/logger");
const pkgid_to_filename_1 = require("@pnpm/pkgid-to-filename");
const utils_1 = require("@pnpm/utils");
const common_tags_1 = require("common-tags");
const crypto = require("crypto");
const importFrom = require("import-from");
const path = require("path");
const R = require("ramda");
const semver = require("semver");
function default_1(opts) {
    const depGraph = {};
    const absolutePathsByNodeId = {};
    for (const { directNodeIdsByAlias, topParents, rootDir } of opts.importers) {
        const pkgsByName = Object.assign(R.fromPairs(topParents.map(({ name, version }) => [
            name,
            {
                depth: 0,
                version,
            },
        ])), toPkgByName(Object
            .keys(directNodeIdsByAlias)
            .map((alias) => ({
            alias,
            node: opts.dependenciesTree[directNodeIdsByAlias[alias]],
            nodeId: directNodeIdsByAlias[alias],
        }))));
        resolvePeersOfChildren(directNodeIdsByAlias, pkgsByName, {
            absolutePathsByNodeId,
            dependenciesTree: opts.dependenciesTree,
            depGraph,
            independentLeaves: opts.independentLeaves,
            lockfileDir: opts.lockfileDir,
            purePkgs: new Set(),
            rootDir,
            strictPeerDependencies: opts.strictPeerDependencies,
            virtualStoreDir: opts.virtualStoreDir,
        });
    }
    R.values(depGraph).forEach((node) => {
        node.children = R.keys(node.children).reduce((acc, alias) => {
            acc[alias] = absolutePathsByNodeId[node.children[alias]];
            return acc;
        }, {});
    });
    const importersDirectAbsolutePathsByAlias = {};
    for (const { directNodeIdsByAlias, id } of opts.importers) {
        importersDirectAbsolutePathsByAlias[id] = R.keys(directNodeIdsByAlias).reduce((rootAbsolutePathsByAlias, alias) => {
            rootAbsolutePathsByAlias[alias] = absolutePathsByNodeId[directNodeIdsByAlias[alias]];
            return rootAbsolutePathsByAlias;
        }, {});
    }
    return {
        depGraph,
        importersDirectAbsolutePathsByAlias,
    };
}
exports.default = default_1;
function resolvePeersOfNode(nodeId, parentParentPkgs, ctx) {
    const node = ctx.dependenciesTree[nodeId];
    if (ctx.purePkgs.has(node.resolvedPackage.id) && ctx.depGraph[node.resolvedPackage.id].depth <= node.depth) {
        ctx.absolutePathsByNodeId[nodeId] = node.resolvedPackage.id;
        return {};
    }
    const children = typeof node.children === 'function' ? node.children() : node.children;
    const parentPkgs = R.isEmpty(children)
        ? parentParentPkgs
        : {
            ...parentParentPkgs,
            ...toPkgByName(Object.keys(children).map((alias) => ({ alias, nodeId: children[alias], node: ctx.dependenciesTree[children[alias]] }))),
        };
    const unknownResolvedPeersOfChildren = resolvePeersOfChildren(children, parentPkgs, ctx);
    const resolvedPeers = R.isEmpty(node.resolvedPackage.peerDependencies)
        ? {}
        : resolvePeers({
            dependenciesTree: ctx.dependenciesTree,
            node,
            nodeId,
            parentPkgs,
            rootDir: ctx.rootDir,
            strictPeerDependencies: ctx.strictPeerDependencies,
        });
    const allResolvedPeers = Object.assign(unknownResolvedPeersOfChildren, resolvedPeers);
    let modules;
    let absolutePath;
    const localLocation = path.join(ctx.virtualStoreDir, pkgid_to_filename_1.default(node.resolvedPackage.id, ctx.lockfileDir));
    const isPure = R.isEmpty(allResolvedPeers);
    if (isPure) {
        modules = path.join(localLocation, 'node_modules');
        absolutePath = node.resolvedPackage.id;
        if (R.isEmpty(node.resolvedPackage.peerDependencies)) {
            ctx.purePkgs.add(node.resolvedPackage.id);
        }
    }
    else {
        const peersFolderSuffix = createPeersFolderSuffix(Object.keys(allResolvedPeers).map((alias) => ({
            name: alias,
            version: ctx.dependenciesTree[allResolvedPeers[alias]].resolvedPackage.version,
        })));
        modules = path.join(`${localLocation}${peersFolderSuffix}`, 'node_modules');
        absolutePath = `${node.resolvedPackage.id}${peersFolderSuffix}`;
    }
    ctx.absolutePathsByNodeId[nodeId] = absolutePath;
    if (!ctx.depGraph[absolutePath] || ctx.depGraph[absolutePath].depth > node.depth) {
        const independent = ctx.independentLeaves && node.resolvedPackage.independent;
        const centralLocation = node.resolvedPackage.engineCache || path.join(node.resolvedPackage.path, 'node_modules', node.resolvedPackage.name);
        const peripheralLocation = !independent
            ? path.join(modules, node.resolvedPackage.name)
            : centralLocation;
        const unknownPeers = Object.keys(unknownResolvedPeersOfChildren);
        if (unknownPeers.length) {
            if (!node.resolvedPackage.additionalInfo.peerDependencies) {
                node.resolvedPackage.additionalInfo.peerDependencies = {};
            }
            for (const unknownPeer of unknownPeers) {
                if (!node.resolvedPackage.additionalInfo.peerDependencies[unknownPeer]) {
                    node.resolvedPackage.additionalInfo.peerDependencies[unknownPeer] = '*';
                }
            }
        }
        ctx.depGraph[absolutePath] = {
            absolutePath,
            additionalInfo: node.resolvedPackage.additionalInfo,
            centralLocation,
            children: Object.assign(children, resolvedPeers),
            depth: node.depth,
            dev: node.resolvedPackage.dev,
            fetchingBundledManifest: node.resolvedPackage.fetchingBundledManifest,
            fetchingFiles: node.resolvedPackage.fetchingFiles,
            hasBin: node.resolvedPackage.hasBin,
            hasBundledDependencies: node.resolvedPackage.hasBundledDependencies,
            independent,
            installable: node.installable,
            isBuilt: !!node.resolvedPackage.engineCache,
            isPure,
            modules,
            name: node.resolvedPackage.name,
            optional: node.resolvedPackage.optional,
            optionalDependencies: node.resolvedPackage.optionalDependencies,
            packageId: node.resolvedPackage.id,
            peripheralLocation,
            prepare: node.resolvedPackage.prepare,
            prod: node.resolvedPackage.prod,
            requiresBuild: node.resolvedPackage.requiresBuild,
            resolution: node.resolvedPackage.resolution,
            version: node.resolvedPackage.version,
        };
    }
    return allResolvedPeers;
}
function resolvePeersOfChildren(children, parentPkgs, ctx) {
    const allResolvedPeers = {};
    for (const childNodeId of R.values(children)) {
        Object.assign(allResolvedPeers, resolvePeersOfNode(childNodeId, parentPkgs, ctx));
    }
    const unknownResolvedPeersOfChildren = R.keys(allResolvedPeers)
        .filter((alias) => !children[alias])
        .reduce((acc, peer) => {
        acc[peer] = allResolvedPeers[peer];
        return acc;
    }, {});
    return unknownResolvedPeersOfChildren;
}
function resolvePeers(ctx) {
    var _a, _b, _c;
    const resolvedPeers = {};
    for (const peerName in ctx.node.resolvedPackage.peerDependencies) { // tslint:disable-line:forin
        const peerVersionRange = ctx.node.resolvedPackage.peerDependencies[peerName];
        let resolved = ctx.parentPkgs[peerName];
        if (!resolved || resolved.nodeId && !ctx.dependenciesTree[resolved.nodeId].installable) {
            try {
                const { version } = importFrom(ctx.rootDir, `${peerName}/package.json`);
                resolved = {
                    depth: -1,
                    version,
                };
            }
            catch (err) {
                if (((_b = (_a = ctx.node.resolvedPackage.additionalInfo.peerDependenciesMeta) === null || _a === void 0 ? void 0 : _a[peerName]) === null || _b === void 0 ? void 0 : _b.optional) === true) {
                    continue;
                }
                const friendlyPath = nodeIdToFriendlyPath(ctx.nodeId, ctx.dependenciesTree);
                const message = common_tags_1.oneLine `
          ${friendlyPath ? `${friendlyPath}: ` : ''}${packageFriendlyId(ctx.node.resolvedPackage)}
          requires a peer of ${peerName}@${peerVersionRange} but none was installed.`;
                if (ctx.strictPeerDependencies) {
                    throw new error_1.default('MISSING_PEER_DEPENDENCY', message);
                }
                logger_1.default.warn({
                    message,
                    prefix: ctx.rootDir,
                });
                continue;
            }
        }
        if (!semver.satisfies(resolved.version, peerVersionRange)) {
            const friendlyPath = nodeIdToFriendlyPath(ctx.nodeId, ctx.dependenciesTree);
            const message = common_tags_1.oneLine `
        ${friendlyPath ? `${friendlyPath}: ` : ''}${packageFriendlyId(ctx.node.resolvedPackage)}
        requires a peer of ${peerName}@${peerVersionRange} but version ${resolved.version} was installed.`;
            if (ctx.strictPeerDependencies) {
                throw new error_1.default('INVALID_PEER_DEPENDENCY', message);
            }
            logger_1.default.warn({
                message,
                prefix: ctx.rootDir,
            });
        }
        if (resolved.depth === ctx.node.depth + 1) {
            // if the resolved package is a regular dependency of the package
            // then there is no need to link it in
            continue;
        }
        if ((_c = resolved) === null || _c === void 0 ? void 0 : _c.nodeId)
            resolvedPeers[peerName] = resolved.nodeId;
    }
    return resolvedPeers;
}
function packageFriendlyId(manifest) {
    return `${manifest.name}@${manifest.version}`;
}
function nodeIdToFriendlyPath(nodeId, dependenciesTree) {
    const parts = utils_1.splitNodeId(nodeId).slice(1, -2);
    const result = R.scan((prevNodeId, pkgId) => utils_1.createNodeId(prevNodeId, pkgId), '>', parts)
        .slice(2)
        .map((nid) => dependenciesTree[nid].resolvedPackage.name)
        .join(' > ');
    return result;
}
function toPkgByName(nodes) {
    const pkgsByName = {};
    for (const { alias, node, nodeId } of nodes) {
        pkgsByName[alias] = {
            depth: node.depth,
            nodeId,
            version: node.resolvedPackage.version,
        };
    }
    return pkgsByName;
}
function createPeersFolderSuffix(peers) {
    const folderName = peers.map(({ name, version }) => `${name.replace('/', '+')}@${version}`).sort().join('+');
    // We don't want the folder name to get too long.
    // Otherwise, an ENAMETOOLONG error might happen.
    // see: https://github.com/pnpm/pnpm/issues/977
    //
    // A bigger limit might be fine but the md5 hash will be 32 symbols,
    // so for consistency's sake, we go with 32.
    if (folderName.length > 32) {
        return `_${crypto.createHash('md5').update(folderName).digest('hex')}`;
    }
    return `_${folderName}`;
}

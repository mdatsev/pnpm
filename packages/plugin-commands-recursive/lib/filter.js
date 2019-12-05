"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const matcher_1 = require("@pnpm/matcher");
const isSubdir = require("is-subdir");
const R = require("ramda");
function filterGraph(pkgGraph, packageSelectors) {
    const cherryPickedPackages = [];
    const walkedDependencies = new Set();
    const walkedDependents = new Set();
    const graph = pkgGraphToGraph(pkgGraph);
    let reversedGraph;
    for (const { pattern, scope, selectBy } of packageSelectors) {
        const entryPackages = selectBy === 'name'
            ? matchPackages(pkgGraph, pattern)
            : matchPackagesByPath(pkgGraph, pattern);
        switch (scope) {
            case 'dependencies':
                pickSubgraph(graph, entryPackages, walkedDependencies);
                continue;
            case 'dependents':
                if (!reversedGraph) {
                    reversedGraph = reverseGraph(graph);
                }
                pickSubgraph(reversedGraph, entryPackages, walkedDependents);
                continue;
            case 'exact':
                Array.prototype.push.apply(cherryPickedPackages, entryPackages);
                continue;
        }
    }
    const walked = new Set([...walkedDependencies, ...walkedDependents]);
    cherryPickedPackages.forEach((cherryPickedPackage) => walked.add(cherryPickedPackage));
    return R.pick(Array.from(walked), pkgGraph);
}
exports.filterGraph = filterGraph;
function pkgGraphToGraph(pkgGraph) {
    const graph = {};
    Object.keys(pkgGraph).forEach((nodeId) => {
        graph[nodeId] = pkgGraph[nodeId].dependencies;
    });
    return graph;
}
function reverseGraph(graph) {
    const reversedGraph = {};
    Object.keys(graph).forEach((dependentNodeId) => {
        graph[dependentNodeId].forEach((dependencyNodeId) => {
            if (!reversedGraph[dependencyNodeId]) {
                reversedGraph[dependencyNodeId] = [dependentNodeId];
            }
            else {
                reversedGraph[dependencyNodeId].push(dependentNodeId);
            }
        });
    });
    return reversedGraph;
}
function matchPackages(graph, pattern) {
    const match = matcher_1.default(pattern);
    return Object.keys(graph).filter((id) => graph[id].package.manifest.name && match(graph[id].package.manifest.name));
}
function matchPackagesByPath(graph, pathStartsWith) {
    return Object.keys(graph).filter((location) => isSubdir(pathStartsWith, location));
}
function pickSubgraph(graph, nextNodeIds, walked) {
    for (const nextNodeId of nextNodeIds) {
        if (!walked.has(nextNodeId)) {
            walked.add(nextNodeId);
            if (graph[nextNodeId])
                pickSubgraph(graph, graph[nextNodeId], walked);
        }
    }
}

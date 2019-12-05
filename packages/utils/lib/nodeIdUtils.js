"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function nodeIdContainsSequence(nodeId, pkgId1, pkgId2) {
    return nodeId.includes(`>${pkgId1}>${pkgId2}>`);
}
exports.nodeIdContainsSequence = nodeIdContainsSequence;
function createNodeId(parentNodeId, pkgId) {
    return `${parentNodeId}${pkgId}>`;
}
exports.createNodeId = createNodeId;
function splitNodeId(nodeId) {
    return nodeId.split('>');
}
exports.splitNodeId = splitNodeId;
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function filterImporter(importer, include) {
    return {
        dependencies: !include.dependencies ? {} : importer.dependencies || {},
        devDependencies: !include.devDependencies ? {} : importer.devDependencies || {},
        optionalDependencies: !include.optionalDependencies ? {} : importer.optionalDependencies || {},
        specifiers: importer.specifiers,
    };
}
exports.default = filterImporter;

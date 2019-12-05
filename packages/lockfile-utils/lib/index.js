"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const nameVerFromPkgSnapshot_1 = require("./nameVerFromPkgSnapshot");
exports.nameVerFromPkgSnapshot = nameVerFromPkgSnapshot_1.default;
const packageIdFromSnapshot_1 = require("./packageIdFromSnapshot");
exports.packageIdFromSnapshot = packageIdFromSnapshot_1.default;
const packageIsIndependent_1 = require("./packageIsIndependent");
exports.packageIsIndependent = packageIsIndependent_1.default;
const pkgSnapshotToResolution_1 = require("./pkgSnapshotToResolution");
exports.pkgSnapshotToResolution = pkgSnapshotToResolution_1.default;
const satisfiesPackageManifest_1 = require("./satisfiesPackageManifest");
exports.satisfiesPackageManifest = satisfiesPackageManifest_1.default;
// for backward compatibility
const dependency_path_1 = require("dependency-path");
exports.getPkgShortId = dependency_path_1.refToRelative;
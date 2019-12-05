"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const storeIndex_1 = require("./fs/storeIndex");
exports.read = storeIndex_1.read;
exports.save = storeIndex_1.save;
const storeController_1 = require("./storeController");
exports.default = storeController_1.default;

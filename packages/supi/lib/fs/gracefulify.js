"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const gfs = require("graceful-fs");
gfs.gracefulify(fs);

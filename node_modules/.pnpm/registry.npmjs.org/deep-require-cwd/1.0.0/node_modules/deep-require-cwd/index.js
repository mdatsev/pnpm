'use strict'
const deepRequireFrom = require('deep-require-from')

module.exports = moduleId => deepRequireFrom(process.cwd(), moduleId)
module.exports.silent = moduleId => deepRequireFrom.silent(process.cwd(), moduleId)

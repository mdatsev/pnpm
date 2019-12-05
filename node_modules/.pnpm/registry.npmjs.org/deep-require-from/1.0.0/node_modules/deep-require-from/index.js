'use strict'
const deepResolveFrom = require('deep-resolve-from')

module.exports = (fromDir, moduleId) => require(deepResolveFrom(fromDir, moduleId))

module.exports.silent = (fromDir, moduleId) => {
  try {
    return require(deepResolveFrom(fromDir, moduleId))
  } catch (err) {
    return null
  }
}

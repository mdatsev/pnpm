'use strict'
const resolveFrom = require('resolve-from')
const path = require('path')

module.exports = (fromDir, moduleIds) => deepResolveFrom(fromDir, moduleIds, resolveFrom)
module.exports.silent = (fromDir, moduleIds) => deepResolveFrom(fromDir, moduleIds, resolveFrom.silent)

function deepResolveFrom (fromDir, moduleIds, resolveFrom) {
  if (moduleIds.length === 1) {
    return resolveFrom(fromDir, moduleIds[0])
  }
  const resolvedFileName = resolveFrom(fromDir, path.join(moduleIds[0], 'package.json'))

  // this happens only when using resolveFrom.silent()
  if (resolvedFileName === null) return resolvedFileName

  return deepResolveFrom(path.dirname(resolvedFileName), moduleIds.slice(1), resolveFrom)
}

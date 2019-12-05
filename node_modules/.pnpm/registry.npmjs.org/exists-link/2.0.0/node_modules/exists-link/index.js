'use strict'

var fs = require('fs')

function isString (str) {
  return typeof str === 'string'
}

function existsLink (filepath) {
  if (!isString(filepath)) throw new TypeError('path must be a string')

  return new Promise((resolve, reject) => {
    fs.lstat(filepath, function (err, stat) {
      if (!err) {
        try {
          const isSymLink = statIsSymbolicLink(stat)
          return resolve(isSymLink)
        } catch (err) {
          return reject(err)
        }
      }
      if (err.code === 'ENOENT') return resolve(false)
      reject(err)
    })
  })
}

existsLink.sync = function existsLinkSync (filepath) {
  if (!isString(filepath)) throw new TypeError('path must be a string')
  try {
    const stat = fs.lstatSync(filepath)
    return statIsSymbolicLink(stat)
  } catch (err) {
    if (err.code === 'ENOENT') return false
    throw err
  }
}

function statIsSymbolicLink (stat) {
  if (stat.isSymbolicLink()) {
    return true
  }
  throw new Error('stat is not symbolic link')
}

module.exports = existsLink

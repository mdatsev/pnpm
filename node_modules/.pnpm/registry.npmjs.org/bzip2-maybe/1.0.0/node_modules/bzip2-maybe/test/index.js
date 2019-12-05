var fs = require('fs')
var join = require('path').join

var concat = require('concat-stream')
var tape = require('tape')

var bzip2 = require('..')

tape('bzip2ped input', function (t) {
  fs.createReadStream(join(__dirname, 'fixtures/single.bz2'))
    .pipe(bzip2())
    .pipe(concat(function (data) {
      t.same(data, fs.readFileSync(__filename))
      t.end()
    }))
})

tape('bzip2ped multiple times', function (t) {
  fs.createReadStream(join(__dirname, 'fixtures/multiple.bz2'))
    .pipe(bzip2())
    .pipe(concat(function (data) {
      t.same(data, fs.readFileSync(__filename))
      t.end()
    }))
})

tape('regular input', function (t) {
  fs.createReadStream(__filename)
    .pipe(bzip2())
    .pipe(concat(function (data) {
      t.same(data, fs.readFileSync(__filename))
      t.end()
    }))
})

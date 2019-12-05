[![build status](http://img.shields.io/travis/piranna/bzip2-maybe.svg?style=flat)](http://travis-ci.org/piranna/bzip2-maybe)
[![Coverage Status](https://coveralls.io/repos/github/piranna/bzip2-maybe/badge.svg?branch=master)](https://coveralls.io/github/piranna/bzip2-maybe?branch=master)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat)](https://github.com/feross/standard)

# bzip2-maybe

Transform stream that `bzip2`s its input if it is `bzip2`ped and just echoes it
if not.

This is based on code from
[gunzip-maybe](https://github.com/mafintosh/gunzip-maybe)

```sh
npm install bzip2-maybe
```

## Usage

Simply pipe a `bzip2`ped (or not `bgzip2`ped) stream to `bzip2()` function and
read the un`bzip2`ped content.

```js
// this will `bzip2` bzip2pedStream
bzip2pedStream.pipe(bzip2()).pipe(process.stdout);

// this will just echo plainTextStream
plainTextStream.pipe(bzip2()).pipe(process.stdout);
```

## CLI usage

```sh
npm install -g bzip2-maybe
bzip2-maybe --help  # will print out usage
```

## License

MIT

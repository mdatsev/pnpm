# deep-require-from

> Require a module like \`require()\` but via a sequence of nested packages

<!--@shields('npm', 'travis')-->
[![npm version](https://img.shields.io/npm/v/deep-require-from.svg)](https://www.npmjs.com/package/deep-require-from) [![Build Status](https://img.shields.io/travis/zkochan/deep-require-from/master.svg)](https://travis-ci.org/zkochan/deep-require-from)
<!--/@-->

## Installation

```sh
npm i -S deep-require-from
```

## Usage

<!--@example('example.js')-->
```js
'use strict'
const deepRequireFrom = require('deep-require-from')

const pkg = deepRequireFrom(__dirname, ['mos', 'chalk', './package.json'])

console.log(pkg.name)
//> chalk
```
<!--/@-->

## API

### `deepRequireFrom(fromDir, moduleIds)`

Like `require()`, throws when the module can't be found.

### `deepRequireFrom.silent(fromDir, moduleIds)`

Returns `null` instead of throwing when the module can't be found.

#### moduleIds

Type: `string[]`

An array of module IDs, a module ID is something that you pass to `require()`.

## Related

- [deep-resolve-from](https://github.com/zkochan/deep-resolve-from) - Resolve the path of a module through a sequence of packages
- [deep-resolve-cwd](https://github.com/zkochan/deep-resolve-cwd) - Resolve the path of a module through a sequence of packages from the current working directory
- [req-from](https://github.com/sindresorhus/req-from) - Require a module like `require()` but from a given path

## License

[MIT](./LICENSE) © [Zoltan Kochan](https://www.kochan.io)

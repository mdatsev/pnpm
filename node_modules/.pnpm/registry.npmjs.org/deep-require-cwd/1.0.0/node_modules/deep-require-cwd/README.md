# deep-require-cwd

> Require a module like \`require()\` but via a sequence of nested packages from the current working directory

<!--@shields('npm', 'travis')-->
[![npm version](https://img.shields.io/npm/v/deep-require-cwd.svg)](https://www.npmjs.com/package/deep-require-cwd) [![Build Status](https://img.shields.io/travis/zkochan/deep-require-cwd/master.svg)](https://travis-ci.org/zkochan/deep-require-cwd)
<!--/@-->

## Installation

```sh
npm i -S deep-require-cwd
```

## Usage

<!--@example('example.js')-->
```js
'use strict'
const deepRequireCwd = require('deep-require-cwd')

const pkg = deepRequireCwd(['mos', 'chalk', './package.json'])

console.log(pkg.name)
//> chalk
```
<!--/@-->

## API

### `deepRequireCwd(moduleIds)`

Like `require()`, throws when the module can't be found.

### `deepRequireCwd.silent(moduleIds)`

Returns `null` instead of throwing when the module can't be found.

#### moduleIds

Type: `string[]`

An array of module IDs, a module ID is something that you pass to `require()`.

## Related

- [deep-require-from](https://github.com/zkochan/deep-require-from) - Require a module like `require()` but via a sequence of nested packages
- [deep-resolve-from](https://github.com/zkochan/deep-resolve-from) - Resolve the path of a module through a sequence of packages
- [deep-resolve-cwd](https://github.com/zkochan/deep-resolve-cwd) - Resolve the path of a module through a sequence of packages from the current working directory
- [req-cwd](https://github.com/sindresorhus/req-cwd) - Require a module like `require()` but from the current working directory

## License

[MIT](./LICENSE) © [Zoltan Kochan](https://www.kochan.io)

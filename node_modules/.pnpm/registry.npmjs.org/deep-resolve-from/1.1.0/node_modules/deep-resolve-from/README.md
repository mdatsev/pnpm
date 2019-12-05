# deep-resolve-from

> Resolve the path of a module through a sequence of packages

<!--@shields('npm', 'travis')-->
[![npm version](https://img.shields.io/npm/v/deep-resolve-from.svg)](https://www.npmjs.com/package/deep-resolve-from) [![Build Status](https://img.shields.io/travis/zkochan/deep-resolve-from/master.svg)](https://travis-ci.org/zkochan/deep-resolve-from)
<!--/@-->

## Installation

```sh
npm i -S deep-resolve-from
```

## Usage

```js
'use strict'
const deepResolveFrom = require('deep-resolve-from')

console.log(deepResolveFrom(process.cwd(), ['mos', 'chalk', './package.json']))
//> /home/zkochan/src/deep-resolve-from/node_modules/.registry.npmjs.org/chalk/1.1.3/node_modules/chalk/package.json
```

## API

### `deepResolveFrom(fromDir, moduleIds)`

Like `require()`, throws when the module can't be found.

### `deepResolveFrom.silent(fromDir, moduleIds)`

Returns `null` instead of throwing when the module can't be found.

#### fromDir

Type: `string`

Directory to resolve from.

#### moduleIds

Type: `string[]`

An array of module IDs, a module ID is something that you pass to `require()`.

## Related

- [resolve-from](https://github.com/sindresorhus/resolve-from) - Resolve the path of a module like `require.resolve()` but from a given path

## License

[MIT](./LICENSE) © [Zoltan Kochan](https://www.kochan.io)

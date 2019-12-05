# is-inner-link

> Returns true if a link targets a directory inside its parent directory

<!--@shields('npm', 'travis', 'appveyor')-->
[![npm version](https://img.shields.io/npm/v/is-inner-link.svg)](https://www.npmjs.com/package/is-inner-link) [![Build Status](https://img.shields.io/travis/zkochan/is-inner-link/master.svg)](https://travis-ci.org/zkochan/is-inner-link) [![Build Status on Windows](https://img.shields.io/appveyor/ci/zkochan/is-inner-link/master.svg)](https://ci.appveyor.com/project/zkochan/is-inner-link/branch/master)
<!--/@-->

## Installation

```sh
npm i -S is-inner-link
```

## Usage

```js
'use strict'
const isInnerLink = require('is-inner-link')

isInnerLink('node_modules', 'foo')
  .then(link => console.log(link))
  .catch(err => console.error(err))
//> {isInner: false, target: '/zkochan/foo'}
```

## License

[MIT](./LICENSE) © [Zoltan Kochan](https://www.kochan.io)

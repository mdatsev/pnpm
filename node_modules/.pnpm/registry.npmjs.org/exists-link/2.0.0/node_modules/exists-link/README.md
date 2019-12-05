# exists-link

![Last version](https://img.shields.io/github/tag/zkochan/exists-link.svg?style=flat-square)
[![Build Status](http://img.shields.io/travis/zkochan/exists-link/master.svg?style=flat-square)](https://travis-ci.org/zkochan/exists-link)
[![Coverage Status](https://img.shields.io/coveralls/zkochan/exists-link.svg?style=flat-square)](https://coveralls.io/github/zkochan/exists-link)

> Check if a link exists

This is a copy of [exists-file](https://github.com/Kikobeats/exists-file) by @Kikobeats just for links not files.

## Install

```bash
npm install exists-link --save
```

## Usage

```js
var existsLink = require('.')

// async with a promise
existsLink('./node_modules/nyc').then(console.log).catch(console.error)

// sync
var exists = existsLink.sync('./node_modules/nyc')
console.log(exists)
```

## API

### existsLink(link): Promise<boolean>
### existsLink.sync(link)

#### link

*Required*
Type: `string`

## License

MIT © [Zoltan Kochan](https://www.kochan.io)

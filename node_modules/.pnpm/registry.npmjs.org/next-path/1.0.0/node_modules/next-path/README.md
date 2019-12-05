# next-path [![Build status for next-path on Circle CI.](https://img.shields.io/circleci/project/sholladay/next-path/master.svg "Circle Build Status")](https://circleci.com/gh/sholladay/next-path "Next Path Builds")

> One step closer to your destination.

Like an incremental [`path.relative()`](https://nodejs.org/api/path.html#path_path_relative_from_to "Compute the path from one place to another.").

## Why?

 - Walk the file system without messy state.
 - Works well with functional programming styles.
 - Flexible about user input.

## Install

```sh
npm install next-path --save
```

## Usage

Get it into your program.

```js
const nextPath = require('next-path');
```

Determine the next path, one step closer to the destination.

```js
console.log(nextPath('a', 'a/b/c'));  // => 'a/b'
console.log(nextPath('../', '../../../'));  // => '../..'
```

## API

### nextPath(from, to)

#### from

Type: `string`

The base path that both `to` and the result will be relative to.

#### to

Type: `string`

The path you want to move one step closer to.

## Contributing

See our [contributing guidelines](https://github.com/sholladay/next-path/blob/master/CONTRIBUTING.md "The guidelines for participating in this project.") for more details.

1. [Fork it](https://github.com/sholladay/next-path/fork).
2. Make a feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. [Submit a pull request](https://github.com/sholladay/next-path/compare "Submit code to this project for review.").

## License

[MPL-2.0](https://github.com/sholladay/next-path/blob/master/LICENSE "The license for next-path.") © [Seth Holladay](http://seth-holladay.com "Author of next-path.")

Go make something, dang it.

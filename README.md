[![NPM version](https://img.shields.io/npm/v/srt.svg)](https://www.npmjs.com/package/srt)
[![Build Status](https://img.shields.io/travis/overlookmotel/srt/master.svg)](http://travis-ci.org/overlookmotel/srt)
[![Dependency Status](https://img.shields.io/david/overlookmotel/srt.svg)](https://david-dm.org/overlookmotel/srt)
[![Dev dependency Status](https://img.shields.io/david/dev/overlookmotel/srt.svg)](https://david-dm.org/overlookmotel/srt)
[![Coverage Status](https://img.shields.io/coveralls/overlookmotel/srt/master.svg)](https://coveralls.io/r/overlookmotel/srt)

# SRT subtitling utilities

## Warning

This module is intended for my personal use. It works, but has no tests at present.

## Usage

### `parse( srt )`

Parse SRT file as a string.

It aims to be as liberal as possible and

Returns `{subtitles, problems, srt}`.

`subtitles` is array of subtitle objects of form `{start, end, text}`. `start` and `end` in milliseconds.

`problems` is an array of objects representing problems encountered in parsing the SRT. Each object of form:

```js
{
  index, // Index of subtitle where problem encountered
  msg, // Description of problem
  canFix // `true` if calling `stringify()` on the subtitles returned will create an SRT with this problem fixed
}
```

If SRT cannot be parsed, `subtitles` will be `null` and a reason for the failure included in `problems`.

`srt` is SRT file as text without any corrections made, expect normalizing line breaks to consistent `\n`.

### `stringify( subtitles )`

Stringify array of subtitles (as returned from `parse()`) to SRT format - returned as a string.

### `conform( subtitles )`

Conform array of subtitles according to style guide.

Returns `{subtitles, problems}`.

`subtitles` is array of subtitle objects with as many problems as possible fixed.

`problems` is array of problems encounters (same form as returned by `parse()`). `.canFix` is `false` if could not fully solve the problem.

### `msToTimecode( ms )`

Convert milliseconds to SRT-format timecode.

e.g. `msToTimecode( 62500 ) === '00:01:02,500'`

### `detectBom( buf )`

Give a file's contents as a `Buffer`, detect if it begins with a BOM.

If a BOM is found, its type is returned - `'utf8'`, `'uft16le'` or `'utf16be'`.

If no BOM is detected, returns `null`.

### `fileBufferToString( buf, bomType )`

Converts a file contents `Buffer` to string, taking into account the BOM.

Using `detectBom()` and `fileBufferToString()` together allow reading UTF8 and UTF16 SRT files in a form which can then be passed to `parse()`.

## Versioning

This module follows [semver](https://semver.org/). Breaking changes will only be made in major version updates.

All active NodeJS release lines are supported (v10+ at time of writing). After a release line of NodeJS reaches end of life according to [Node's LTS schedule](https://nodejs.org/en/about/releases/), support for that version of Node may be dropped at any time, and this will not be considered a breaking change. Dropping support for a Node version will be made in a minor version update (e.g. 1.2.0 to 1.3.0). If you are using a Node version which is approaching end of life, pin your dependency of this module to patch updates only using tilde (`~`) e.g. `~1.2.3` to avoid breakages.

## Tests

Use `npm test` to run the tests. Use `npm run cover` to check coverage.

## Changelog

See [changelog.md](https://github.com/overlookmotel/srt/blob/master/changelog.md)

## Issues

If you discover a bug, please raise an issue on Github. https://github.com/overlookmotel/srt/issues

## Contribution

Pull requests are very welcome. Please:

* ensure all tests pass before submitting PR
* add tests for new features
* document new functionality/API additions in README
* do not add an entry to Changelog (Changelog is created when cutting releases)

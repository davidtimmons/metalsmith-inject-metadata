# metalsmith-inject-metadata

[![npm version][version-badge]][version-url]
[![build status][build-badge]][build-url]
[![downloads][downloads-badge]][downloads-url]

> A Metalsmith plugin for injecting metadata constants into source file data.

This plugin injects Metalsmith metadata values into source file data during the build process.
Metadata values can be used as program constants containing such things as file paths
or configuration settings. Whereas template plugins pull data from the file object, this plugin
injects data into the file object before the template build step occurs.

## Table of Contents

  1. [Installation](#installation)
  1. [Example](#examples)
  1. [Options](#options)
  1. [License](#license)

## Installation

```bash
$ npm install metalsmith-inject-metadata
```

**[⬆ back to top](#metalsmith-inject-metadata)**

## Examples

### Basic

Configuration in `metalsmith.json`:

```json
{
  "metadata": {
    "images": "path/to/batman/images",
    "hero": "Batman"
  },
  "plugins": {
    "metalsmith-inject-metadata": {}
  }
}
```

Source file `src/index.md`:

```
---
gotham: {{ hero }} is one half of the dynamic duo!
---
Have you read the latest {{ hero }} comic?
Look at this amazing cover: {{ images }}/batman.jpg!
```

Results in file key `gotham`:

```
"Batman is one half of the dynamic duo!"
```

And file `build/index.md` (as well as the buffer at file key `contents`):

```
Have you read the latest Batman comic?
Look at this amazing cover: path/to/batman/images/batman.jpg!
```

### Nested Objects

Configuration in `metalsmith.json`:

```json
{
  "metadata": {
    "superheroes": {
      "bats": {
        "gotham": "Batman"
      }
    }
  },
  "plugins": {
    "metalsmith-inject-metadata": {
      "metadataKeys": "superheroes.bats.gotham"
    }
  }
}
```

Source file `src/index.md`:

```
---
gotham:
  vigilantes:
    people: {{ superheroes.bats.gotham }} is a vigilante!
---
Have you read the latest {{ superheroes.bats.gotham }} comic?
```

Results in file key `gotham.vigilantes.people`:

```
"Batman is a vigilante!"
```

And file `build/index.md` (as well as the buffer at file key `contents`):

```
Have you read the latest Batman comic?
```

**[⬆ back to top](#metalsmith-inject-metadata)**

## Options

Pass options to `metalsmith-inject-metadata` using the Metalsmith
[Javascript API](https://github.com/segmentio/metalsmith#api) or
[CLI](https://github.com/segmentio/metalsmith#cli).
These are the available plugin options:

|Option                                            |Type              |Description|
|--------------------------------------------------|------------------|-----------|
|[pattern](#pattern)                               |`string[]\|string`|Pattern used to match file names.|
|[metadataKeys](#metadatakeys)                     |`string[]\|string`|Metadata keys to inject into files.|
|[metadataKeyBounds](#metadatakeybounds)           |`object`          |Key marker bounds used to match the metadata key.|
|[metadataKeyBounds.left](#metadatakeyboundsleft)  |`string`          |Left bound of the metadata key marker.|
|[metadataKeyBounds.right](#metadatakeyboundsright)|`string`          |Right bound of the metadata key marker.|
|[fileKeys](#filekeys)                             |`string[]\|string`|File keys with injectable data.|

### Defaults

```json
{
  "plugins": {
    "metalsmith-inject-metadata": {
      "pattern": ["**/*"],
      "metadataKeys": ["*"],
      "metadataKeyBounds": {
        "left": "{{ ",
        "right": " }}",
      },
      "fileKeys": ["*"]
    }
  }
}
```

### Option Details

#### pattern

Fed directly into [multimatch](https://github.com/sindresorhus/multimatch) as the mechanism
to select source files.

#### metadataKeys

Key names matching the Metalsmith `metadata` object. Only the key(s) listed here will be injected
into file data. Keys that do not match the `metadata` object will be ignored. Use wildcards
`'*'` or `['*']` to select all `metadata` keys.

Nested metadata keys can be referenced using dot notation. When injecting nested metadata keys,
the wildcard option will no longer work.


Example:

Configuration in `metalsmith.json`:

```json
{
  "metadata": {
    "superheroes": {
      "bats": {
        "gotham": "Batman"
      }
    }
  },
  "plugins": {
    "metalsmith-inject-metadata": {
      "metadataKeys": "superheroes.bats.gotham"
    }
  }
}
```

Source file `src/index.md`:

```
---
hero: {{ superheroes.bats.gotham }} is one half of the dynamic duo!
---
```

#### metadataKeyBounds

Configuration object containing settings for the metadata key markers inserted into file data.
Setting the bounds to empty strings will result in a "find and replace" for all words in the
text data matching the `metadata` key(s).

Example: `{{ myKey }}` or `myKey`

#### metadataKeyBoundsLeft

Indicates the left bound of the metadata key marker inserted into the file data.

Example: `{{ `

#### metadataKeyBoundsRight

Indicates the right bound of the metadata key marker inserted into the file data.

Example: ` }}`

#### fileKeys

Key names matching the Metalsmith file object. Only the key(s) listed here will be checked
against the list of injected `metadata` keys. Keys that do not match a file key will be ignored.
Use wildcards `'*'` or `['*']` to select all file keys.

Nested front-matter file keys are referenced using the top-level key. Wildcards will also work.

Example:

_**Note:** `fileKeys` is optional here._

Configuration in `metalsmith.json`:


```json
{
  "metadata": {
    "hero": "Batman"
  },
  "plugins": {
    "metalsmith-inject-metadata": {
      "fileKeys": "gotham"
    }
  }
}
```

Source file `src/index.md`:

```
---
gotham:
  vigilantes:
    bats: {{ hero }} is a vigilante!
---
```

**[⬆ back to top](#metalsmith-inject-metadata)**

## License

MIT

**[⬆ back to top](#metalsmith-inject-metadata)**


[build-badge]: https://travis-ci.org/davidtimmons/metalsmith-inject-metadata.svg
[build-url]: https://travis-ci.org/davidtimmons/metalsmith-inject-metadata
[downloads-badge]: https://img.shields.io/npm/dm/metalsmith-inject-metadata.svg
[downloads-url]: https://www.npmjs.com/package/metalsmith-inject-metadata
[version-badge]: https://img.shields.io/npm/v/metalsmith-inject-metadata.svg
[version-url]: https://www.npmjs.com/package/metalsmith-inject-metadata

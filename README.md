# Markdown Full Text Search Tool

A CLI tool to index and search through markdown files.

## Installation

1. Clone to a location on your PATH.
2. Run `npm install`.

## Usage

### Search

To search "hello world" simply pass the query to kp like so:

```bash
mds hello world
```

Mds uses lunr.js to perform full text search details of the query syntax can bbe found here https://lunrjs.com/guides/searching.html.

### Rebuild the index

To rebuild the index use the `-r` option:

```bash
mds -r hello world
```

> Note: mds doesn't automatically detect changes to the filesystem.

## Configuration

By default mds will search files in `~/notes` this can be overridden by setting the directories in `~/.mds/config.json`:

```json
{
  "directories": [
    "~/my_notes",
    "~/notes"
  ]
}
```


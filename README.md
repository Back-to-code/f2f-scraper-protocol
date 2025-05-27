# Scraper

This repo describes how a scraper should work and gives helper libaries for building a scraper

- [Open API Spec](./openapi.yaml) _(scraper should implement this and is implemented by the libaries under here)_
- [Lib spec](./lib_spec.md)

## Libs:

- [GoLang lib](./README_go.md)
- [Deno lib](./README_deno.md)
- [Bun lib](./README_bun.md)

## Why is this repo public?

This makes it a lot easier to use this as a library in other project.

But keep that also in mind when adding new features

## Getting started:

### Bun

```sh
cp bun.tsconfig.json tsconfig.json
bun install
```

### Deno

```sh
cp deno.tsconfig.json tsconfig.json
deno cache mod.ts
```
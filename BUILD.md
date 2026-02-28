# Build Instructions

## Requirements

| Requirement | Version |
|---|---|
| Operating System | Windows, Linux, or macOS |
| Node.js | 22.x (download: https://nodejs.org/) |
| npm | 10.x (bundled with Node.js 22) |

> **Note:** Node.js 22 dropped support for OpenSSL's legacy MD4 hash algorithm.
> Angular 11's bundler (webpack 4) requires it internally. The `.npmrc` file in
> this repository sets `node-options=--openssl-legacy-provider` automatically so
> that all `npm run` commands work without any extra flags.

## Steps

1. **Install dependencies**
   ```
   npm install
   ```

2. **Build the extension and package the XPI**
   ```
   npm run build:xpi
   ```

The signed-ready XPI will be created at `dist/gotify-markdown.xpi`.

## What the build does

- `ng build --prod` — compiles TypeScript source and SCSS, bundles with webpack (via Angular CLI 11), and outputs minified JS/CSS to `dist/gotify-ext/`
- `node build-xpi.js` — copies `src/manifest.prod.json` into the dist folder (with version substitution) and zips the result into `dist/gotify-markdown.xpi`

## Source layout

```
src/
  app/                  Angular application source (TypeScript)
  manifest.json         Development manifest
  manifest.prod.json    Production manifest (used in the XPI)
  ...
build-xpi.js            XPI packaging script
package.json            npm scripts and dependency declarations
angular.json            Angular CLI configuration
tsconfig*.json          TypeScript configuration
```

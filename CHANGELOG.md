# Changelog

All notable changes to AMB Grid are documented in this file.

## [0.5.0] - 2026-08-10

### Added

- Integrated TypeScript declarations in the npm package, with no separate
  `@types` package required.
- Official React, Vue, and Angular integration examples using the public
  framework-agnostic lifecycle without framework-specific wrappers.
- A standalone browser UMD bundle exposing the public global directly as `AMB`.
- A dedicated browser smoke test for standalone legacy loading and grid creation.
- Reproducible generation and verification of the standalone legacy ZIP package.
- A GitHub Actions workflow that creates a GitHub Release when a matching
  version tag is pushed.

### Changed

- Consolidated npm packaging for the modern and legacy distributions.
- Added a unified distribution build that produces ESM, UMD, and TypeScript
  declarations.
- Extended package verification to inspect the real tarball, install it in a
  consumer project, build the JavaScript consumer, and type-check a TypeScript
  consumer.
- Completed npm repository, homepage, and issue-tracker metadata.
- Made package version verification independent of hardcoded release numbers.
- Updated the README for npm, TypeScript, standalone browser, and framework
  integration usage.

### Distribution

Version 0.5.0 consolidates two official distribution modes for the same pre-1.0
AMB Grid product.

#### Modern npm / ESM

```bash
npm install amb-grid
```

```js
import { AMB } from 'amb-grid';
import 'amb-grid/style.css';
```

The modern package resolves its runtime dependencies through npm.

#### Legacy / standalone browser

```html
<link rel="stylesheet" href="./vendor/amb-grid/amb-grid.css">
<script src="./vendor/amb-grid/amb-grid.umd.js"></script>
```

```js
const grid = AMB.table({ ... });
```

The standalone bundle incorporates its JavaScript runtime dependencies. Do not
load Tabulator, Awesomplete, or vanilla-datepicker separately in this scenario.

## [0.4.0]

Functional baseline preceding the distribution work introduced in 0.5.0.

# Changelog

All notable changes to AMB Grid are documented in this file.

## [0.6.0] - 2026-08-21

### Added

- Added `timeToPayload()` for canonical `HH:MM:SS` payload values.
- Added `booleanToPayload()` with configurable backend values.
- Added `custom(parseFn)` for application-defined and domain-specific payload normalization.

### Changed

- Refocused the parser API on meaningful structural and backend-oriented transformations.
- Updated the Parsers demo to demonstrate numeric, date, time, boolean, null and custom payload normalization.

### Removed

- Removed the public `trim()`, `uppercase()`, `removeSpaces()`, `digitsOnly()`, `ibanToPayload()` and `fiscalCodeToPayload()` parsers.
- Domain-specific transformations should now use `AMB.parsers.custom(...)`.

The removal is intentionally breaking in the pre-1.0 phase and justifies the
transition from 0.5.1 to 0.6.0.

## [0.5.1] - 2026-08-21

### Fixed

- Corrected keyboard lifecycle for date editors with calendar selection.
- Kept highlighted calendar dates distinct from confirmed selections.
- Preserved the existing date when leaving the calendar without confirming a newly highlighted day.
- Restored predictable forward and backward keyboard navigation after picker-only selection.
- Kept picker-only editing stable when reached through keyboard navigation.

### Changed

- Clarified the public keyboard contract for date editors.
- Removed implementation-specific dependency names from public documentation and tests.

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

The standalone bundle already incorporates its internal JavaScript runtime
dependencies. They do not need to be loaded separately in this scenario.

## [0.4.0]

Functional baseline preceding the distribution work introduced in 0.5.0.

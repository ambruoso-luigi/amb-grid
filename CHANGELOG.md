# Changelog

All notable changes to AMB Grid are documented in this file.

## [Unreleased]

### Added

- Added global keyboard shortcuts for page navigation and same-column vertical navigation.
- Added contextual cell messages that follow both pointer movement and keyboard focus, with validation errors taking priority over descriptions and previews.

### Fixed

- Preserved the full AMB validation context for child validators in `anyOf` and `allOf`.
- Made pattern validation deterministic for global and sticky `RegExp` values.
- Prevented normal cell interaction from changing row selection when the managed selection column is enabled.
- Made keyboard-focused large-text cells visibly identifiable while remaining outside edit mode.
- Preserved the active editor and focus through paginated keyboard navigation, including partial final pages.
- Kept lookup keyboard selection and automatic scrolling aligned while navigating results.
- Preserved lookup editing and keyboard focus after selecting a dialog result.
- Skipped row action cells without an available action during keyboard navigation.
- Prevented unknown row states from falling through to Delete.
- Reused shared AMB navigation for row-action focus restoration where applicable.

### Changed

- Documented declarative `validation: { ... }` as the recommended syntax for ordinary column validation, and updated the Parser and Validation demos to use the public table controller rather than direct CRUD-layer access.
- Renamed the managed row action configuration from `deleteColumn` to `rowActionColumn` (breaking, no compatibility alias); the removed configuration name now fails fast with a migration error. The separate `grid.deleteColumn(...)` controller method for application data columns is unchanged.
- Extended `Tab` and `Shift+Tab` navigation across local page boundaries with predictable focus exit at absolute boundaries.
- Changed large-text cells to focus-first activation: `Enter` opens a focus-trapped dialog that restores focus to its source cell after closing.
- Made the most recent real pointer or keyboard interaction the owner of contextual cell messages.
- Replaced built-in row action icons with platform-independent AMB SVGs while preserving custom icon text overrides.

### Removed

- Removed the large-text `tabBehavior` option and its save-and-navigate Tab behavior.

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

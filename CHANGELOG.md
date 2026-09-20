# Changelog

All notable changes to AMB Grid are documented in this file.

## [Unreleased]

### Added

- Added public `cellEditing.mouseTrigger`, with default single-click focus and
  double-click editing plus explicit `single-click` compatibility mode.
- Added configurable F2 auxiliary actions for AMB Grid cells, initially supported by Lookup editors.
- Added F2 calendar actions for Date editors with a picker; manual Date keeps
  Enter for commit, while picker-only accepts Enter or F2.
- Added configurable commit/cancel keyboard bindings for standard inline editors.
- Configurable `keyboardNavigation` with four-direction spatial cell navigation.
- Arrow navigation focuses operational editable or interactive cells without
  opening ordinary editors, skipping read-only and unavailable cells.

### Fixed

- Isolated deferred keyboard-close focus restoration per grid so pointer input
  in one AMB Grid cannot cancel a pending restore in another.
- Kept special AMB controls as the owner of their immediate pointer actions,
  while normal cells retain click-to-focus and double-click-to-edit behavior.
- Preserved the most recent pointer focus destination when a keyboard-close
  focus restoration is still pending.
- Prevented spatial keyboard focus from activating editable cells while moving with directional arrows.
- Kept column calculations synchronized after committed cell edits and CRUD delete/rollback state transitions.
- Stabilized contextual lookup descriptions during pointer movement and asynchronous metadata refreshes while preserving lookup rollback metadata across ordinary data changes.
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

- Lookup keyboard behavior now uses Enter for manual commit and F2 for opening the search dialog.
- ArrowUp/ArrowDown spatial navigation now continues across adjacent pages while preserving the current column.
- Standard inline editors return focus to the source cell after keyboard commit or cancel.
- Default `Alt+ArrowUp`/`Alt+ArrowDown` row navigation was removed; configure those bindings explicitly when needed.
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

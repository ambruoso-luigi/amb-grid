# AMB Grid library structure audit

> Implementation update: the first post-audit step is complete. Reusable
> styles now live in `src/amb-grid.css`, demo styles live in
> `src/demo/demo.css`, and `src/style.css` is a compatibility import. AMB Grid
> also includes an optional callback-driven Save/Reload toolbar. The npm
> package and library-build recommendations below remain pending.

## Executive summary

The repository can evolve into a clean npm library without a structural
rewrite. The JavaScript boundary is already mostly sound: reusable code lives
under `src/lib` and `src/ui`, the public module is `src/index.js`, and the Vite
application starts from `src/main.js` and delegates to `src/demo/main.js`.

The remaining work before npm publication is packaging, not core refactoring:

- add a dedicated library build beside the existing demo build;
- define package exports and published files;
- test the public entrypoint and packaged output.

No runtime or public API changes were made as part of this audit.

## 1. Current structure

| Path | Current responsibility | Assessment |
| --- | --- | --- |
| `src/index.js` | Public JavaScript exports | Correct candidate for the library entrypoint |
| `src/lib/` | CRUD state, table integration, editors, validators, parsers, formatters, lookup | Correct library core/application layer |
| `src/ui/` | Reusable dialogs, messages, bindings, and component CSS | Correct reusable UI area |
| `src/main.js` | Imports `src/demo/main.js` | Demo application entrypoint only |
| `src/demo/` | Demo shell and examples | Correctly outside the library entrypoint |
| `demo/fake-backend/` | Demo-only data simulation | Correctly separate from the library |
| `public/demo/` | Static demo assets and municipality data | Correctly separate from the core bundle |
| `tests/` | Unit and lifecycle tests plus a small number of demo guards | Mostly core-oriented |
| `docs/` | Generated JSDoc plus hand-written notes | Usable, but generated and internal docs share one tree |

Tabulator is consistently treated as the table engine. AMB Grid owns the CRUD
application layer around it: state, validation, rollback, lookup behavior,
payloads, and lifecycle.

## 2. Library entrypoint

`src/index.js` is the correct future library entrypoint.

It exports:

- the `AMB` namespace;
- `CrudHelper` and `ROW_STATE`;
- validators, formatters, editors, parsers, and date helpers;
- `createLookup`;
- the reusable dialog classes.

It does not import or export demo modules, fake backend code, or demo data.
This is the most important boundary, and it is currently clean.

Two API details should be decided before npm publication:

1. `AMB.table` is public through the namespace, but `createTable` is not a named
   export from `src/index.js`, even though `src/lib/table/index.js` exposes it.
2. `AMB.lookup` is the primary namespace API, while the named export is
   `createLookup`. This is reasonable, but should be intentionally documented.

Neither point requires an immediate change. Adding a named export is normally
backward-compatible, but the desired public surface should be frozen before
the first stable package.

There is one transitive style side effect: importing the editor collection
loads `awesomplete/awesomplete.css` from the autocomplete editor. Other AMB
styles are not imported by `src/index.js`. That asymmetry should be resolved as
part of the future CSS/package design.

## 3. Demo entrypoint

`index.html` loads `/src/main.js`, and `src/main.js` imports only
`src/demo/main.js`. Therefore `src/main.js` is a demo/Vite entrypoint, not a
library entrypoint.

`src/demo/main.js`:

- imports demo and third-party CSS;
- imports examples;
- mounts and destroys the selected example;
- exposes `AMB` on `window` for demo convenience.

This is correctly separated from `src/index.js`. Demo modules import the
library through `src/index.js`, which is useful integration coverage.

`src/demo/index.html` is a second minimal demo HTML entry, while the root
`index.html` is the entry actually used by the current Vite build. This is not
currently harmful, but its intended use should be documented or the duplicate
entry should eventually be removed.

The static municipality JSON is fetched from `public/demo`; it is copied to the
demo build but is not imported into the JavaScript library graph.

## 4. CSS separation

The CSS split proposed by the original audit has now been implemented.

`src/demo/demo.css` contains demo/site rules including:

- global `body`, `h1`, and `h2` rules;
- `.demo-*`;
- `.toolbar` and `.toolbar button`.

`src/amb-grid.css` contains reusable library rules including:

- `.amb-date-*`;
- `.amb-autocomplete-*` and Awesomplete integration rules;
- `.amb-toolbar*` and `.amb-search-toolbar*`;
- `.amb-row-*` action rules;
- `.amb-selection-*`;
- `.amb-checkbox-*`;
- Tabulator row/cell state selectors;
- `.amb-lookup-*`;
- `.amb-large-text-*`.

Reusable component CSS remains organized in:

- `src/ui/lookup-dialog.css`;
- `src/ui/search-filters-dialog.css`;
- `src/ui/confirm-dialog.css`;
- `src/ui/floating-message.css`.

The confirm and floating-message components still use the older `teh-*`
prefix, while newer reusable UI uses `amb-*`. This is a naming consistency
issue, not a release blocker. Renaming those classes would be a public styling
change and should be handled separately.

`src/amb-grid.css` aggregates those component files. `src/style.css` imports
both the library and demo styles for temporary compatibility. The future
package should expose the built equivalent of `src/amb-grid.css` as its
documented complete stylesheet. Tabulator and datepicker CSS ownership should
remain an explicit consumer/documentation policy.

## 5. Package readiness

`package.json` currently describes an application repository, not a publishable
library package. It has useful metadata (`name`, `version`, description,
license, keywords, ESM mode), but no package entry or publication contract.

Before npm publication, evaluate and add:

- `repository`, `homepage`, and `bugs`;
- `main` and/or `module`, depending on output formats;
- an `exports` map for JavaScript and CSS;
- `files` to whitelist distributable artifacts, README, and license;
- `types` only when declarations exist;
- `sideEffects` with CSS explicitly preserved if tree shaking is supported;
- a `publishConfig` if package visibility or registry settings require it;
- an engines policy aligned with supported tooling/runtime targets.

Dependency policy also needs an explicit decision. Tabulator, Awesomplete, and
the datepicker are currently runtime dependencies. For npm, Tabulator may be
better as a peer dependency if applications are expected to control its
version and avoid duplicate table engines. That decision should be tested
before changing dependency categories.

`fflate` is a development-only dependency used by the demo-data generator and
should not enter the runtime package.

## 6. Build readiness

The current `npm run build` executes a standard Vite application build from the
root `index.html`. The output confirms that it is demo-oriented:

- hashed application JavaScript and CSS;
- demo HTML;
- copied static demo data.

There is no `vite.config.*` and no separate library-mode build. The current
build is appropriate for local demos and is a reasonable basis for a future
static demo site, but it is not an npm library artifact.

A simple future strategy is:

1. keep the existing demo build command, possibly renamed `build:demo`;
2. add a separate Vite library-mode configuration using `src/index.js`;
3. emit ESM first, with another format only if consumers require it;
4. emit or copy the documented library CSS entry;
5. externalize peer dependencies according to the final dependency policy;
6. add an aggregate `build` command that runs both only when useful.

GitHub Pages can later publish only the demo build. The present source
boundaries already allow that without mixing demo code into the library
entrypoint.

## 7. Documentation readiness

The README uses the correct positioning: Tabulator is the table engine and AMB
Grid is the CRUD application layer. It does not describe the project as a
simple wrapper.

JSDoc includes `src` recursively and excludes paths matching `demo`, so demo
modules are not part of generated API documentation. This is the correct
direction for library documentation.

Current limitations:

- generated API documentation is committed under `docs`, while internal notes
  also live under `docs`; the distinction should remain explicit;
- the README has development instructions but not yet package installation,
  import, CSS, bundler, or browser-support guidance;
- CI runs tests and the demo build but does not verify JSDoc generation.

`npm.cmd run docs` is the reliable PowerShell command on the current Windows
setup; `npm run docs` remains valid on CI and other shells.

## 8. Test readiness

The test suite primarily imports focused modules from `src/lib` and `src/ui`.
It covers CRUD state, validation, editors, formatters, parsers, lookup behavior,
and lifecycle cleanup without depending on the demo application.

The municipality dataset tests intentionally cover demo integration and are
appropriately isolated from core behavior.

Before npm publication, add:

- a public-entry smoke test importing only `src/index.js` or the built package;
- an export-contract test for the supported named exports and `AMB` namespace;
- a library-build test that proves demo modules and demo data are absent;
- a package-content test using `npm pack --dry-run`;
- a CSS contract test confirming that the documented stylesheet contains the
  required AMB selectors;
- optionally, a small browser integration test that creates and destroys an
  `AMB.table`.

The CI workflow is a good baseline. Before publication it should also run the
library build and, ideally, documentation generation or a docs drift check.

## 9. Recommended next steps

### A. Do now

1. Keep `src/index.js` as the intended library entrypoint and document that
   decision.
2. Treat `src/main.js` and `src/demo/main.js` as demo-only entrypoints.
3. Keep the new library/demo CSS boundary stable.
4. Decide whether `createTable` should become a named public export.
5. Add a lightweight public-entry/export smoke test.

### B. Do before npm publication

1. Add a dedicated library build and retain a separate demo build.
2. Define `exports`, `files`, entry fields, side-effect metadata, repository
   metadata, and the runtime/peer dependency policy.
3. Verify the packed artifact and ensure it excludes demos, generated demo
   data, tests, and internal documentation.
4. Add package installation/import/CSS instructions to the README.
5. Extend CI to test the library build and package contents.

### C. Can wait

1. TypeScript declarations.
2. Additional module subpath exports.
3. GitHub Pages deployment.
4. Renaming legacy `teh-*` CSS classes.
5. Redesigning demo navigation or visual styling.
6. Supporting additional bundle formats without demonstrated consumer demand.

## Conclusion

The repository is structurally suitable for becoming an npm library. It does
not need a core rewrite or mass file movement. The JavaScript separation is
already strong; CSS ownership is now explicit, leaving build outputs and
package metadata as the main release-readiness work.

# Third-party references audit

Audit date: 2026-07-17.

Scope: repository references to external dependencies, external assets, credits, generated documentation, and direct access to the underlying table engine. This report does not change application code, README, package metadata, licenses, demo files, tests, or generated documentation.

## 1. Executive summary

AMB Grid currently has three runtime npm dependencies declared in `dependencies`: `tabulator-tables`, `awesomplete`, and `vanillajs-datepicker`. These are real library runtime requirements and should remain declared in `package.json` and `package-lock.json`. The public communication should still make AMB Grid the subject and describe these packages as focused implementation dependencies or integration details.

The demo/site and development toolchain uses `lucide`, `motion`, `tailwindcss`, `@tailwindcss/postcss`, `daisyui`, `vite`, `vitest`, `@playwright/test`, `jsdoc`, and `fflate`. These should not be described as AMB Grid runtime requirements. Their references belong in build, demo, test, documentation-generation, or notices contexts.

The most problematic communication areas are:

- `README.md:3` and `package.json:4`, where AMB Grid is introduced as "powered by Tabulator".
- `src/demo/main.js:39`, `src/demo/main.js:45`, `src/demo/main.js:47`, `src/demo/main.js:154`, `src/demo/main.js:160`, and `src/demo/main.js:162`, where the hero/subtitle positions make Tabulator too prominent.
- JSDoc in `src/lib/table/table-factory.js`, `src/lib/crud-helper.js`, `src/lib/formatters.js`, and editor factories, where return types and descriptions repeatedly say "Tabulator".
- Demo code that calls `grid.table` / `demo.table` directly for reload/reset flows.

References that should remain include package declarations, imports, CSS imports required by actual integration, local license files in `node_modules`, the root `LICENSE`, dataset provenance notes, and precise technical documentation where the underlying table engine is part of the contract.

References that can be reduced or moved include marketing-style phrases, README opening language, demo hero copy, generic "Tabulator formatter/editor" return wording, and examples that can eventually use AMB Grid controller methods instead of direct `grid.table` access.

Main risks to verify later:

- No project-level `THIRD_PARTY_NOTICES.md` or `NOTICE.md` exists yet for direct dependencies and copied/local assets.
- `@playwright/test` includes a local `NOTICE` mentioning derived Puppeteer code; preserve this in a future notices audit.
- `package-lock.json` includes transitive licenses beyond MIT/Apache/ISC, including `MPL-2.0`, `BSD-2-Clause`, `BSD-3-Clause`, `Python-2.0`, `Unlicense`, and `0BSD`; these are dev/toolchain transitive entries, but they should be reviewed before publishing bundled artifacts.
- Local assets such as `src/assets/vite.svg`, `src/assets/javascript.svg`, `public/icons.svg`, and generated demo data need provenance/notice verification before any distribution decision.

## 2. Dependency inventory

| Componente | Ruolo | Runtime/dev/demo/test | Uso individuato | Licenza dichiarata | Verifica necessaria |
| --- | --- | --- | --- | --- | --- |
| Tabulator (`tabulator-tables`) | Table engine used by AMB Grid | Runtime library dependency; CSS also imported by demo/test pages | `src/lib/table/table-factory.js:1`, `src/demo/main.js:1`, `src/demo/test.js:1`, README and JSDoc references | MIT in `node_modules/tabulator-tables/package.json`; `LICENSE` present; lockfile says MIT | Future `THIRD_PARTY_NOTICES.md`; confirm whether distributed CSS/JS bundles need license text placement |
| Awesomplete | Autocomplete suggestion engine | Runtime library dependency | `src/lib/editors/autocomplete-editor.js:1`, `src/lib/editors/autocomplete-editor.js:2`, helper JSDoc in `autocomplete-editor-utils.js` | MIT in `node_modules/awesomplete/package.json`; `LICENSE` present; lockfile says MIT | Notice placement for bundled editor CSS/JS |
| vanillajs-datepicker | Date picker UI used by date editor | Runtime library dependency | `src/lib/editors/date-editor.js:1`, demo CSS import in `src/demo/main.js:2` and `src/demo/test.js:2` | MIT in `node_modules/vanillajs-datepicker/package.json`; `LICENSE` present; lockfile says MIT | Notice placement for bundled picker code/CSS |
| Lucide (`lucide`) | Demo/site icons | Demo/site only, declared in devDependencies | `src/demo/demo-icons.js:28` | ISC in `node_modules/lucide/package.json`; `LICENSE` present; lockfile says ISC | Verify icon attribution expectations before publishing demo/site bundle |
| Motion (`motion`) | Demo/site animations | Demo/site only, declared in devDependencies | `src/demo/demo-motion.js:1` | MIT in `node_modules/motion/package.json`; `LICENSE.md` present; lockfile says MIT | Include in demo/site notices if demo bundle is distributed |
| Framer Motion / motion-dom / motion-utils | Transitive dependencies of `motion` | Transitive demo/site dependency | `package-lock.json` entries under `motion` | MIT in lockfile for relevant entries | Da verificare in future notices pass; not an AMB Grid runtime dependency unless demo bundle is distributed |
| Tailwind CSS (`tailwindcss`) | Demo/site CSS build | Demo/site/dev only | `src/demo/demo.css:1`, `tailwind.config.js`, package scripts through Vite/PostCSS | MIT in `node_modules/tailwindcss/package.json`; `LICENSE` present; lockfile says MIT | Keep as build/demo dependency, not runtime library requirement |
| `@tailwindcss/postcss` | Tailwind PostCSS integration | Demo/site/dev only | `postcss.config.js:3`, package devDependency | MIT in `node_modules/@tailwindcss/postcss/package.json`; lockfile says MIT | Verify transitive notices for build chain if distributing compiled site assets |
| DaisyUI (`daisyui`) | Tailwind plugin for demo/site styling | Demo/site/dev only | `src/demo/demo.css:4`, tested by `tests/full-demo.test.js` | MIT in `node_modules/daisyui/package.json`; `LICENSE` present; lockfile says MIT | Demo/site notice if needed |
| fflate | ZIP/XLSX extraction for demo dataset generator | Script/dev only | `scripts/generate-italian-municipalities-demo.mjs:3` | MIT in `node_modules/fflate/package.json`; `LICENSE` present; lockfile says MIT | Not runtime; include only if scripts are distributed as part of source package notices |
| Playwright (`@playwright/test`, `playwright`, `playwright-core`) | E2E/browser automation | Test/dev only | `playwright.config.js:1`, `scripts/run-e2e.mjs:16`, `tests/e2e/*.js` | Apache-2.0 in package metadata; `node_modules/@playwright/test/NOTICE` present | Preserve Playwright/Puppeteer notice in future `THIRD_PARTY_NOTICES.md`; not runtime |
| Vite | Dev server and build tool | Build/dev/demo only | `package.json` scripts, `scripts/run-e2e.mjs:2`, `playwright.config.js:21` | MIT in `node_modules/vite/package.json`; `LICENSE.md` present; lockfile says MIT | `src/assets/vite.svg` provenance should be verified separately |
| Vitest | Unit test runner | Test/dev only | `package.json` scripts; imports in `tests/*.test.js` | MIT in `node_modules/vitest/package.json`; `LICENSE.md` present; lockfile says MIT | Not runtime |
| JSDoc | Documentation generator | Docs/dev only | `package.json` docs script, `jsdoc.json`, generated footer in `docs/*.html` | Apache-2.0 in `node_modules/jsdoc/package.json`; `LICENSE.md` and `Apache_License_2.0.txt` present | Generated docs footer should remain; future notices may mention docs tool only if docs bundle requires it |
| lightningcss and platform packages | Vite/Tailwind build transitive | Transitive build/dev | `package-lock.json` entries around `lightningcss` | MPL-2.0 in lockfile | Da verificare before publication; transitive dev/build, not AMB Grid runtime |
| argparse | JSDoc/Vitest transitive dev dependency | Transitive dev/test | `package-lock.json` entry for `argparse` | Python-2.0 in lockfile | Da verificare; not runtime |
| source-map-js | Build/test transitive dependency | Transitive dev | `package-lock.json` entry | BSD-3-Clause in lockfile | Da verificare in notices pass |
| Node built-ins (`fs`, `path`, `child_process`) | Scripts/tests | Runtime of scripts/tests, not third-party | `scripts/*.mjs`, tests reading files | Node.js platform, no npm license entry | No third-party notice from npm dependency inventory |
| GitHub Actions (`actions/setup-node@v4`) | CI action | CI only | `.github/workflows/ci.yml` | Da verificare | External service/action reference; not runtime |
| ISTAT workbook | Demo dataset source | Demo data provenance | `public/demo/data/README.md`, `scripts/generate-italian-municipalities-demo.mjs` | Da verificare | Keep provenance and disclaimer until verified |
| `matteocontrini/comuni-json` | Demo postal-code overlay source | Demo data provenance | `public/demo/data/README.md` | Da verificare locally; no package installed | Keep attribution/disclaimer until verified |

## 3. Reference inventory

| Componente | File e posizione | Contesto | Categoria | Azione futura | Priorita |
| --- | --- | --- | --- | --- | --- |
| Tabulator | `package.json:4` | Short package description says AMB Grid is "powered by Tabulator" | Narrativo o marketing | Reword around AMB Grid as the product; keep Tabulator in technical/dependency section | Alta |
| Tabulator | `package.json:10` | Keyword `tabulator` | Tecnico utile | Keep unless package positioning changes; it helps discover integration compatibility | Bassa |
| Direct dependencies | `package.json`, `package-lock.json` | Dependency declarations and locked resolved packages | Obbligatorio per licenza | Keep; future notice file should summarize direct dependencies and licenses | Alta |
| Tabulator | `README.md:3` | Opening project description | Narrativo o marketing | Reword to AMB Grid-first; move "table engine" detail later | Alta |
| Tabulator | `README.md:5` | Clarifies AMB Grid is not only a wrapper | Tecnico utile | Keep concept, abbreviate dependency prominence | Media |
| Tabulator, Awesomplete, vanillajs-datepicker | `README.md:53-59` | Third-party components section | Tecnico utile | Keep, but make it a concise "Implementation dependencies" / "Technical dependencies" section | Media |
| Tabulator | `README.md:139`, `README.md:230`, `README.md:558`, `README.md:574-586` | Integration/lifecycle details | Tecnico utile | Keep where exact engine behavior matters; reduce repetition | Media |
| Awesomplete | `README.md:484` | Autocomplete feature says "powered by Awesomplete" | Narrativo o marketing | Reword as AMB Grid autocomplete uses Awesomplete internally | Media |
| vanillajs-datepicker | `README.md:243-303` | Date editor behavior | Tecnico utile | Keep generic "datepicker" wording; mention package only where implementation matters | Bassa |
| ISTAT and postal-code overlay | `README.md:468-480`, `public/demo/data/README.md` | Demo dataset provenance and disclaimer | Obbligatorio per licenza | Keep until source terms are verified; future notices/data provenance section | Alta |
| Tabulator | `src/demo/main.js:39`, `154` | Demo/site subtitle "powered by Tabulator" | Narrativo o marketing | Reword AMB Grid-first in both Italian and English strings | Alta |
| Tabulator | `src/demo/main.js:45`, `160` | Hero badge detail says CRUD layer for Tabulator | Narrativo o marketing | Reword badge to AMB Grid capability, not dependency | Alta |
| Tabulator | `src/demo/main.js:47`, `162`, `405`, `408` | Hero description makes Tabulator prominent | Narrativo o marketing | Reword as AMB Grid managing CRUD grids; mention engine in technical note | Alta |
| Tabulator | `src/demo/main.js:122`, `237`, `src/demo/getting-started-javascript.js:106` | Guide step: AMB.table mounts Tabulator | Tecnico utile | Keep but shorten or move after AMB Grid API explanation | Media |
| Tabulator | `src/demo/main.js:132`, `247`, `src/demo/getting-started-javascript.js:155` | Framework-agnostic explanation | Tecnico utile | Keep as architectural explanation, but make AMB Grid the grammatical subject | Media |
| Tabulator CDN | `src/demo/getting-started-javascript.js:188`, `194` | Planned legacy/browser example references `unpkg.com/tabulator-tables@6.3.1` | Tecnico utile | Verify version and future browser-bundle plan; keep only in advanced/legacy setup | Media |
| Tabulator CSS | `src/demo/main.js:1`, `src/demo/test.js:1` | Demo/test page imports engine stylesheet | Tecnico utile | Keep; required by demo rendering unless AMB Grid bundles or wraps styles later | Alta |
| vanillajs-datepicker CSS | `src/demo/main.js:2`, `src/demo/test.js:2` | Demo/test page imports picker stylesheet | Tecnico utile | Keep while picker CSS is not wrapped by AMB Grid stylesheet | Alta |
| Tabulator | `src/lib/table/table-factory.js:1`, `822` | Actual table engine import and construction | Tecnico utile | Keep; this is the real integration point | Alta |
| Tabulator | `src/lib/table/table-factory.js:611-701` | Public typedef and createTable JSDoc repeatedly mention engine details | JSDoc troppo dipendente dal componente esterno | Rewrite as AMB Grid-oriented; keep exact pass-through options in technical paragraphs | Alta |
| Tabulator | `src/lib/crud-helper.js:32-41`, `1266-1279`, `1615-1654`, `1848`, `2100-2104` | CrudHelper JSDoc uses Tabulator as the framing object | JSDoc troppo dipendente dal componente esterno | Rewrite common descriptions around AMB Grid row components/lifecycle; keep exact engine component wording where contract requires it | Alta |
| Tabulator | `src/lib/formatters.js:35-315` | Formatter JSDoc returns "Tabulator formatter" repeatedly | JSDoc troppo dipendente dal componente esterno | Replace repetitive wording with AMB Grid formatter factory wording; keep one technical compatibility note | Media |
| Tabulator | `src/lib/editors/*.js` | Editor JSDoc returns "Tabulator editor" repeatedly | JSDoc troppo dipendente dal componente esterno | Rewrite as AMB Grid editor factories compatible with column editor hooks | Media |
| Awesomplete | `src/lib/editors/autocomplete-editor.js`, `autocomplete-editor-utils.js` | Import, CSS import, technical options, event names | Tecnico utile | Keep names in import/events/options; reduce narrative text in public docs | Media |
| vanillajs-datepicker | `src/lib/editors/date-editor.js` | Import and instance methods | Tecnico utile | Keep exact class/import; avoid public docs implying picker owns validation | Media |
| Tailwind CSS / DaisyUI | `src/demo/demo.css:1-4`, `postcss.config.js:3`, `tailwind.config.js` | Demo/site styling toolchain | Tecnico utile | Keep in demo/build context; do not describe as AMB Grid runtime styling dependency | Media |
| Lucide | `src/demo/demo-icons.js:28` | Demo icon generation | Tecnico utile | Keep import; add future demo/site notice if needed | Bassa |
| Motion | `src/demo/demo-motion.js:1` | Demo animations | Tecnico utile | Keep import; not relevant to library runtime docs | Bassa |
| fflate | `scripts/generate-italian-municipalities-demo.mjs:3` | Local dataset generation from workbook ZIP | Tecnico utile | Keep; document as script-only if later package docs mention dataset generation | Bassa |
| Playwright | `playwright.config.js`, `scripts/run-e2e.mjs`, `tests/e2e/*.js` | E2E test tooling | Tecnico utile | Keep in test/tooling context only | Bassa |
| Vitest | `tests/*.test.js`, `package.json` scripts | Unit test tooling | Tecnico utile | Keep in test context only | Bassa |
| Vite | `package.json` scripts, `scripts/run-e2e.mjs:2`, `playwright.config.js:21` | Dev server/build/test server | Tecnico utile | Keep in tooling context only | Bassa |
| JSDoc | `jsdoc.json`, `package.json:27`, generated `docs/*.html` footer | Documentation generation | Tecnico utile | Keep docs footer; generated docs should be updated only through docs generation | Bassa |
| JSDoc generated pages | `docs/*.html` | Generated copies of source JSDoc plus JSDoc footer | JSDoc troppo dipendente dal componente esterno | Do not edit generated pages directly; update source JSDoc files listed above | Media |
| Root Apache license | `LICENSE`, `README.md:608-612`, `package.json:6` | Project license | Obbligatorio per licenza | Keep | Alta |
| Local Vite/JS template assets | `src/assets/vite.svg`, `src/assets/javascript.svg` | Copied starter assets | Obbligatorio per licenza | Da verificare; remove or replace in a separate asset cleanup only after provenance check | Media |
| Social/public icons | `public/icons.svg`, `public/favicon.svg` | Local public SVG assets | Obbligatorio per licenza | Da verificare provenance/ownership before publishing | Media |
| AMB logo | `src/demo/amb-grid-logo.png`, `src/assets/hero.png` | Local brand/demo imagery | Obbligatorio per licenza | Da verificare provenance and intended distribution | Media |

Approximate grouped category counts from this audit:

- Obbligatorio per licenza: about 8 grouped reference areas.
- Tecnico utile: about 24 grouped reference areas.
- Narrativo o marketing: about 7 grouped reference areas.
- JSDoc troppo dipendente dal componente esterno: about 5 grouped source areas, with many generated `docs/` copies.

## 4. Direct API exposure

Direct public/demo access to the underlying table engine should be tracked separately from internal implementation access.

### Accessi interni legittimi

- `src/lib/table/table-factory.js` constructs and delegates to the internal table engine (`new Tabulator(...)`, pagination, row, header-filter, redraw, refresh and destroy methods). This is legitimate implementation code.
- `src/lib/crud-helper.js` stores `this.table` and uses row components, events, pagination, and search APIs. This is internal CRUD integration.
- `src/lib/table/delete-column.js`, `selection-column.js`, `hover-binders.js`, and `search-controller.js` use the table object internally. These are legitimate implementation references.
- `src/lib/validators.js:627` and `637` use `helper.table.getRows()` for uniqueness validation. This is internal and should be reviewed only if CrudHelper exposes a better AMB Grid row iterator later.
- `src/ui/lookup-dialog.js` has `this.table` as a DOM table element, not a Tabulator/table-engine exposure.

### Accessi usati nei test

- Many controller tests assert `controller.table` identity, for example `tests/table-controller-data-read.test.js:135`, `tests/table-controller-filter-refresh.test.js:205`, and similar pagination/row/selection tests. These are test coverage for the current public controller shape.
- Tests also assert internal table methods are or are not called. These should stay until the public contract changes.
- Demo source tests intentionally check current direct demo usage, for example `tests/demo-report-dialog.test.js:71`, `tests/full-demo.test.js:69`, and `tests/row-states-demo.test.js:121`.

### Accessi presenti nelle demo

- `src/demo/basic-crud.js:199`: `await demo.table.setData(...)`.
- `src/demo/autocomplete.js:273`: `await demo.table.setData(...)`.
- `src/demo/full-demo.js:616`: `await demo.table.setData(...)`.
- `src/demo/row-states.js:217`: `demo.table.getRows().forEach(...)`.
- `src/demo/row-states.js:314`: `await demo.table.setData(...)`.
- `src/demo/multifield-lookup.js:316`: `await grid.table.setData(...)`.
- `src/demo/test.js:526`: `await grid.table.setData(...)`.

These should eventually migrate toward AMB Grid controller methods such as future `grid.setData(...)`, `grid.getRows(...)`, or a focused demo reset/reload helper. Do not change them in this audit.

### Accessi mostrati nella documentazione pubblica

- `README.md:574-586` documents lifecycle around `grid.destroy()` and `grid.crud.destroy()` and mentions the Tabulator table lifecycle. It does not show `grid.table...` in the basic examples, but it does teach that the raw table exists.
- Generated `docs/global.html` copies source JSDoc from `src/lib/table/table-factory.js`, including that the returned object exposes the raw Tabulator instance as `table`.
- Generated `docs/CrudHelper.html` copies source JSDoc from `src/lib/crud-helper.js`, including lifecycle text around `table.destroy()`.

### Accessi da migrare verso `grid.<metodo>`

Priority migration candidates:

1. Demo reload/reset calls using `grid.table.setData(...)` / `demo.table.setData(...)`.
2. Demo row iteration using `demo.table.getRows()`.
3. README/JSDoc wording that presents `controller.table` as a primary way to work with AMB Grid.
4. Tests that assert `controller.table` as public shape, after a deliberate API decision.

## 5. License and notice gaps

Notice gia presenti:

- Root `LICENSE` with Apache-2.0 text for AMB Grid.
- `package.json:6` and `package-lock.json:10` declare AMB Grid as Apache-2.0.
- Installed packages include local license files for the main dependencies checked in this audit.
- `node_modules/@playwright/test/NOTICE` contains a Playwright notice and mentions derived Puppeteer code.
- `public/demo/data/README.md` preserves dataset provenance and warns that the dataset is demo-only.
- `README.md:608-612` contains project license and copyright.

Notice mancanti o da preparare:

- No root `THIRD_PARTY_NOTICES.md` or `NOTICE.md` exists for direct dependencies.
- Direct runtime dependencies should be summarized in a future notices file: Tabulator, Awesomplete, vanillajs-datepicker.
- Demo/site dependencies should be listed separately if the demo/site bundle is distributed: Lucide, Motion and its transitive motion packages, Tailwind CSS, @tailwindcss/postcss, DaisyUI, Vite.
- Test/docs/dev dependencies can be listed in a development/tooling section if source distribution wants complete transparency: Vitest, Playwright, JSDoc, fflate.
- Playwright's local `NOTICE` should not be ignored if test tooling or source package notices are included.

Licenze che richiedono verifica:

- Transitive `lightningcss` and platform packages are `MPL-2.0` in `package-lock.json`; they are dev/build transitive entries, not AMB Grid runtime dependencies.
- `argparse` appears as `Python-2.0` in `package-lock.json`; it is a dev transitive dependency.
- Some transitive packages use BSD, ISC, Unlicense, or 0BSD according to `package-lock.json`.
- Dataset sources: ISTAT workbook terms and `matteocontrini/comuni-json` terms should be verified before expanding dataset notices.
- GitHub Actions references such as `actions/setup-node@v4` should be verified if CI dependencies are included in an organizational compliance inventory.

Asset esterni copiati localmente o da verificare:

- `src/assets/vite.svg` appears to be a Vite logo asset and should not be distributed without provenance confirmation.
- `src/assets/javascript.svg` appears to be a JavaScript/logo-style asset and should be verified.
- `public/icons.svg` includes social icons, including a Discord symbol; provenance/license should be verified.
- `public/favicon.svg`, `src/assets/hero.png`, and `src/demo/amb-grid-logo.png` should be checked for ownership/provenance before distribution.
- `public/demo/data/italian-municipalities.demo.json` is generated from external data sources and must keep its demo-only disclaimer until source terms are verified.

Testi da non rimuovere prima della verifica:

- Dataset provenance/disclaimer in `public/demo/data/README.md` and README dataset paragraphs.
- Package names in imports, `package.json`, `package-lock.json`, and CSS imports.
- Generated JSDoc footer naming JSDoc.
- Exact technical references where AMB Grid currently exposes or forwards engine behavior.

## 6. Recommended sequence

1. Create `THIRD_PARTY_NOTICES.md`.
   - Scope: direct runtime dependencies first.
   - Verification: confirm package metadata and license files from installed packages.

2. Add demo/site and tooling notice sections.
   - Scope: Lucide, Motion, Tailwind CSS, @tailwindcss/postcss, DaisyUI, Vite, Vitest, Playwright, JSDoc, fflate.
   - Verification: preserve Playwright NOTICE and flag transitive licenses from `package-lock.json`.

3. Correct project description and metadata.
   - Scope: `package.json:4`, README opening sentence, possible GitHub repository description if it mirrors the package description.
   - Verification: package metadata remains valid and dependency declarations stay unchanged.

4. Reframe README around AMB Grid.
   - Scope: opening, third-party components section, autocomplete/date/search/lifecycle paragraphs.
   - Verification: dependency names remain where technically useful.

5. Reframe demo/site hero copy.
   - Scope: `src/demo/main.js` localized strings and `src/demo/getting-started-javascript.js` guidance copy.
   - Verification: demo text stays bilingual and still explains architecture accurately.

6. Rewrite JSDoc that is too dependency-led.
   - Scope: `src/lib/table/table-factory.js`, `src/lib/crud-helper.js`, `src/lib/formatters.js`, `src/lib/editors/*.js`, `src/lib/amb.js`.
   - Verification: regenerate docs and confirm generated `docs/` changes are source-derived.

7. Migrate demo examples away from direct `grid.table`.
   - Scope: demo reload/reset and row iteration after AMB Grid controller methods exist.
   - Verification: one commit per API wrapper or demo group, with tests updated separately.

8. Verify local/copied assets.
   - Scope: Vite/JavaScript SVGs, social icons, favicon, hero/logo PNGs, generated data.
   - Verification: replace, remove, or document assets in a focused asset/provenance commit.

9. Verify final distribution contents.
   - Scope: npm package `files` / `.npmignore`, dist bundle, docs, demo/site bundle.
   - Verification: licenses and notices included only where the distributed artifact requires them.

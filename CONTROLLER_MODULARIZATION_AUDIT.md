# Controller modularization audit

Audit date: 2026-07-17.

Scope: structural audit of the AMB Grid table controller composition. This report proposes an internal modularization path while preserving the flat public controller API returned by `AMB.table(...)`. No source, test, README, JSDoc, generated documentation, demo, CSS, or dependency files are changed by this audit.

## 1. Executive summary

`src/lib/table/table-factory.js` is currently doing too much. It is both an option/column preparation module, the table orchestration entry point, the public controller object definition, and the lifecycle cleanup coordinator. The file is about 1,249 physical lines by PowerShell `Measure-Object` and about 52.8 KB. `rg` reports controller composition beginning around `table-factory.js:880`, with `destroy()` around `table-factory.js:1349`; line-number differences are caused by line-ending counting, but both measurements confirm the same shape: the file is already past a comfortable size for adding more public methods directly.

The public API should remain flat:

```js
grid.getData();
grid.getRows();
grid.setPage(...);
grid.redraw();
grid.destroy();
```

The recommended direction is to extract internal method factories that return plain method objects, then compose them explicitly into the same flat controller object. Public namespaces such as `grid.pagination.setPage(...)` or `grid.engine.getRows(...)` should not be introduced.

Recommended pattern:

```js
const controllerMethods = composeControllerMethods(
  createSelectionMethods({ table, crud }),
  createSearchMethods({ searchController }),
  createHeaderFilterMethods({ table }),
  createFilterMethods({ table }),
  createDataMethods({ table }),
  createRowMethods({ table, crud }),
  createPaginationMethods({ table, crud }),
  createRedrawMethods({ table })
);

controller = {
  table,
  crud,
  toolbar: toolbarController,
  feedback,
  _floatingMessage: floatingMessage,
  _cellMessageBinder: cellMessageBinder,
  _confirmDialog: confirmDialog,
  ...controllerMethods,
  destroy: createDestroyMethod(lifecycleContext)
};
```

This keeps `grid` flat, keeps dependencies explicit, avoids `Proxy`, avoids classes for now, and provides a natural place to detect duplicate method names.

Recommended first extraction: `redraw-methods.js` with `redraw`, `blockRedraw`, and `restoreRedraw`. It is small, table-only, has an existing dedicated test file, does not touch CRUD/search/lifecycle, and should not change behavior.

## 2. Current size and responsibilities

Current measured size:

| Metric | Value |
| --- | --- |
| File | `src/lib/table/table-factory.js` |
| Physical lines measured by `Get-Content | Measure-Object -Line` | 1,249 |
| Words | 5,658 |
| Characters | 52,809 |
| Exported top-level functions/constants in this file | `normalizePaginationOptions`, `normalizeFloatingMessageOptions`, `applyDefaultColumnAlignments`, `prepareLookupColumns`, `collectLookupColumns`, `initializeLookupMetadataForRows`, `bindLookupMetadataInitialization`, `prepareCheckboxColumns`, `createTable` |
| Public controller methods currently defined inline | 32 methods |
| Public object properties currently exposed | `table`, `crud`, `toolbar`, `feedback` |
| Internal object properties currently exposed | `_floatingMessage`, `_cellMessageBinder`, `_confirmDialog` |

Main responsibilities currently concentrated in `table-factory.js`:

| Responsibility area | Current code | Notes |
| --- | --- | --- |
| Configuration and normalization | `normalizePaginationOptions`, `normalizeFloatingMessageOptions`, default constants | Already separately exported and tested in places. These are not controller methods and should not be mixed with controller method modules. |
| Column preparation | default alignments, lookup columns, checkbox columns, deleted-row edit protection, validation extraction integration | This is pre-controller setup. It may later deserve separate setup modules, but it is a different stream from controller method extraction. |
| Lookup metadata orchestration | `collectLookupColumns`, `initializeLookupMetadataForRows`, `bindLookupMetadataInitialization` | Uses `table`, row components, lookup metadata, and event subscriptions. It is lifecycle-adjacent but not a public controller method group. |
| Checkbox and delete/selection column integration | `prepareCheckboxColumns`, `createSelectionColumn`, `createDeleteColumn`, `configureLookupEditors` | Depends on `crud` availability through closures. Extraction must preserve lazy `() => crud` patterns. |
| Table creation | `new Tabulator(selector, normalizedOptions)` | True engine boundary. Should likely remain in `createTable`. |
| CRUD creation | `new CrudHelper(table, { errorStyle })` | Required before toolbar callbacks can use `grid.crud`; must remain carefully ordered. |
| Secondary controllers/UI | `createToolbar`, `FeedbackRegion`, `FloatingMessage`, `CellMessageBinder`, `ConfirmDialog`, `createSearchController` | Composition/lifecycle orchestration. |
| Public controller API | inline object methods from `getSelectedRows` through `restoreRedraw` plus `destroy` | Main target for future method-module extraction. |
| Cleanup and lifecycle | `destroy()` inline method | High-risk extraction due to many resources and ordering. Extract late. |

Important construction order:

1. Normalize options/messages.
2. Extract validators.
3. Prepare columns using closures that refer to future `crud`.
4. Create selection/delete column controllers.
5. Create `Tabulator`.
6. Create `CrudHelper`.
7. Bind selection, lookup metadata, hover binders, toolbar, feedback, search.
8. Register delete-column row-state callback.
9. Register validators.
10. Assign `controller = { ... }`.

The `controller` variable starts as `null` and is passed indirectly into `createToolbar({ getGrid: () => controller })`. Any modularization must preserve this late binding.

## 3. Public controller method inventory

Public methods and properties exposed by the controller today:

| Public member | Area | Type | Dependencies | Risk extraction | Test existing |
| --- | --- | --- | --- | --- | --- |
| `table` | raw integration property | risky/advanced | `table` | High; public shape currently tested, exposes engine directly | Multiple `table-controller-*.test.js` assert identity |
| `crud` | CRUD property | AMB-aware | `crud` | Medium; toolbar callbacks and users rely on it | Broad controller tests, CRUD tests |
| `toolbar` | UI property | AMB-aware | `toolbarController` | Medium; lifecycle mutates `controller.toolbar = null` | Toolbar/controller lifecycle coverage indirectly |
| `feedback` | UI property | AMB-aware | `feedback` | Medium; lifecycle mutates `controller.feedback = null` | README/demo usage, controller tests indirectly |
| `_floatingMessage` | internal property | risky/advanced | `floatingMessage` | Low for method extraction; keep with base controller object | Not stable public API |
| `_cellMessageBinder` | internal property | risky/advanced | `cellMessageBinder` | Low for method extraction | Not stable public API |
| `_confirmDialog` | internal property | risky/advanced | `confirmDialog` | Low for method extraction | Not stable public API |
| `getSelectedRows()` | selection | overridden | `table` | Medium; compatibility method returns selected data, not row components | `table-controller-selection-read.test.js` |
| `getSelectedData()` | selection | pass-through | `table` | Low | `table-controller-selection-read.test.js` |
| `getSelectedRowComponents()` | selection | pass-through | `table` | Low | `table-controller-selection-read.test.js` |
| `clearSelection()` | selection | AMB-aware | `table` | Low-medium; handles missing `deselectRow` | `table-controller-selection-actions.test.js` |
| `selectRow(identifier)` | selection | AMB-aware | `crud` | Medium; resolves AMB ids through `crud.findRowByKey` | `table-controller-selection-actions.test.js` |
| `deselectRow(identifier)` | selection | AMB-aware | `crud` | Medium; resolves AMB ids through `crud.findRowByKey` | `table-controller-selection-actions.test.js` |
| `setSearchQuery(query)` | search | AMB-aware | `searchController` | Low-medium; null search returns `false` | Search tests and toolbar tests |
| `clearSearch()` | search | AMB-aware | `searchController` | Low-medium | Search tests and toolbar tests |
| `getSearchState()` | search | AMB-aware | `searchController` | Medium; has no-search fallback object | Search tests and toolbar tests |
| `setSearchFields(fields)` | search | AMB-aware | `searchController` | Low-medium | Search tests and toolbar tests |
| `setSearchOptions(options)` | search | AMB-aware | `searchController` | Low-medium | Search tests and toolbar tests |
| `getHeaderFilters()` | header filter | pass-through | `table` | Low | `table-controller-header-filter-read.test.js` |
| `getHeaderFilterValue(columnLookup)` | header filter | pass-through | `table` | Low | `table-controller-header-filter-read.test.js` |
| `setHeaderFilterValue(columnLookup, value)` | header filter | pass-through | `table` | Low | `table-controller-header-filter-actions.test.js` |
| `setHeaderFilterFocus(columnLookup)` | header filter | pass-through | `table` | Low | `table-controller-header-filter-actions.test.js` |
| `clearHeaderFilter()` | header filter | pass-through | `table` | Low-medium; must not alter global search | `table-controller-header-filter-actions.test.js` |
| `refreshFilter()` | programmatic filter currently exposed | pass-through | `table` | Low-medium; must preserve search state | `table-controller-filter-refresh.test.js` |
| `getData(...args)` | data | pass-through | `table` | Low | `table-controller-data-read.test.js` |
| `getDataCount(...args)` | data | pass-through | `table` | Low | `table-controller-data-read.test.js` |
| `getRows(...args)` | row | pass-through | `table` | Low | `table-controller-row-read.test.js` |
| `getRow(identifier)` | row | AMB-aware | `table`, `crud` | Medium; AMB id lookup falls back to engine lookup | `table-controller-row-read.test.js` |
| `getRowPosition(identifier, ...args)` | row | AMB-aware | `table`, `crud` | Medium; AMB id lookup with forwarded args | `table-controller-row-position.test.js` |
| `getRowFromPosition(...args)` | row | pass-through | `table` | Low | `table-controller-row-position.test.js` |
| `getPage()` | pagination | pass-through | `table` | Low | `table-controller-pagination-read.test.js` |
| `getPageMax()` | pagination | pass-through | `table` | Low | `table-controller-pagination-read.test.js` |
| `getPageSize()` | pagination | pass-through | `table` | Low | `table-controller-pagination-read.test.js` |
| `setPage(page)` | pagination | pass-through | `table` | Low-medium; promises/remote behavior must pass through | `table-controller-pagination-navigation.test.js` |
| `nextPage()` | pagination | pass-through | `table` | Low-medium | `table-controller-pagination-navigation.test.js` |
| `previousPage()` | pagination | pass-through | `table` | Low-medium | `table-controller-pagination-navigation.test.js` |
| `setPageSize(size)` | pagination | pass-through | `table` | Low | `table-controller-pagination-size.test.js` |
| `setPageToRow(identifier)` | pagination | AMB-aware | `table`, `crud` | Medium; AMB id lookup before engine method | `table-controller-pagination-row-navigation.test.js` |
| `redraw(...args)` | redraw | pass-through | `table` | Very low | `table-controller-redraw.test.js` |
| `blockRedraw()` | redraw | pass-through | `table` | Very low | `table-controller-redraw.test.js` |
| `restoreRedraw()` | redraw | pass-through | `table` | Very low | `table-controller-redraw.test.js` |
| `destroy()` | lifecycle | lifecycle | `toolbarController`, unsubscribe callbacks, `searchController`, `feedback`, `cellMessageBinder`, `floatingMessage`, `confirmDialog`, `crud`, `table`, `controller` | High; order matters and it mutates controller properties | CRUD lifecycle tests, controller tests indirectly |

Method count by area:

| Area | Count |
| --- | ---: |
| Selection | 6 |
| Search | 5 |
| Header filter | 5 |
| Programmatic filter currently exposed | 1 |
| Data | 2 |
| Row | 3 |
| Pagination | 8 |
| Redraw | 3 |
| Lifecycle | 1 |
| Total public methods | 34 |

The count is 34 when search and current `refreshFilter()` are included; it is 32 if only the main table-engine-oriented block after search is counted.

## 4. Dependency matrix

Minimum context each future method group needs:

| Future module/group | Methods | Minimum context | Notes |
| --- | --- | --- | --- |
| `selection-methods.js` | `getSelectedRows`, `getSelectedData`, `getSelectedRowComponents`, `clearSelection`, `selectRow`, `deselectRow` | `{ table, crud }` | `getSelectedRows` is overridden compatibility behavior. `selectRow` and `deselectRow` need `crud.findRowByKey`. |
| `search-methods.js` | `setSearchQuery`, `clearSearch`, `getSearchState`, `setSearchFields`, `setSearchOptions` | `{ getSearchController }` or `{ searchController }` | If extracted before assignment finalization, a getter avoids stale null captures. Since methods are composed after `searchController` creation today, direct `{ searchController }` is sufficient. |
| `header-filter-methods.js` | `getHeaderFilters`, `getHeaderFilterValue`, `setHeaderFilterValue`, `setHeaderFilterFocus`, `clearHeaderFilter` | `{ table }` | Keep separate from programmatic filters because header filters have different semantics. |
| `filter-methods.js` | `refreshFilter`, future `getFilters`, `setFilter`, `addFilter`, `removeFilter`, `clearFilter` | Today `{ table }`; future `{ table, searchController }` | Future programmatic filter wrappers will need search filter exclusion/reapply logic. Do not mix prematurely with header filters. |
| `data-methods.js` | `getData`, `getDataCount` | `{ table }` | Simple pass-throughs, low risk. |
| `row-methods.js` | `getRows`, `getRow`, `getRowPosition`, `getRowFromPosition` | `{ table, crud }` | `getRow` and `getRowPosition` are AMB-aware. `getRows` and `getRowFromPosition` are pass-through. Keep together because they are row lookup semantics. |
| `pagination-methods.js` | `getPage`, `getPageMax`, `getPageSize`, `setPage`, `nextPage`, `previousPage`, `setPageSize`, `setPageToRow` | `{ table, crud }` | Only `setPageToRow` needs `crud`. Keep pagination together because tests and semantics are grouped. |
| `redraw-methods.js` | `redraw`, `blockRedraw`, `restoreRedraw` | `{ table }` | Best first extraction. |
| `lifecycle-methods.js` | `destroy` | Full lifecycle context plus mutable controller references | Extract late. It needs either mutable refs or closure setters for `toolbarController`, `feedback`, unsubscribe callbacks, and `searchController`. |
| Base controller shape | `table`, `crud`, `toolbar`, `feedback`, underscored internals | Direct resources | Should stay assembled in `createTable`, not hidden behind a broad module. |

Dependencies to avoid passing to every module:

- `floatingMessage` should not be passed to data/row/pagination/redraw modules.
- `confirmDialog` should not leave lifecycle/delete setup unless lifecycle extraction needs destruction.
- `toolbarController` should not be passed to methods unrelated to toolbar/lifecycle.
- `feedback` should remain a public property and lifecycle dependency, not a generic context member for all modules.
- `controller` itself should be avoided in method modules except lifecycle cleanup if needed.

## 5. Candidate internal module structure

Recommended files that serve methods already present:

```text
src/lib/table/controller/
  compose-controller-methods.js
  selection-methods.js
  search-methods.js
  header-filter-methods.js
  filter-methods.js
  data-methods.js
  row-methods.js
  pagination-methods.js
  redraw-methods.js
```

Files to defer:

```text
src/lib/table/controller/
  lifecycle-methods.js
  column-methods.js
  export-methods.js
  event-methods.js
  validation-methods.js
```

Rationale:

- `lifecycle-methods.js` is needed eventually, but should wait until simpler method modules prove the composition pattern.
- `column-methods.js`, `export-methods.js`, `event-methods.js`, and `validation-methods.js` should wait until AMB Grid actually exposes enough public methods in those areas. Creating empty or tiny placeholder modules now would add ceremony without reducing risk.
- Header filters and programmatic filters should stay separate. Header filters are already exposed and tested; programmatic filters will soon need search ownership logic and should not be hidden among header-filter pass-throughs.
- Row and pagination should remain separate even though both use `{ table, crud }`, because their semantics and tests are distinct.
- Data and redraw should not be artificially merged just because both only need `{ table }`; they are separate public areas and have separate tests.

Non-controller setup code could later be moved, but should be a separate stream:

```text
src/lib/table/setup/
  pagination-options.js
  floating-message-options.js
  column-preparation.js
  lookup-metadata-binding.js
```

This audit does not recommend starting there because the immediate pressure is public controller method growth.

## 6. Composition pattern comparison

### Factory di metodi

Concept:

```js
export const createDataMethods = ({ table }) => ({
  getData(...args) {
    return table.getData(...args);
  },
  getDataCount(...args) {
    return table.getDataCount(...args);
  }
});
```

| Criterion | Assessment |
| --- | --- |
| Leggibilita | High. Each module reads as a plain list of public methods for one area. |
| FacilitÃ  di test | High. Method factories can be unit-tested directly or through existing `createTable` tests. |
| Gestione JSDoc | Good. JSDoc can live next to each method implementation. Public typedef can reference method names centrally. |
| Dipendenze | Excellent if each factory receives only minimal context. |
| Rischio collisioni | Manageable with a small composition utility. |
| AMB-aware methods | Good. Factories can use `crud`, `searchController`, or table as needed without inheritance. |
| Impatto su `table-factory.js` | Strong reduction. `createTable` keeps orchestration and imports method factories. |
| CompatibilitÃ  con oggetto esistente | Excellent. Factories return plain objects spread into the same flat controller. |

### Registrazione esplicita

Concept:

```js
registerDataMethods(controller, { table });
```

| Criterion | Assessment |
| --- | --- |
| Leggibilita | Medium. It is explicit but mutates an object outside the module. |
| FacilitÃ  di test | Medium. Tests need to inspect mutation side effects. |
| Gestione JSDoc | Acceptable, but method definitions can be less visually tied to the returned object. |
| Dipendenze | Good if context is minimal. |
| Rischio collisioni | Good if registration checks duplicate keys. Bad if modules assign directly. |
| AMB-aware methods | Good. |
| Impatto su `table-factory.js` | Good, though setup becomes a sequence of mutation calls. |
| CompatibilitÃ  con oggetto esistente | Good. |

Main downside: the controller object must exist before all registrations. That interacts awkwardly with `createToolbar({ getGrid: () => controller })`, because today toolbar is created before the final controller is assigned. This can be handled, but it makes construction order more subtle.

### Classe controller o mixin

Concept:

```js
class AMBTableController {
  getData() {}
}
```

| Criterion | Assessment |
| --- | --- |
| Leggibilita | Medium. Familiar, but current codebase is factory/object oriented. |
| FacilitÃ  di test | Medium. Constructor setup and private fields add weight. |
| Gestione JSDoc | Good for class docs, but may force a larger documentation reshuffle. |
| Dipendenze | Risk of storing a large context on `this`. |
| Rischio collisioni | Lower for class methods, but mixins can reintroduce hidden collisions. |
| AMB-aware methods | Good, but encourages a broader stateful object. |
| Impatto su `table-factory.js` | Large. Would be a structural rewrite rather than incremental extraction. |
| CompatibilitÃ  con oggetto esistente | Medium. Public object shape can match, but identity/prototype changes may affect tests/users. |

Main downside: too broad for the current goal. It increases migration risk and does not align with the existing code style.

## 7. Recommended composition pattern

Use plain method factories plus an explicit composition utility.

Recommended shape:

```js
const controllerMethods = composeControllerMethods(
  createSelectionMethods({ table, crud }),
  createSearchMethods({ searchController }),
  createHeaderFilterMethods({ table }),
  createFilterMethods({ table }),
  createDataMethods({ table }),
  createRowMethods({ table, crud }),
  createPaginationMethods({ table, crud }),
  createRedrawMethods({ table })
);

controller = {
  table,
  crud,
  toolbar: toolbarController,
  feedback,
  _floatingMessage: floatingMessage,
  _cellMessageBinder: cellMessageBinder,
  _confirmDialog: confirmDialog,
  ...controllerMethods,
  destroy() {
    // lifecycle remains inline until extracted late
  }
};
```

Why this is recommended:

- It preserves a flat public API.
- It avoids public namespaces.
- It keeps each module's dependencies visible.
- It allows modules to be tested without constructing every UI/lifecycle dependency.
- It avoids a class/prototype migration.
- It avoids `Proxy` and automatic engine exposure.
- It creates a single composition point where duplicate keys can be rejected.

`table-factory.js` should remain the orchestrator for:

- option normalization sequence;
- column preparation sequence;
- construction order;
- resource creation;
- final flat controller assembly;
- lifecycle cleanup until a later extraction.

It should stop being the long-term home for every public controller method.

## 8. Collision policy

Collision requirements:

- AMB Grid semantics must win over raw table-engine semantics.
- A module must not silently overwrite a method already registered by another module.
- Spread order must not be the only protection.
- Duplicate keys should fail loudly during development and tests.
- Overridden methods must be named explicitly and documented.

Recommended future utility:

```js
export const composeControllerMethods = (...groups) => {
  const composed = {};

  groups.forEach(group => {
    Object.entries(group || {}).forEach(([name, value]) => {
      if (Object.prototype.hasOwnProperty.call(composed, name)) {
        throw new Error(`Duplicate AMB table controller method: ${name}`);
      }

      composed[name] = value;
    });
  });

  return composed;
};
```

When to introduce it:

- It is useful immediately once the second method module is extracted.
- For the very first extraction (`redraw-methods.js`) it is optional, but adding it early is acceptable if kept tiny and tested.
- It should not inspect or expose the raw table engine automatically.

Overridden method policy:

- `getSelectedRows()` should be marked as compatibility/overridden behavior because it returns selected data, not row components.
- Future methods that intentionally differ from table-engine names should be placed in AMB-aware modules and documented as AMB Grid behavior.
- If a future raw pass-through conflicts with an AMB-aware method, the pass-through must be renamed internally or not exposed.

## 9. JSDoc strategy

Current state:

- `jsdoc.json` includes `src`, recurses, and excludes `demo`.
- Generated docs are produced from source JSDoc into `docs/`.
- `AMBTableController` typedef currently lives in `src/lib/table/table-factory.js`.
- Full method JSDoc currently lives inline inside the controller object.

Recommended staged approach:

1. Keep `AMBTableController` temporarily in `table-factory.js`.
   - This avoids a large docs migration during the first method extractions.
   - Update its property list only when public API changes.

2. Move each method's full JSDoc with its implementation.
   - Example: `redraw-methods.js` owns the JSDoc for `redraw`, `blockRedraw`, `restoreRedraw`.
   - Do not duplicate full method docs in both `table-factory.js` and method modules.

3. Add small internal typedefs only when useful.
   - Example:

```js
/**
 * @typedef {object} ControllerRedrawContext
 * @property {object} table
 * @internal
 */
```

4. Consider a future dedicated typedef file only after several method modules exist.
   - Possible future file: `src/lib/table/controller/types.js` or `src/lib/table/controller/controller-typedefs.js`.
   - Avoid creating it now if it only moves one typedef and triggers broad docs churn.

5. Use `@internal` for composition utilities and context typedefs.
   - Method factories are implementation details.
   - Public method docs should remain public if JSDoc includes them, but factory names can be `@internal` / `@ignore` if necessary to avoid noisy docs.

Potential issue to verify during first extraction:

- If JSDoc starts listing internal factory functions as public globals, add `@private`, `@internal`, or `@ignore` to the factory export comments.
- Run `npm.cmd run docs` after each extraction and inspect generated docs for duplicated or missing controller method documentation.

## 10. Test migration strategy

Existing controller tests already map well to future modules:

| Test file | Future module | Should remain unchanged during extraction? | Notes |
| --- | --- | --- | --- |
| `tests/table-controller-redraw.test.js` | `redraw-methods.js` | Yes | Best first extraction guard. It already verifies no CRUD side effects. |
| `tests/table-controller-data-read.test.js` | `data-methods.js` | Mostly yes | It also checks redraw methods; may need minor cleanup later, but not during first extraction. |
| `tests/table-controller-row-read.test.js` | `row-methods.js` | Yes | Protects AMB-aware `getRow` fallback behavior. |
| `tests/table-controller-row-position.test.js` | `row-methods.js` | Yes | Protects `getRowPosition` and `getRowFromPosition`. |
| `tests/table-controller-selection-read.test.js` | `selection-methods.js` | Yes | Protects selected data vs selected row components. |
| `tests/table-controller-selection-actions.test.js` | `selection-methods.js` | Yes | Protects AMB id resolution for select/deselect. |
| `tests/table-controller-pagination-read.test.js` | `pagination-methods.js` | Yes | Protects read methods. |
| `tests/table-controller-pagination-navigation.test.js` | `pagination-methods.js` | Yes | Protects navigation promises/pass-through. |
| `tests/table-controller-pagination-size.test.js` | `pagination-methods.js` | Yes | Protects page-size behavior. |
| `tests/table-controller-pagination-row-navigation.test.js` | `pagination-methods.js` | Yes | Protects AMB-aware `setPageToRow`. |
| `tests/table-controller-header-filter-read.test.js` | `header-filter-methods.js` | Yes | Protects reads and no side effects. |
| `tests/table-controller-header-filter-actions.test.js` | `header-filter-methods.js` | Yes | Protects actions and global-search independence. |
| `tests/table-controller-filter-refresh.test.js` | `filter-methods.js` | Yes | Protects current `refreshFilter()` and cumulative API shape. |
| `tests/search-controller-filter-ownership.test.js` | future `filter-methods.js` integration support | Yes | Internal search ownership contract for future programmatic filters. |
| `tests/toolbar.test.js` | composition order / toolbar `getGrid` | Yes | Important because toolbar resolves the final `grid` through a callback. |

Mock strategy:

- Existing table-controller tests duplicate Tabulator and CrudHelper mocks. This duplication is tolerable for first extractions because changing test infrastructure would be a broader refactor.
- A small shared test factory could be useful later, for example `tests/helpers/table-controller-harness.js`.
- Do not introduce the shared factory in the first extraction unless duplication becomes the main obstacle.

Tests that should protect flat API shape:

- Keep at least one cumulative API test that asserts key methods are directly on `controller`, not nested.
- `table-controller-filter-refresh.test.js` and several selection/header tests already perform broad `typeof controller.method === 'function'` checks.
- After modularization, add a small duplicate-key composition test if `composeControllerMethods()` is introduced.

## 11. Progressive extraction order

Recommended order:

| Step | File to create | Methods to move | Dependencies | Tests to run | Risk | Acceptance criteria |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `src/lib/table/controller/redraw-methods.js` | `redraw`, `blockRedraw`, `restoreRedraw` | `{ table }` | `npm.cmd test -- table-controller-redraw` if supported, otherwise `npm.cmd test`; final full suite | Very low | Methods remain flat, return values/args unchanged, no CRUD calls. |
| 2 | `src/lib/table/controller/data-methods.js` | `getData`, `getDataCount` | `{ table }` | `table-controller-data-read.test.js`, full suite | Low | Read-only pass-through behavior unchanged. |
| 3 | `src/lib/table/controller/row-methods.js` | `getRows`, `getRow`, `getRowPosition`, `getRowFromPosition` | `{ table, crud }` | row read/position tests | Medium | AMB id resolution and fallback lookup unchanged. |
| 4 | `src/lib/table/controller/pagination-methods.js` | `getPage`, `getPageMax`, `getPageSize`, `setPage`, `nextPage`, `previousPage`, `setPageSize`, `setPageToRow` | `{ table, crud }` | all pagination tests | Medium | Pass-through promises and AMB-aware `setPageToRow` unchanged. |
| 5 | `src/lib/table/controller/selection-methods.js` | `getSelectedRows`, `getSelectedData`, `getSelectedRowComponents`, `clearSelection`, `selectRow`, `deselectRow` | `{ table, crud }` | selection read/actions tests | Medium | Compatibility `getSelectedRows` and AMB id select/deselect unchanged. |
| 6 | `src/lib/table/controller/header-filter-methods.js` | `getHeaderFilters`, `getHeaderFilterValue`, `setHeaderFilterValue`, `setHeaderFilterFocus`, `clearHeaderFilter` | `{ table }` | header-filter read/actions tests | Low-medium | Header filters remain independent from search. |
| 7 | `src/lib/table/controller/filter-methods.js` | `refreshFilter`, future programmatic filters | Today `{ table }`; future `{ table, searchController }` | filter refresh + search ownership tests | Medium-high once future filters are added | Search filter ownership preserved; no public methods added until intended. |
| 8 | `src/lib/table/controller/search-methods.js` | `setSearchQuery`, `clearSearch`, `getSearchState`, `setSearchFields`, `setSearchOptions` | `{ searchController }` | toolbar/search tests | Medium | No-search fallback behavior remains exact. |
| 9 | `src/lib/table/controller/lifecycle-methods.js` | `destroy` | full lifecycle context | full suite | High | Cleanup order preserved; `controller.toolbar`/`feedback` nulling preserved; table destroy still last. |

Why this varies from the prompt's possible order:

- Redraw remains first.
- Data remains second.
- Row remains before pagination because both use AMB-aware row resolution and row tests are smaller than pagination groups.
- Selection comes after pagination because selection has compatibility/overridden behavior and more semantic coupling to `crud`.
- Search is separated from filter methods. Search methods are already public but depend on optional `searchController`; future programmatic filters will need the internal ownership helpers. They should not be extracted as one large block until the future filter API exists.
- Lifecycle stays last because it has the most resources and mutability.

## 12. Recommended first extraction

First block: `redraw-methods.js`.

Methods:

- `redraw(...args)`
- `blockRedraw()`
- `restoreRedraw()`

Why:

- Smallest coherent public group.
- Uses only `{ table }`.
- No CRUD complexity.
- No search/global filter concerns.
- No lifecycle concerns.
- No public API change.
- Existing dedicated test: `tests/table-controller-redraw.test.js`.
- The current test explicitly verifies no `crud.on`, `crud.addCellValidator`, `crud.findRowByKey`, or `crud.destroy` calls happen when using redraw methods.

Proposed future file:

```text
src/lib/table/controller/redraw-methods.js
```

Proposed future shape:

```js
/**
 * @param {object} context
 * @param {object} context.table
 * @returns {object}
 * @internal
 */
export const createRedrawMethods = ({ table }) => ({
  redraw(...args) {
    return table.redraw(...args);
  },
  blockRedraw() {
    return table.blockRedraw();
  },
  restoreRedraw() {
    return table.restoreRedraw();
  }
});
```

First extraction acceptance criteria:

- `controller.redraw`, `controller.blockRedraw`, and `controller.restoreRedraw` remain direct methods on `grid`.
- Arguments and return values remain unchanged.
- No test snapshots or demo code change.
- `table-factory.js` imports `createRedrawMethods` and composes the methods into the flat object.
- `npm.cmd test`, `npm.cmd run build`, and `npm.cmd run docs` pass.
- Any `docs/` timestamp-only churn is not included unless source JSDoc movement intentionally changes generated docs.

## 13. Draft of the next Codex prompt

```text
Nel progetto AMB Grid dobbiamo eseguire il primo passo della modularizzazione interna del controller, mantenendo invariata l'API pubblica piatta.

Estrarre esclusivamente i metodi redraw attualmente definiti inline in:

src/lib/table/table-factory.js

Metodi da estrarre:

- redraw(...args)
- blockRedraw()
- restoreRedraw()

Creare:

src/lib/table/controller/redraw-methods.js

con una factory interna equivalente a:

createRedrawMethods({ table })

che restituisce un oggetto con gli stessi tre metodi.

Aggiornare createTable(...) per comporre questi metodi sul controller principale mantenendo:

grid.redraw(...)
grid.blockRedraw()
grid.restoreRedraw()

Non introdurre namespace pubblici.
Non usare classi o Proxy.
Non modificare altri metodi.
Non modificare lifecycle, ricerca, filtri, paginazione, selezione o CRUD.
Non creare ancora gli altri moduli.

Preservare il comportamento esatto:

- stessi argomenti inoltrati a table.redraw;
- stessi valori restituiti;
- nessuna chiamata a crud;
- nessuna modifica alla forma pubblica del controller.

Aggiornare il JSDoc spostando vicino ai metodi estratti la documentazione esistente, senza duplicarla inutilmente.

Eseguire:

npm.cmd test
npm.cmd run build
npm.cmd run docs

Se docs/ cambia solo per timestamp, non includere quel churn.

Non effettuare commit o push.
```

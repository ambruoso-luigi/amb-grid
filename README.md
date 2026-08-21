# AMB Grid

AMB Grid is a framework-agnostic CRUD grid system for editable business data.

It provides an AMB-owned row lifecycle, editing, validation, lookup behavior,
rollback, save payloads, search, toolbar coordination, and lifecycle cleanup.

The core is framework-agnostic and suitable for both legacy/server-rendered pages and modern frontend applications that need to mount and dispose editable data grids.

## Project Status

⚠️ Early Preview / Work in Progress

AMB Grid is currently under active development.

The API is not yet considered stable and breaking changes may occur before version 1.0.

This repository is available early to collect feedback and validate design decisions while development continues.

[Changelog](CHANGELOG.md)

## Installation

Install AMB Grid in your application:

```bash
npm install amb-grid
```

Import the public JavaScript API and the complete AMB Grid stylesheet:

```js
import { AMB } from 'amb-grid';
import 'amb-grid/style.css';
```

The public stylesheet already includes the styles required by AMB Grid's
internal table engine, suggestion widget, and calendar picker.

The package includes TypeScript declarations, so no separate `@types` package
is required:

```ts
import { AMB } from 'amb-grid';
import 'amb-grid/style.css';

const grid = AMB.table({
  selector: '#grid',
  data: [],
  columns: []
});
```

### Standalone browser usage

For legacy or server-rendered pages, AMB Grid can be loaded without npm, a
bundler, or JavaScript imports:

```html
<link rel="stylesheet" href="./vendor/amb-grid/amb-grid.css">

<div id="inventory-table"></div>

<script src="./vendor/amb-grid/amb-grid.umd.js"></script>
<script>
  const grid = AMB.table({
    selector: '#inventory-table',
    data: [],
    columns: []
  });
</script>
```

The standalone bundle already incorporates its internal JavaScript runtime
dependencies, and `amb-grid.css` contains the required library styles. The
public browser global is directly `AMB`.

Releases may also provide a standalone `amb-grid-legacy-<version>.zip` archive
containing `amb-grid.umd.js`, `amb-grid.css`, the README, and the license.
Extract its `amb-grid` folder into your application's `vendor` directory or an
equivalent static-assets location. The archive is a reproducible release
artifact and is not a CDN dependency.

## Framework integrations

AMB Grid remains framework-agnostic and needs no framework-specific wrapper.
Mount it after the framework creates a DOM container, retain the returned
controller, and call `destroy()` during component cleanup:

- [React](examples/frameworks/react.md)
- [Vue](examples/frameworks/vue.md)
- [Angular](examples/frameworks/angular.md)

## Minimal example

Add a container to the page:

```html
<div id="people-grid"></div>
```

Create the grid through `AMB.table(...)` and keep the returned controller:

```js
import { AMB } from 'amb-grid';
import 'amb-grid/style.css';

const grid = AMB.table({
  selector: '#people-grid',
  data: [
    { id: 1, name: 'Ada Lovelace', email: 'ada@example.com' }
  ],
  columns: [
    {
      title: 'Name',
      field: 'name',
      editor: AMB.editors.text()
    },
    {
      title: 'Email',
      field: 'email',
      editor: AMB.editors.text(),
      validator: AMB.validators.email()
    }
  ]
});

const validation = grid.validateChanges();
const payload = grid.getSavePayload();
```

Validation and payload generation are local operations; AMB Grid does not send
the payload automatically. When the owning view is disposed, call
`grid.destroy()`.

## Internal runtime components

AMB Grid is framework-agnostic and uses focused internal runtime components for
table rendering, suggestions, and calendar selection. AMB Grid owns the public
contract, CRUD lifecycle, validation, payload generation, editor commit rules,
and lifecycle cleanup.

## Features

### CRUD State Tracking

Track row changes automatically:

* Clean
* New
* Modified
* Deleted
* Saved

Additional capabilities:

* Rollback support
* Delete actions
* Remove-new actions
* State reporting
* Save payload generation

### Optional CRUD Toolbar

`AMB.table(...)` renders a minimal framework-agnostic grid header toolbar by
default. Built-in button ids are `add`, `save`, `reload`, `validate`, and
`payload`. Every action is callback-driven: the toolbar never performs
`fetch`, AJAX, backend calls, row creation, or validation by itself.

```js
const grid = AMB.table({
  selector: '#people',
  data,
  columns,
  toolbar: {
    enabled: true,
    buttons: [
      'add',
      'reload',
      'save',
      'validate',
      'payload',
      {
        id: 'selected',
        label: 'Show selected',
        onClick: ({ grid }) => {
          console.log(grid.getSelectedRows());
        }
      }
    ],
    onAdd: ({ grid }) => {
      return grid.addRow({ id: null, name: '' });
    },
    onSave: async ({ grid, payload }) => {
      console.log(payload);
      // Submit payload with your application's backend client.
    },
    onReload: async ({ grid }) => {
      // Reload or replace data using your application's data source.
    },
    onValidate: ({ grid }) => {
      console.log(grid.validate());
    },
    onPayload: ({ grid, payload }) => {
      console.log(payload);
    }
  }
});
```

All callbacks receive `{ grid, event }`. Return the Promise from asynchronous
grid operations such as `grid.addRow(...)` so the toolbar can keep the
button busy until row reveal and focus complete. Save and Payload also receive
`payload: grid.getSavePayload()`. A custom button is a small object with
`id`, `label`, optional inline `icon`, and `onClick`; set
`includePayload: true` when a custom action also needs the save payload.
Buttons without a configured callback are rendered disabled.

When both `toolbar` and `search.enabled` are configured, AMB Grid mounts the
search input and optional Filters button inside the same grid header. The
toolbar and grid are styled as one connected component. If search
is enabled without the CRUD toolbar, the existing standalone search bar is
kept for backward compatibility.

The Filters dialog lets end users choose which columns are searched. All
searchable columns are selected initially; users can uncheck columns to narrow
the search, but at least one column must remain selected. It also provides
`Case sensitive` and `Whole word` options, both disabled by default.
`grid.getSearchState()` returns the explicit selected-field list and matching
options together with the query. Matching options can be changed
programmatically with `grid.setSearchOptions({ caseSensitive, wholeWord })`.
The Filters control is icon-only and shows a compact column count only when
the search is restricted to a subset.

When `toolbar` is omitted or set to `true`, the default Add, Reload, and Save
buttons are rendered in a safe disabled state until callbacks are configured.
Reload only invokes `onReload`; AMB Grid never makes a hardcoded backend call.
Set
`toolbar: false` or `toolbar: { enabled: false }` to opt out completely.

Each table controller also exposes an accessible feedback region for status
messages:

```js
grid.feedback.show({
  type: 'success',
  message: 'Changes saved successfully.'
});

grid.feedback.clear();
```

Supported types are `success`, `warning`, `error`, and `info`. Warning and
error messages use assertive alert semantics; success and info messages use a
polite status region. The Search Filters dialog uses the same feedback
component to warn when a user tries to leave zero searchable columns selected.

The Basic CRUD demo uses built-in Add, Reload, Save, and Payload actions plus
simple custom Report and Selected buttons, with Search and Filters mounted in
the same header. Save and Reload demonstrate success feedback without
hardcoding backend behavior into AMB Grid.

### Validation Framework

Built-in validation support including:

* Required fields
* Email validation
* Numeric validation
* Pattern validation
* Minimum and maximum values
* Minimum and maximum length
* Unique values
* Format/syntax validators
* Codice Fiscale syntax
* Italian IBAN syntax
* Static allowed-values validation
* Custom validators

Validator combinators:

* `anyOf(...)`
* `allOf(...)`

Format-specific validators are syntactic checks only. They do not replace backend validation, official verification, checksum validation where not implemented, authorization, or business rules.

For CRUD save flows, `grid.validateChanges()` validates only new and modified
rows while still allowing cross-row validators such as `unique` to compare
against clean rows. Use `grid.validate()` for a full-grid validation. The
validation result is returned to the application; no backend request is made.

### Editors

Reusable editors for common scenarios:

* Text
* Integer
* Decimal
* Checkbox
* Date
* Select
* Autocomplete
* Lookup
* Large text

### Keyboard support

AMB Grid keeps keyboard behavior aligned across editable data cells,
popup/action cells, and non-data interactive columns:

* `Tab` moves to the next editable or interactive AMB Grid cell.
* `Shift+Tab` moves to the previous editable or interactive AMB Grid
  cell.
* The standard selection column participates in cell navigation. `Enter` and
  `Space` toggle row selection through the Row Component API.
* The standard delete/undo/remove-new column participates in cell navigation
  as an interactive action cell, not as a data column. `Enter` and `Space`
  activate the row action. Delete confirmation traps `Tab`/`Shift+Tab` inside
  the dialog; after delete focus returns to undo, after undo focus returns to
  delete, and remove-new falls back to the next or previous visible row action.
* Checkbox editors use `Space` and configured toggle keys to change value.
  `Enter` confirms. `Tab`/`Shift+Tab` confirm and navigate without an
  accidental extra toggle.
* Lookup editors use `Enter` to open the lookup dialog when one is configured.
  While the dialog is open, `Tab`/`Shift+Tab` stay inside it, arrow keys move
  lookup selection, `Enter` selects, and `Escape` cancels. Record-based
  lookups can update multiple row fields through `mapToRow`.
* Date editors use `Enter` to open the calendar when the editor supports it.
  In `pickerOnly` mode, entering the editor opens the calendar immediately.
  Arrow keys change only the highlighted day; `Enter` confirms that highlighted
  day as the selection. `Tab`/`Shift+Tab` leave and navigate without turning a
  merely highlighted day into a new selection. If a value was already selected,
  leaving with `Tab` without confirmation preserves that value. After a real
  mouse or keyboard selection, subsequent navigation remains in the grid flow.
  `Escape` preserves the editor mode's close behavior. Manual picker editors
  keep the calendar button available after the popup closes so it can be
  reopened.
* Large text editors cancel with `Escape` and save with `Ctrl+Enter`.
  With `tabBehavior: 'save-and-navigate'`, `Tab` saves and navigates forward
  and `Shift+Tab` saves and navigates backward.

### Formatters

Formatting helpers for:

* Numbers
* Dates
* Lookup values
* Custom display logic

For ratio values displayed as percentages, use
`AMB.formatters.percentFromRatio(ratioDecimalDigits)`. It derives the useful
percentage precision from the stored ratio precision and hides trailing zeros
by default. `AMB.formatters.percent(decimals)` remains available when fixed
display precision is required.

### Column calculations

AMB Grid supports top and bottom column calculations directly in column
definitions through `topCalc` and `bottomCalc`. The grid runtime keeps their
results synchronized when the active data changes. The built-in calculations
supported and certified by AMB Grid are `avg`, `sum`, `min`, `max`, `count`,
`unique`, and `concat`.

The following example displays a sum, an average, and a distinct-value count
in the top calculation row:

```js
const grid = AMB.table({
    selector: '#products-grid',
    data: [
        { product: 'Router', quantity: 5, unitPrice: 120.5, category: 'Hardware' },
        { product: 'CRM', quantity: 12, unitPrice: 49.9, category: 'Software' }
    ],
    columns: [
        { title: 'Product', field: 'product' },
        {
            title: 'Quantity',
            field: 'quantity',
            topCalc: 'sum',
            topCalcFormatter: AMB.formatters.calculation({ label: 'TOTAL:' })
        },
        {
            title: 'Unit price',
            field: 'unitPrice',
            topCalc: 'avg',
            topCalcParams: { precision: false },
            topCalcFormatter: AMB.formatters.calculation({
                label: 'AVG:',
                formatValue: value => Number(value).toFixed(2)
            })
        },
        {
            title: 'Category',
            field: 'category',
            topCalc: 'unique',
            topCalcFormatter: AMB.formatters.calculation({ label: 'UNIQUE:' })
        }
    ]
});
```

#### Calculation presentation

`AMB.formatters.calculation(options)` provides safe, consistent textual markup
for `topCalcFormatter` and `bottomCalcFormatter`. Its options are:

* `label`: optional text shown before the result.
* `className`: one or more application CSS classes added to the calculation
  content wrapper.
* `formatValue`: an optional function that converts the raw result into display
  text.

For example:

```js
topCalcFormatter: AMB.formatters.calculation({
    label: 'AVG:',
    className: 'average-highlight',
    formatValue: value => Number(value).toLocaleString('it-IT', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })
})
```

`formatValue` changes only the displayed representation; it does not replace
the raw calculation result. Labels, values, formatted results, and application
class names are handled as safe text. A normal application formatter can still
be supplied when completely custom presentation is required.

The calculation presentation can also be changed at runtime through the
existing column API:

```js
await grid.updateColumnDefinition('unitPrice', {
    topCalcFormatter: AMB.formatters.calculation({
        label: 'MEDIA:',
        className: 'average-highlight',
        formatValue: value => Number(value).toFixed(2)
    })
});
```

#### Custom calculations and parameters

A function can be assigned directly to `topCalc` or `bottomCalc`. It receives
the runtime calculation inputs and can define application-specific semantics:

```js
const calculateRange = values => {
    const numbers = values.map(Number).filter(Number.isFinite);

    if (!numbers.length) return 0;

    return Math.max(...numbers) - Math.min(...numbers);
};

const columns = [{
    title: 'Score range',
    field: 'score',
    topCalc: calculateRange,
    topCalcFormatter: AMB.formatters.calculation({ label: 'RANGE:' })
}];
```

Rows in CRUD `deleted` state are excluded from custom calculations as well as
from built-ins. The seven AMB Grid built-ins also ignore `null`, `undefined`,
and the empty string (`''`). Custom functions receive empty values from active
rows and may assign their own meaning to them. Strings containing spaces are
not implicitly treated as empty.

`topCalcParams` and `bottomCalcParams` can be static configuration objects or
functions that resolve parameters from the current calculation inputs. For
example, the supported average configuration can preserve full runtime
precision:

```js
{
    field: 'unitPrice',
    topCalc: 'avg',
    topCalcParams: { precision: false }
}
```

Dynamic parameter functions receive inputs normalized consistently with their
associated calculation: built-ins exclude empty values, while custom
calculations preserve them.

#### CRUD lifecycle and calculation results

Calculation participation follows the AMB Grid CRUD lifecycle:

* `clean` and `saved` rows participate.
* `new` rows participate with their current runtime values.
* `modified` rows participate with their updated runtime values.
* `deleted` rows do not participate.

A deleted row remains visible, remains available for rollback, and remains in
the appropriate CRUD reports and payloads. After rollback it participates
again with its restored data.

Read the current configured results with:

```js
const results = grid.getCalcResults();
```

For an ungrouped grid, the result normally contains `top` and `bottom`
sections. A grouped grid can return a runtime group structure with nested
results. Treat the returned object as read-only.

Force calculation refresh separately when needed:

```js
grid.recalc();
const results = grid.getCalcResults();
```

`grid.recalc()` uses the current runtime data, filters, groups, functions, and
parameters, while excluding deleted rows. It does not directly modify data,
CRUD states, or save payloads.

> **Calculation results and CRUD payloads are different concepts.**
> Calculations describe the active runtime dataset. CRUD payloads describe
> changes to send to the backend. `grid.getCalcResults()` is not a replacement
> for `grid.getSavePayload()`.

#### Stable calculation CSS

AMB Grid exposes stable presentation classes without requiring application
selectors tied to internal markup:

* `.amb-calc-row`, `.amb-calc-row--top`, `.amb-calc-row--bottom`, and
  `.amb-calc-cell` are structural classes applied by the AMB Grid runtime.
* `.amb-calc-content`, `.amb-calc-label`, and `.amb-calc-value` are emitted by
  `AMB.formatters.calculation(...)`.

An application class can highlight one result:

```css
.average-highlight {
    background: #fff4c2;
    border-radius: 4px;
    padding: 2px 4px;
}
```

The public calculation variables customize the shared calculation row and its
content:

* `--amb-calc-row-bg`
* `--amb-calc-row-color`
* `--amb-calc-row-border-color`
* `--amb-calc-label-color`
* `--amb-calc-value-color`
* `--amb-calc-row-font-weight`

```css
:root {
    --amb-calc-row-bg: #f6f8fb;
    --amb-calc-row-font-weight: 600;
    --amb-calc-label-color: #475569;
}
```

#### Pagination, filtering, and ordering

With local pagination, calculations represent the entire active and filtered
dataset available locally, rather than only the visible page:

```js
pagination: {
    enabled: true,
    mode: 'local',
    pageSize: 10
}
```

Changing the page or page size does not change calculation results. Applying a
filter changes the active dataset and therefore its results; removing the
filter restores results for the complete local dataset. Editing a row on
another page still updates calculations, and delete/rollback follows the same
CRUD lifecycle regardless of the current page.

Order-independent calculations such as `sum`, `avg`, `min`, `max`, `count`,
and `unique` keep the same result after sorting. `concat` is order-sensitive,
so its sequence may change when active rows are reordered; this is expected.

With remote pagination, the browser does not necessarily hold the full remote
dataset. Client calculations can use only data currently available to the
runtime and must not automatically be interpreted as global archive totals.
Global totals for unloaded data must be calculated by the backend, or the
application must make the complete required dataset available. AMB Grid does
not estimate or reconstruct rows that the backend did not provide.

Calculations can also be used with grouping. `grid.getCalcResults()` may return
nested results for runtime groups, and AMB Grid presentation classes are also
applied to calculation rows created inside groups.

### Parsers

AMB Grid keeps display, editing, validation, and payload normalization separate:

* Formatter: displays a value.
* Editor: lets the user change a value.
* Validator: checks whether a value is acceptable.
* Parser: normalizes a value before payload/backend submission.

Parsers may perform small syntactic checks to avoid incoherent transformations, but they do not replace validators, business rules, authorization, or backend validation.

Payload-oriented parser helpers include:

* Parsers / payload normalizers for backend-oriented values: decimal strings,
  integer strings, canonical dates/datetimes, canonical times, booleans, and
  explicit empty-to-null conversion
* Decimal normalization, for example `-123.123,01` to `"-123123.01"`
* Integer normalization
* Date normalization to `YYYY-MM-DD`
* DateTime normalization to `YYYY-MM-DD HH:MM:SS`
* Time normalization to `HH:MM:SS`
* Boolean normalization with configurable backend values
* Empty-value normalization to `null`

Built-in parsers cover recurring structural transformations. Use
`AMB.parsers.custom(...)` for application-defined or domain-specific rules:

```js
const priorityParser = AMB.parsers.custom(value => ({
  High: 'H',
  Medium: 'M',
  Low: 'L'
}[value] ?? null));

priorityParser.parse('High'); // 'H'
```

Parsers normalize values for payload/backend submission; validators remain
responsible for deciding whether those values are acceptable.

Numeric payload parsers return normalized strings by default, not JavaScript numbers, to avoid precision surprises with decimal or monetary values.

Date payload parsers normalize supported AMB Grid date formats to `YYYY-MM-DD`. DateTime payload parsers normalize to `YYYY-MM-DD HH:MM:SS`.

If a date can be ambiguous, configure `inputFormats` explicitly or rely on the documented format order. Parsers do not guess user intent.

Do not use integer parsers for codes with leading zeroes. Codes should be
treated as strings and normalized according to the application contract.

Date parsers accept separated dates with one or two digit day/month values, such as `20/7/2026` or `2026-06-5`, and normalize output with leading zeroes. Compact `yyyymmdd` input remains strict and does not accept ambiguous shorter values such as `2026720`.

Date editors keep invalid typed values visible by default with `invalidBehavior: 'commitRaw'`, so validators can report the error. Use `invalidBehavior: 'cancel'` for the older cancel-on-invalid behavior. Automatic separators are applied only for linear digit typing at the end of the field; manual separators, deletion, and middle edits are left as natural as possible. `minDate` and `maxDate` are supported by date editors and validators; the calendar picker helps selection but does not replace validation.

Date validators can distinguish syntax errors, impossible calendar dates, values before `minDate`, values after `maxDate`, and required empty values. Existing boolean validators remain supported; validators may also return `{ isValid, message, code }` for dynamic messages.

With `picker: true`, the calendar picker limits calendar selection but does not block or clean manual input. Manual invalid or out-of-range values are committed with `commitRaw` and then reported by validators; use `invalidBehavior: 'cancel'` for restrictive editing.

Use `AMB.date.createConfig(...)` to define date format, range, payload format, editor mode and messages once, then pass the returned pieces to formatter, editor, validator and parser configuration. `mode: 'manualWithPickerButton'` is the recommended mode: it provides manual input plus a calendar button and never auto-opens the picker. `picker: true` maps to this stable mode. `mode: 'manual'` disables the picker. `mode: 'pickerOnly'` shows no manual input or side button and opens the calendar immediately when the cell enters edit mode. Selected dates use the column format.

### Lookup System

Lookup fields with support for:

* Dialog selection
* Code validation
* Description management
* Hover descriptions
* Record-based multifield mapping

Record-based lookups keep dialog presentation separate from row mapping. A
technical key may be hidden from the end user and still populate the grid row:

```js
const municipalities = AMB.lookup({
  keyField: 'istatCode',
  valueField: 'istatCode',
  labelField: 'municipalityName',
  caseSensitive: false,
  columns: [
    { field: 'municipalityName', title: 'Municipality', visible: true },
    { field: 'province', title: 'Province', visible: true },
    { field: 'region', title: 'Region', visible: true },
    { field: 'postalCode', title: 'Postal Code', visible: true },
    { field: 'istatCode', title: 'ISTAT Code', visible: false }
  ],
  search: { fields: 'visible' },
  mapToRow: {
    istatCode: 'istatCode',
    municipality: 'municipalityName',
    province: 'province',
    region: 'region',
    postalCode: 'postalCode'
  },
  load: () => municipalityRecords
});
```

Lookup editor matching is case-insensitive by default:
`caseSensitive: false`. The lookup loader still receives the query as typed;
AMB Grid applies the option when matching the returned records. When a typed
value or autocomplete prefix matches, the saved value is the canonical value
from the lookup record, not the typed text. For example, `mila`, `MILA`,
`milano`, and `MILANO` can all match a record whose value is `Milano`, and the
cell stores `Milano`. Set `caseSensitive: true` to require matching uppercase
and lowercase exactly. `uppercase` is separate: it transforms typed input, while
`caseSensitive` controls lookup matching.

`mapToRow` uses `{ gridRowField: lookupRecordField }`. `keyField` is required
and validated for presence and uniqueness when records load. At least one
lookup column must declare `visible: true`. The modal displays and searches
only visible columns, while selection resolves the complete indexed record.
All mapped values pass through the AMB CRUD lifecycle, including row state,
field validation, rollback, and save payload generation.

`AMB.multifieldLookup(...)` is the dedicated Multifield Lookup API. A normal
lookup answers "which value should this cell store?". A Multifield Lookup
answers "which external record is attached to this row, and which row fields
must update together?".

```js
const municipalityLookup = AMB.lookup({
  keyField: 'istatCode',
  valueField: 'municipalityName',
  labelField: 'municipalityName',
  caseSensitive: false,
  columns: municipalityLookupColumns,
  load: () => municipalityRecords
});

const municipalityMultifieldLookup = AMB.multifieldLookup({
  id: 'municipality',
  lookup: municipalityLookup,
  masterField: {
    field: 'municipality',
    from: 'municipalityName',
    title: 'Municipality',
    required: true,
    autocomplete: true,
    dialog: true
  },
  dependentFields: [
    { field: 'province', from: 'province', title: 'Province', required: true },
    { field: 'region', from: 'region', title: 'Region', required: true },
    { field: 'postalCode', from: 'postalCode', title: 'Postal Code', required: true },
    {
      field: 'istatCode',
      from: 'istatCode',
      title: 'ISTAT Code',
      visibleInGrid: true,
      visibleInLookup: false,
      searchable: false,
      required: true
    }
  ]
});

const columns = [
  municipalityMultifieldLookup.masterColumn({ width: 220 }),
  municipalityMultifieldLookup.dependentColumn('province', { width: 100 }),
  municipalityMultifieldLookup.dependentColumn('region', { width: 130 }),
  municipalityMultifieldLookup.dependentColumn('postalCode', { width: 125 }),
  municipalityMultifieldLookup.dependentColumn('istatCode', { width: 120 })
];
```

The Multifield Lookup mapping uses `{ from, field }`: `from` is the lookup
record field and `field` is the row field. Selecting a record or accepting a
valid autocomplete match applies one patch containing the master plus every
dependent field. Multifield Lookup uses the same `caseSensitive` setting as its
lookup by default, and a single master column can override it with
`masterColumn({ editorOptions: { caseSensitive: true } })`.
Dependent fields are readonly by default, remain normal row fields for payload,
validation, state report and rollback, and do not require a separate
`technicalFields` option. If the master becomes empty or invalid, dependent
fields are cleared by default so stale data from a previous record is not kept.
`visibleInLookup: false` hides a lookup field from the dialog but does not
prevent it from being mapped into the row.

Lookup description hover messages are enabled by default. Disable only the
hover presentation for one lookup editor with `showDescription: false`; lookup
metadata is still initialized and kept for search, rollback, payload and other
library behavior:

```js
AMB.editors.lookup(statusLookup, {
  showDescription: false
});
```

At table level, `floatingMessages` controls every hover message rendered with
the shared floating-message component:

```js
AMB.table({
  selector: '#grid',
  data,
  columns,
  floatingMessages: {
    lookupDescriptions: true,
    validationErrors: true,
    largeTextPreviews: true,
    searchFilterStatus: true
  }
});
```

Use `floatingMessages: false` to disable all floating hover messages without
disabling lookup metadata, validation, large text editing or search filters:

```js
AMB.table({
  selector: '#grid',
  data,
  columns,
  floatingMessages: false
});
```

The municipality demo is dialog-only: clicking the Municipality cell opens the
lookup without creating a text input or an in-cell lookup button. Province,
Region, Postal Code, ISTAT Code, and Cadastral Code are read-only derived
fields. Selecting a record updates every mapped field atomically through the
AMB CRUD lifecycle; canceling the dialog leaves the row untouched.

The municipality demo loads its JSON as a separate static demo asset, so the
dataset is not imported by the library core or included in the AMB Grid runtime
bundle. Municipality identifiers and administrative names are generated from
the official ISTAT municipality workbook. Postal codes are a limited demo
overlay and are not an official ISTAT field.

> This dataset is provided for demonstration purposes only. It may be
> incomplete, outdated, or inaccurate. Do not use it as an official source for
> production systems.

### Autocomplete

`AMB.editors.autocomplete(values, options)` is an AMB Grid text editor with
suggestions from a simple string list. The selected or typed text is stored
directly; the suggestion dropdown never owns the value, and there is no hidden
associated data.

`maxOptions` defaults to `10` and limits the number of matching suggestions shown. It can be overridden, for example with `AMB.editors.autocomplete(values, { maxOptions: 15 })`.

Autocomplete matching is case-insensitive by default and commits canonical list
values by default:

```js
AMB.editors.autocomplete(departments, {
  caseSensitive: false,
  commitMatchedValue: true
});
```

With values such as `['Finance', 'Human Resources']`, typed exact or prefix
matches like `fina`, `FINA`, `finance`, and `FINANCE` resolve to and save
`Finance`. The completed suffix is selected in the input so the user can
accept it, keep typing, or replace it naturally. Set `caseSensitive: true` to
require matching uppercase and lowercase exactly. Set
`commitMatchedValue: false` when compatibility requires keeping typed text
unless the user selects or highlights a suggestion.

The list supplies suggestions, the editor manages user input, and validators decide whether the stored value is acceptable. With `allowCustomValue: true`, custom typed values are accepted. In strict columns, `allowCustomValue: false` with `invalidBehavior: 'commitRaw'` keeps unknown text visible so `AMB.validators.allowedValues(...)` can report it. Use `invalidBehavior: 'cancel'` for restrictive editing.

Selected and typed values are trimmed only on commit by default with
`trimInput: true`; set `trimInput: false` to preserve surrounding whitespace.
Backspace and Delete retain native input behavior. Arrow keys navigate
suggestions, Enter commits, Escape cancels, and Tab commits without blocking
grid navigation. At commit, `allowEmpty` and `invalidBehavior` determine
whether an empty string is saved or the edit is cancelled.

`allowedValues` is synchronous and intended for static lists. Async validation is not included at this stage.

Autocomplete intentionally remains a local plain-text editor. It does not
perform remote lookup or asynchronous validation, does not become a lookup, and
does not manage associated records or hidden data.

### Search and Filters

Integrated tools for:

* Global search
* Column filters
* Active filter tracking

### Large Text Editor

Popup editor designed for:

* Notes
* Comments
* Descriptions
* Long text fields

without increasing row height.

### Backend Integration

Support for:

* Temporary row identifiers
* Backend-generated identifiers
* Save payload generation
* Identifier synchronization after save

## Development

After cloning the repository, install its development dependencies and use the
project commands:

```bash
npm install
npm run dev
npm test
npm run build
npm run build:lib
npm run pack:check
npm run docs
```

## Documentation

Generated API documentation is available in the `docs` folder.

Reusable AMB Grid styles live in `src/amb-grid.css`. Demo/site-only rules live
in `src/demo/demo.css`. `src/style.css` remains a temporary compatibility file
that imports both stylesheets.

AMB Grid ships with a neutral base stylesheet. Reusable component classes are
namespaced with `amb-*`, and applications can override the `--amb-*` CSS
variables without copying the library styles. Demo and site styling remains
separate from the reusable component stylesheet.
Clean-row zebra striping is controlled only by AMB Grid through
`--amb-row-clean-bg` and `--amb-row-clean-alt-bg`. Override only these
variables to customize the base and alternate clean-row colors; internal
engine row-parity classes are not part of the styling contract, and CRUD state
styles take precedence over zebra striping.

## Security

AMB Grid escapes textual formatter output by default and generates structured CRUD payloads, not SQL queries.

Backend applications receiving AMB Grid payloads must still perform server-side validation, authorization checks and SQL injection prevention using parameterized queries, prepared statements, safe ORM methods or properly constructed stored procedures.

See [Security notes](docs/security.md).

## Lifecycle and cleanup

`grid.destroy()` releases the complete AMB-managed grid returned by
`AMB.table(...)`. It detaches AMB bindings, lookup and large-text hover helpers,
search helpers, messages, dialogs, CRUD state, and the underlying table engine.
Use it when a page section, modal, tab, or view owns the whole grid:

```js
const grid = AMB.table({ selector: '#people', data, columns });

// later, when the page section/modal/view is disposed
grid.destroy();
```

The controller returned by `AMB.table(...)` is the primary public API. Use
`grid.table` only for advanced engine access not yet covered by AMB Grid.
Direct engine calls can bypass AMB Grid lifecycle, validation, state tracking,
events, or UI coordination.

## Roadmap

The following areas are currently being stabilized before a first serious release:

* CRUD state management
* Safe textual formatters
* Lifecycle and cleanup behavior
* Save payload generation
* Backend identifier synchronization
* Documentation and security notes
* Legacy-friendly and modern integration demos
* Basic automated tests for the core behavior

## License

Licensed under the Apache License 2.0.

Copyright © 2026 Luigi Ambruoso.

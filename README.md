# AMB Grid

AMB Grid is a framework-agnostic CRUD grid system for editable business data, powered by [Tabulator](https://tabulator.info/).

It is not just a Tabulator helper, plugin, or wrapper. Tabulator is the table engine; AMB Grid is the CRUD application layer around it, handling row state, validation, rollback, lookup behavior, save payloads, and lifecycle cleanup.

The core is framework-agnostic and suitable for both legacy/server-rendered pages and modern frontend applications that need to mount and dispose editable data grids.

## Project Status

⚠️ Early Preview / Work in Progress

AMB Grid is currently under active development.

The API is not yet considered stable and breaking changes may occur before version 1.0.

This repository is being published early to collect feedback and validate design decisions while development continues.

## Quick Start

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Run tests:

```bash
npm test
```

Build the project:

```bash
npm run build
```

Generate documentation:

```bash
npm run docs
```

## Third-party components

AMB Grid is framework-agnostic and uses a small set of focused frontend libraries:

* [Tabulator](https://tabulator.info/): table rendering engine.
* [Awesomplete](https://leaverou.github.io/awesomplete/): lightweight text suggestions for autocomplete editors.
* [vanillajs-datepicker](https://mymth.github.io/vanillajs-datepicker/): calendar picker for date editors.

These components provide focused UI behavior. AMB Grid owns CRUD state, validation, payload generation, editor commit rules, and lifecycle cleanup.

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
      return grid.crud.addRow({ id: null, name: '' });
    },
    onSave: async ({ grid, payload }) => {
      console.log(payload);
      // Submit payload with your application's backend client.
    },
    onReload: async ({ grid }) => {
      // Reload or replace data using your application's data source.
    },
    onValidate: ({ grid }) => {
      console.log(grid.crud.validateAll());
    },
    onPayload: ({ grid, payload }) => {
      console.log(payload);
    }
  }
});
```

All callbacks receive `{ grid, event }`. Return the Promise from asynchronous
grid operations such as `grid.crud.addRow(...)` so the toolbar can keep the
button busy until row reveal and focus complete. Save and Payload also receive
`payload: grid.crud.getSavePayload()`. A custom button is a small object with
`id`, `label`, optional inline `icon`, and `onClick`; set
`includePayload: true` when a custom action also needs the save payload.
Buttons without a configured callback are rendered disabled.

When both `toolbar` and `search.enabled` are configured, AMB Grid mounts the
search input and optional Filters button inside the same grid header. The
toolbar and Tabulator table are styled as one connected component. If search
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

For CRUD save flows, `crud.validateChanges()` validates only new and modified rows while still allowing cross-row validators such as `unique` to compare against clean rows. `crud.validateAll()` remains available as a full-table audit of active rows, with `crud.validateAll({ includeDeleted: true })` for technical audits that also inspect deleted rows.

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
* `Shift+Tab` (Rtab) moves to the previous editable or interactive AMB Grid
  cell.
* The standard selection column participates in cell navigation. `Enter` and
  `Space` toggle row selection through the Tabulator row API.
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
* Date editors with a picker use `Enter` to open the datepicker. While the
  picker is open, `Tab`/`Shift+Tab` remain inside the popup, arrow keys stay
  with the datepicker, `Enter` selects when supported by the picker, and
  `Escape` closes the popup. Manual picker editors keep the calendar button
  available after the popup closes so it can be reopened.
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

### Parsers

AMB Grid keeps display, editing, validation, and payload normalization separate:

* Formatter: displays a value.
* Editor: lets the user change a value.
* Validator: checks whether a value is acceptable.
* Parser: normalizes a value before payload/backend submission.

Parsers may perform small syntactic checks to avoid incoherent transformations, but they do not replace validators, business rules, authorization, or backend validation.

Payload-oriented parser helpers include:

* Parsers / payload normalizers for backend-oriented values: decimal strings, integer strings, canonical dates/datetimes, and common string normalizers
* Decimal normalization, for example `-123.123,01` to `"-123123.01"`
* Integer normalization
* Date normalization to `YYYY-MM-DD`
* DateTime normalization to `YYYY-MM-DD HH:MM:SS`
* String normalizers such as trim, uppercase, digits-only, IBAN, and fiscal-code normalization

Parsers normalize values for payload/backend submission; validators check whether values are acceptable.

Numeric payload parsers return normalized strings by default, not JavaScript numbers, to avoid precision surprises with decimal or monetary values.

Date payload parsers normalize supported AMB Grid date formats to `YYYY-MM-DD`. DateTime payload parsers normalize to `YYYY-MM-DD HH:MM:SS`.

If a date can be ambiguous, configure `inputFormats` explicitly or rely on the documented format order. Parsers do not guess user intent.

Do not use integer parsers for codes with leading zeroes. Codes should be treated as strings and normalized with string normalizers.

Date parsers accept separated dates with one or two digit day/month values, such as `20/7/2026` or `2026-06-5`, and normalize output with leading zeroes. Compact `yyyymmdd` input remains strict and does not accept ambiguous shorter values such as `2026720`.

Date editors keep invalid typed values visible by default with `invalidBehavior: 'commitRaw'`, so validators can report the error. Use `invalidBehavior: 'cancel'` for the older cancel-on-invalid behavior. Automatic separators are applied only for linear digit typing at the end of the field; manual separators, deletion, and middle edits are left as natural as possible. `minDate` and `maxDate` are supported by date editors and validators; the datepicker helps selection but does not replace validation.

Date validators can distinguish syntax errors, impossible calendar dates, values before `minDate`, values after `maxDate`, and required empty values. Existing boolean validators remain supported; validators may also return `{ isValid, message, code }` for dynamic messages.

With `picker: true`, the datepicker limits calendar selection but does not block or clean manual input. Manual invalid or out-of-range values are committed with `commitRaw` and then reported by validators; use `invalidBehavior: 'cancel'` for restrictive editing.

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

`mapToRow` uses `{ gridRowField: lookupRecordField }`. `keyField` is required
and validated for presence and uniqueness when records load. At least one
lookup column must declare `visible: true`. The modal displays and searches
only visible columns, while selection resolves the complete indexed record.
All mapped values pass through the AMB CRUD lifecycle, including row state,
field validation, rollback, and save payload generation.

`AMB.mlk(...)` is the dedicated Multifield Lookup API. A normal lookup answers
"which value should this cell store?". An MLK answers "which external record is
attached to this row, and which row fields must update together?".

```js
const municipalityLookup = AMB.lookup({
  keyField: 'istatCode',
  valueField: 'municipalityName',
  labelField: 'municipalityName',
  columns: municipalityLookupColumns,
  load: () => municipalityRecords
});

const municipalityMlk = AMB.mlk({
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
  municipalityMlk.masterColumn({ width: 220 }),
  municipalityMlk.dependentColumn('province', { width: 100 }),
  municipalityMlk.dependentColumn('region', { width: 130 }),
  municipalityMlk.dependentColumn('postalCode', { width: 125 }),
  municipalityMlk.dependentColumn('istatCode', { width: 120 })
];
```

The MLK mapping uses `{ from, field }`: `from` is the lookup record field and
`field` is the row field. Selecting a record or accepting a valid autocomplete
match applies one patch containing the master plus every dependent field.
Dependent fields are readonly by default, remain normal row fields for payload,
validation, state report and rollback, and do not require a separate
`technicalFields` option. If the master becomes empty or invalid, dependent
fields are cleared by default so stale data from a previous record is not kept.
`visibleInLookup: false` hides a lookup field from the dialog but does not
prevent it from being mapped into the row.

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

`AMB.editors.autocomplete(values, options)` is a native text input with suggestions from a simple string list, powered by Awesomplete. Awesomplete is only the lightweight suggestion engine: the selected or typed text is stored directly, the dropdown never owns the value, and there is no hidden associated data.

`maxOptions` defaults to `10` and limits the number of matching suggestions shown. It can be overridden, for example with `AMB.editors.autocomplete(values, { maxOptions: 15 })`.

The list supplies suggestions, the editor manages user input, and validators decide whether the stored value is acceptable. With `allowCustomValue: true`, custom typed values are accepted. In strict columns, `allowCustomValue: false` with `invalidBehavior: 'commitRaw'` keeps unknown text visible so `AMB.validators.allowedValues(...)` can report it. Use `invalidBehavior: 'cancel'` for restrictive editing.

Selected and typed values are trimmed only on commit by default with `trimInput: true`; set `trimInput: false` to preserve surrounding whitespace. Backspace and Delete retain native input behavior. Arrow keys navigate suggestions, Enter commits, Escape cancels, and Tab commits without blocking Tabulator navigation. At commit, `allowEmpty` and `invalidBehavior` determine whether an empty string is saved or the edit is cancelled.

`allowedValues` is synchronous and intended for static lists. Async validation is not included at this stage.

Autocomplete intentionally remains a local plain-text editor. It does not perform remote lookup or asynchronous validation.

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
variables to customize the base and alternate clean-row colors; Tabulator row
parity classes are not part of the styling contract, and CRUD state styles
take precedence over zebra striping.

## Security

AMB Grid escapes textual formatter output by default and generates structured CRUD payloads, not SQL queries.

Backend applications receiving AMB Grid payloads must still perform server-side validation, authorization checks and SQL injection prevention using parameterized queries, prepared statements, safe ORM methods or properly constructed stored procedures.

See [Security notes](docs/security.md).

## Lifecycle and cleanup

AMB Grid exposes two cleanup levels:

* `grid.destroy()` releases the complete AMB-managed grid returned by `AMB.table(...)`. It detaches AMB bindings, lookup and large-text hover helpers, search helpers, messages, dialogs, the CRUD helper, and then destroys the Tabulator table when Tabulator exposes `table.destroy()`.
* `grid.crud.destroy()` releases only the CRUD layer. It removes the Tabulator event handlers registered by `CrudHelper`, clears internal tracking maps, validators, errors and custom subscriptions, and does not destroy the Tabulator table.

Use `grid.destroy()` when a page section, modal, tab, or view owns the whole grid:

```js
const grid = AMB.table({ selector: '#people', data, columns });

// later, when the page section/modal/view is disposed
grid.destroy();
```

Use `grid.crud.destroy()` only when you created or manage the Tabulator table separately and want to detach the CRUD layer without disposing the table:

```js
const crud = new CrudHelper(table);

// later, detach only the CRUD layer
crud.destroy();
```

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

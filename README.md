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
* Lookup
* Large text

### Formatters

Formatting helpers for:

* Numbers
* Dates
* Lookup values
* Custom display logic

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

### Lookup System

Lookup fields with support for:

* Dialog selection
* Code validation
* Description management
* Autocomplete integration
* Hover descriptions

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

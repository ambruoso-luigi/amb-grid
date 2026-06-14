# AMB Grid

AMB Grid is an editable grid helper built on top of [Tabulator](https://tabulator.info/).

The project provides reusable components and utilities for building data-driven web applications with editable tables, CRUD state tracking, validation, lookup dialogs, search tools and save payload generation.

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
* Custom validators

Validator combinators:

* `anyOf(...)`
* `allOf(...)`

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

## Roadmap

The following areas are currently under active development:

* Additional validators
* Additional formatters
* International data formats
* Enhanced lookup capabilities
* Improved documentation
* Additional demo pages

## License

Licensed under the Apache License 2.0.

Copyright © 2026 Luigi Ambruoso.

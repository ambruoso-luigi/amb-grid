# tabulator-editable-helper

Editable helper layer built on top of [Tabulator](https://tabulator.info/).

This project adds utilities for building editable, data-driven grids with CRUD state tracking, validation, custom editors, formatters, lookup dialogs, search tools and save payload helpers.

## Project Status

⚠️ Early Preview / Work in Progress

This project is currently under active development.

The API is not yet considered stable and breaking changes may occur before version 1.0.

It is suitable for experiments, prototypes and internal evaluation, but it should not be considered production-ready yet.

## Features

- CRUD row state tracking
- New, modified, deleted and saved row states
- Rollback support
- Delete and remove-new row actions
- Validation system
- Built-in validators
- Validator combinators: `anyOf` and `allOf`
- Custom editors
- Custom formatters
- Date parsing and formatting helpers
- Lookup dialog support
- Autocomplete support
- Large text popup editor
- Row selection column
- Search and filters
- Save payload generation
- Temporary row ids and backend id mapping

## Main Concepts

### CRUD State Tracking

The helper tracks row changes and can generate payloads for save operations.

Rows can be marked as:

- clean
- new
- modified
- deleted
- saved

### Validation

Validation can be triggered when editing cells or manually by calling validation methods.

The library includes validators for common formats and also supports custom validation rules.

### Editors and Formatters

The project includes reusable editors and formatters for common grid scenarios, including numeric fields, dates, checkboxes, lookup fields and long text fields.

### Lookup Fields

Lookup fields can store a code while showing supporting descriptions through dialogs or hover messages.

### Backend Integration

The helper supports temporary ids for new rows and provides a way to apply backend-generated ids after saving.

## Documentation

Generated documentation is available in the `docs` folder.

## License

Licensed under the Apache License 2.0.

Copyright © 2026 Luigi Ambruoso.
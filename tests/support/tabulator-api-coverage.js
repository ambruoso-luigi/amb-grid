export const TABULATOR_API_VERSION = '6.4.0';

export const TABLE_API_COVERAGE = [
    // Alerts
    { method: 'alert', domain: 'alerts', status: 'exposed', classification: 'safe-pass-through', controller: 'alert-methods' },
    { method: 'clearAlert', domain: 'alerts', status: 'exposed', classification: 'safe-pass-through', controller: 'alert-methods' },

    // Calculation
    { method: 'getCalcResults', domain: 'calculation', status: 'exposed', classification: 'safe-pass-through', controller: 'calculation-methods' },
    { method: 'recalc', domain: 'calculation', status: 'exposed', classification: 'safe-pass-through', controller: 'calculation-methods' },

    // Columns
    { method: 'addColumn', domain: 'columns', status: 'missing', classification: 'delicate', reason: 'Runtime column insertion needs AMB configuration and lifecycle design.' },
    { method: 'deleteColumn', domain: 'columns', status: 'missing', classification: 'delicate', reason: 'Runtime column removal needs AMB configuration and lifecycle design.' },
    { method: 'getColumn', domain: 'columns', status: 'exposed', classification: 'safe-pass-through', controller: 'column-methods' },
    { method: 'getColumnDefinitions', domain: 'columns', status: 'exposed', classification: 'safe-pass-through', controller: 'column-methods' },
    { method: 'getColumns', domain: 'columns', status: 'exposed', classification: 'safe-pass-through', controller: 'column-methods' },
    { method: 'hideColumn', domain: 'columns', status: 'exposed', classification: 'safe-pass-through', controller: 'column-methods' },
    { method: 'moveColumn', domain: 'columns', status: 'exposed', classification: 'safe-pass-through', controller: 'column-methods' },
    { method: 'scrollToColumn', domain: 'columns', status: 'exposed', classification: 'safe-pass-through', controller: 'column-methods' },
    { method: 'setColumns', domain: 'columns', status: 'missing', classification: 'delicate', reason: 'Full column replacement needs AMB editor, validator, and helper reconfiguration.' },
    { method: 'showColumn', domain: 'columns', status: 'exposed', classification: 'safe-pass-through', controller: 'column-methods' },
    { method: 'toggleColumn', domain: 'columns', status: 'exposed', classification: 'safe-pass-through', controller: 'column-methods' },
    { method: 'updateColumnDefinition', domain: 'columns', status: 'missing', classification: 'delicate', reason: 'Definition replacement needs AMB editor, validator, and helper reconfiguration.' },

    // Data
    { method: 'addData', domain: 'data', status: 'narrower-contract', classification: 'overridden', controller: 'data-methods', reason: 'AMB accepts an object array rather than every native data input form.' },
    { method: 'clearData', domain: 'data', status: 'missing', classification: 'AMB-aware', reason: 'Clearing rows must reconcile CRUD state, snapshots, errors, and numbering.' },
    { method: 'getAjaxUrl', domain: 'data', status: 'exposed', classification: 'safe-pass-through', controller: 'data-methods' },
    { method: 'getData', domain: 'data', status: 'exposed', classification: 'safe-pass-through', controller: 'data-methods' },
    { method: 'getDataCount', domain: 'data', status: 'exposed', classification: 'safe-pass-through', controller: 'data-methods' },
    { method: 'replaceData', domain: 'data', status: 'exposed', classification: 'overridden', controller: 'data-methods' },
    { method: 'searchData', domain: 'data', status: 'exposed', classification: 'safe-pass-through', controller: 'data-methods' },
    { method: 'setData', domain: 'data', status: 'exposed', classification: 'overridden', controller: 'data-methods' },
    { method: 'updateData', domain: 'data', status: 'narrower-contract', classification: 'overridden', controller: 'data-methods', reason: 'AMB accepts sequential object patches and intentionally omits native string input.' },
    { method: 'updateOrAddData', domain: 'data', status: 'missing', classification: 'AMB-aware', reason: 'Mixed insert and update batches need an explicit AMB CRUD contract.' },

    // Editing and validation
    { method: 'clearCellEdited', domain: 'editing', status: 'exposed', classification: 'safe-pass-through', controller: 'cell-state-methods' },
    { method: 'clearCellValidation', domain: 'validation', status: 'exposed', classification: 'safe-pass-through', controller: 'cell-state-methods' },
    { method: 'getEditedCells', domain: 'editing', status: 'exposed', classification: 'safe-pass-through', controller: 'cell-state-methods' },
    { method: 'getInvalidCells', domain: 'validation', status: 'exposed', classification: 'safe-pass-through', controller: 'cell-state-methods' },
    { method: 'validate', domain: 'validation', status: 'exposed', classification: 'overridden', controller: 'validation-methods' },

    // Events
    { method: 'off', domain: 'events', status: 'exposed', classification: 'AMB-aware', controller: 'event-methods' },
    { method: 'on', domain: 'events', status: 'exposed', classification: 'AMB-aware', controller: 'event-methods' },

    // Export
    { method: 'copyToClipboard', domain: 'export', status: 'exposed', classification: 'safe-pass-through', controller: 'export-methods' },
    { method: 'download', domain: 'export', status: 'exposed', classification: 'safe-pass-through', controller: 'export-methods' },
    { method: 'downloadToTab', domain: 'export', status: 'exposed', classification: 'safe-pass-through', controller: 'export-methods' },
    { method: 'getHtml', domain: 'export', status: 'exposed', classification: 'safe-pass-through', controller: 'export-methods' },
    { method: 'print', domain: 'export', status: 'exposed', classification: 'safe-pass-through', controller: 'export-methods' },

    // Filters
    { method: 'addFilter', domain: 'filters', status: 'exposed', classification: 'safe-pass-through', controller: 'filter-methods' },
    { method: 'clearFilter', domain: 'filters', status: 'exposed', classification: 'AMB-aware', controller: 'filter-methods' },
    { method: 'clearHeaderFilter', domain: 'filters', status: 'exposed', classification: 'safe-pass-through', controller: 'filter-methods' },
    { method: 'getFilters', domain: 'filters', status: 'exposed', classification: 'AMB-aware', controller: 'filter-methods' },
    { method: 'getHeaderFilters', domain: 'filters', status: 'exposed', classification: 'safe-pass-through', controller: 'filter-methods' },
    { method: 'getHeaderFilterValue', domain: 'filters', status: 'exposed', classification: 'safe-pass-through', controller: 'filter-methods' },
    { method: 'refreshFilter', domain: 'filters', status: 'exposed', classification: 'safe-pass-through', controller: 'filter-methods' },
    { method: 'removeFilter', domain: 'filters', status: 'exposed', classification: 'safe-pass-through', controller: 'filter-methods' },
    { method: 'searchRows', domain: 'filters', status: 'exposed', classification: 'safe-pass-through', controller: 'row-methods' },
    { method: 'setFilter', domain: 'filters', status: 'exposed', classification: 'AMB-aware', controller: 'filter-methods' },
    { method: 'setHeaderFilterFocus', domain: 'filters', status: 'exposed', classification: 'safe-pass-through', controller: 'filter-methods' },
    { method: 'setHeaderFilterValue', domain: 'filters', status: 'exposed', classification: 'safe-pass-through', controller: 'filter-methods' },

    // Grouping
    { method: 'getGroupedData', domain: 'grouping', status: 'exposed', classification: 'safe-pass-through', controller: 'grouping-methods' },
    { method: 'getGroups', domain: 'grouping', status: 'exposed', classification: 'safe-pass-through', controller: 'grouping-methods' },
    { method: 'setGroupBy', domain: 'grouping', status: 'exposed', classification: 'safe-pass-through', controller: 'grouping-methods' },
    { method: 'setGroupHeader', domain: 'grouping', status: 'exposed', classification: 'safe-pass-through', controller: 'grouping-methods' },
    { method: 'setGroupStartOpen', domain: 'grouping', status: 'exposed', classification: 'safe-pass-through', controller: 'grouping-methods' },
    { method: 'setGroupValues', domain: 'grouping', status: 'exposed', classification: 'safe-pass-through', controller: 'grouping-methods' },

    // History
    { method: 'clearHistory', domain: 'history', status: 'exposed', classification: 'safe-pass-through', controller: 'history-methods' },
    { method: 'getHistoryRedoSize', domain: 'history', status: 'exposed', classification: 'safe-pass-through', controller: 'history-methods' },
    { method: 'getHistoryUndoSize', domain: 'history', status: 'exposed', classification: 'safe-pass-through', controller: 'history-methods' },
    { method: 'redo', domain: 'history', status: 'deferred', classification: 'delicate', reason: 'Redo needs coordination with AMB snapshots, validation, and CRUD state.' },
    { method: 'undo', domain: 'history', status: 'deferred', classification: 'delicate', reason: 'Undo needs coordination with AMB snapshots, validation, and CRUD state.' },

    // Import
    { method: 'import', domain: 'import', status: 'deferred', classification: 'delicate', reason: 'Imported data needs a defined AMB replacement or merge lifecycle.' },

    // Internal extension surface
    { method: 'dispatchEvent', domain: 'internal', status: 'intentionally-excluded', classification: 'not-applicable', reason: 'Internal event dispatch is not normal application controller access.' },
    { method: 'modExists', domain: 'internal', status: 'intentionally-excluded', classification: 'not-applicable', reason: 'Module introspection remains available through advanced engine access.' },
    { method: 'module', domain: 'internal', status: 'intentionally-excluded', classification: 'not-applicable', reason: 'Module instances remain available through advanced engine access.' },

    // Layout
    { method: 'setHeight', domain: 'layout', status: 'exposed', classification: 'safe-pass-through', controller: 'layout-methods' },
    { method: 'setMaxHeight', domain: 'layout', status: 'exposed', classification: 'safe-pass-through', controller: 'layout-methods' },
    { method: 'setMinHeight', domain: 'layout', status: 'exposed', classification: 'safe-pass-through', controller: 'layout-methods' },

    // Lifecycle
    { method: 'destroy', domain: 'lifecycle', status: 'exposed', classification: 'overridden', controller: 'lifecycle-methods' },

    // Localization
    { method: 'getLang', domain: 'localization', status: 'exposed', classification: 'safe-pass-through', controller: 'localization-methods' },
    { method: 'getLocale', domain: 'localization', status: 'exposed', classification: 'safe-pass-through', controller: 'localization-methods' },
    { method: 'setLocale', domain: 'localization', status: 'exposed', classification: 'safe-pass-through', controller: 'localization-methods' },

    // Navigation
    { method: 'navigateDown', domain: 'navigation', status: 'exposed', classification: 'safe-pass-through', controller: 'navigation-methods' },
    { method: 'navigateLeft', domain: 'navigation', status: 'exposed', classification: 'safe-pass-through', controller: 'navigation-methods' },
    { method: 'navigateNext', domain: 'navigation', status: 'exposed', classification: 'safe-pass-through', controller: 'navigation-methods' },
    { method: 'navigatePrev', domain: 'navigation', status: 'exposed', classification: 'safe-pass-through', controller: 'navigation-methods' },
    { method: 'navigateRight', domain: 'navigation', status: 'exposed', classification: 'safe-pass-through', controller: 'navigation-methods' },
    { method: 'navigateUp', domain: 'navigation', status: 'exposed', classification: 'safe-pass-through', controller: 'navigation-methods' },

    // Pagination
    { method: 'getPage', domain: 'pagination', status: 'exposed', classification: 'safe-pass-through', controller: 'pagination-methods' },
    { method: 'getPageMax', domain: 'pagination', status: 'exposed', classification: 'safe-pass-through', controller: 'pagination-methods' },
    { method: 'getPageSize', domain: 'pagination', status: 'exposed', classification: 'safe-pass-through', controller: 'pagination-methods' },
    { method: 'nextPage', domain: 'pagination', status: 'exposed', classification: 'safe-pass-through', controller: 'pagination-methods' },
    { method: 'previousPage', domain: 'pagination', status: 'exposed', classification: 'safe-pass-through', controller: 'pagination-methods' },
    { method: 'setMaxPage', domain: 'pagination', status: 'exposed', classification: 'safe-pass-through', controller: 'pagination-methods' },
    { method: 'setPage', domain: 'pagination', status: 'exposed', classification: 'safe-pass-through', controller: 'pagination-methods' },
    { method: 'setPageSize', domain: 'pagination', status: 'exposed', classification: 'safe-pass-through', controller: 'pagination-methods' },
    { method: 'setPageToRow', domain: 'pagination', status: 'exposed', classification: 'AMB-aware', controller: 'pagination-methods' },

    // Persistence
    { method: 'getColumnLayout', domain: 'persistence', status: 'exposed', classification: 'safe-pass-through', controller: 'persistence-methods' },
    { method: 'setColumnLayout', domain: 'persistence', status: 'exposed', classification: 'safe-pass-through', controller: 'persistence-methods' },

    // Range
    { method: 'addRange', domain: 'range', status: 'exposed', classification: 'safe-pass-through', controller: 'range-methods' },
    { method: 'getRanges', domain: 'range', status: 'exposed', classification: 'safe-pass-through', controller: 'range-methods' },
    { method: 'getRangesData', domain: 'range', status: 'exposed', classification: 'safe-pass-through', controller: 'range-methods' },

    // Redraw
    { method: 'blockRedraw', domain: 'redraw', status: 'exposed', classification: 'safe-pass-through', controller: 'redraw-methods' },
    { method: 'redraw', domain: 'redraw', status: 'exposed', classification: 'safe-pass-through', controller: 'redraw-methods' },
    { method: 'restoreRedraw', domain: 'redraw', status: 'exposed', classification: 'safe-pass-through', controller: 'redraw-methods' },

    // Rows
    { method: 'addRow', domain: 'rows', status: 'narrower-contract', classification: 'overridden', controller: 'crud-methods', reason: 'AMB omits native row positioning arguments and adds managed-row focus behavior.' },
    { method: 'deleteRow', domain: 'rows', status: 'narrower-contract', classification: 'overridden', controller: 'crud-methods', reason: 'AMB accepts one managed identifier and returns a boolean instead of native batch deletion.' },
    { method: 'getRow', domain: 'rows', status: 'exposed', classification: 'AMB-aware', controller: 'row-methods' },
    { method: 'getRowFromPosition', domain: 'rows', status: 'exposed', classification: 'safe-pass-through', controller: 'row-methods' },
    { method: 'getRowPosition', domain: 'rows', status: 'exposed', classification: 'AMB-aware', controller: 'row-methods' },
    { method: 'getRows', domain: 'rows', status: 'exposed', classification: 'safe-pass-through', controller: 'row-methods' },
    { method: 'moveRow', domain: 'rows', status: 'narrower-contract', classification: 'AMB-aware', controller: 'row-methods', reason: 'AMB rejects grouped and Data Tree moves and realigns technical numbering.' },
    { method: 'scrollToRow', domain: 'rows', status: 'exposed', classification: 'AMB-aware', controller: 'row-methods' },
    { method: 'updateOrAddRow', domain: 'rows', status: 'missing', classification: 'AMB-aware', reason: 'Conditional insert or update needs an explicit managed-row CRUD contract.' },
    { method: 'updateRow', domain: 'rows', status: 'narrower-contract', classification: 'overridden', controller: 'crud-methods', reason: 'AMB returns a synchronous row result and protects managed CRUD semantics.' },

    // Selection
    { method: 'deselectRow', domain: 'selection', status: 'narrower-contract', classification: 'AMB-aware', controller: 'selection-methods', reason: 'AMB deselects one managed identifier rather than native arrays or all rows.' },
    { method: 'getSelectedData', domain: 'selection', status: 'exposed', classification: 'safe-pass-through', controller: 'selection-methods' },
    { method: 'getSelectedRows', domain: 'selection', status: 'narrower-contract', classification: 'overridden', controller: 'selection-methods', reason: 'AMB returns selected row data under this compatibility name, not Row Components.' },
    { method: 'selectRow', domain: 'selection', status: 'narrower-contract', classification: 'AMB-aware', controller: 'selection-methods', reason: 'AMB selects one managed identifier rather than native arrays, ranges, or all rows.' },
    { method: 'toggleSelectRow', domain: 'selection', status: 'narrower-contract', classification: 'AMB-aware', controller: 'selection-methods', reason: 'AMB accepts backend or temporary identifiers rather than every native row lookup.' },

    // Sorting
    { method: 'clearSort', domain: 'sorting', status: 'exposed', classification: 'safe-pass-through', controller: 'sort-methods' },
    { method: 'getSorters', domain: 'sorting', status: 'exposed', classification: 'safe-pass-through', controller: 'sort-methods' },
    { method: 'setSort', domain: 'sorting', status: 'exposed', classification: 'safe-pass-through', controller: 'sort-methods' },

    // Spreadsheet
    { method: 'activeSheet', domain: 'spreadsheet', status: 'exposed', classification: 'safe-pass-through', controller: 'spreadsheet-methods' },
    { method: 'addSheet', domain: 'spreadsheet', status: 'exposed', classification: 'safe-pass-through', controller: 'spreadsheet-methods' },
    { method: 'clearSheet', domain: 'spreadsheet', status: 'exposed', classification: 'safe-pass-through', controller: 'spreadsheet-methods' },
    { method: 'getSheet', domain: 'spreadsheet', status: 'exposed', classification: 'safe-pass-through', controller: 'spreadsheet-methods' },
    { method: 'getSheetData', domain: 'spreadsheet', status: 'exposed', classification: 'safe-pass-through', controller: 'spreadsheet-methods' },
    { method: 'getSheetDefinitions', domain: 'spreadsheet', status: 'exposed', classification: 'safe-pass-through', controller: 'spreadsheet-methods' },
    { method: 'getSheets', domain: 'spreadsheet', status: 'exposed', classification: 'safe-pass-through', controller: 'spreadsheet-methods' },
    { method: 'removeSheet', domain: 'spreadsheet', status: 'exposed', classification: 'safe-pass-through', controller: 'spreadsheet-methods' },
    { method: 'setSheetData', domain: 'spreadsheet', status: 'exposed', classification: 'safe-pass-through', controller: 'spreadsheet-methods' },
    { method: 'setSheets', domain: 'spreadsheet', status: 'exposed', classification: 'safe-pass-through', controller: 'spreadsheet-methods' }
];

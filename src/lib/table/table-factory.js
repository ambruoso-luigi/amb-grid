import { TabulatorFull as Tabulator } from 'tabulator-tables';
import { CrudHelper } from '../crud-helper.js';
import { CellMessageBinder } from '../../ui/cell-message-binder.js';
import { FloatingMessage } from '../../ui/floating-message.js';
import { ConfirmDialog } from '../../ui/confirm-dialog.js';
import { FeedbackRegion } from '../../ui/feedback-region.js';
import { createToolbar } from '../../ui/toolbar.js';
import { DEFAULT_MESSAGES } from './validation-extraction.js';
import { createRowActionColumn } from './row-action-column.js';
import { createSelectionColumn } from './selection-column.js';
import { createSearchController } from './search-controller.js';
import {
    bindLookupMetadataInitialization,
    prepareColumnPipeline
} from './column-pipeline.js';
import { createColumnRuntime } from './column-runtime.js';
import { bindDeletedRowCalculationRecalc } from './column-calculation-runtime.js';
import { createCalculationPresentationRuntime } from './calculation-presentation-runtime.js';
import { createHistoryRuntime } from './history-runtime.js';
import { composeControllerMethods } from './controller/compose-controller-methods.js';
import { createAlertMethods } from './controller/alert-methods.js';
import { createCalculationMethods } from './controller/calculation-methods.js';
import { createCellMethods } from './controller/cell-methods.js';
import { createCellStateMethods } from './controller/cell-state-methods.js';
import { createColumnMethods } from './controller/column-methods.js';
import { createCrudMethods } from './controller/crud-methods.js';
import { createDataMethods } from './controller/data-methods.js';
import { createEventMethods } from './controller/event-methods.js';
import { createExportMethods } from './controller/export-methods.js';
import { createGroupingMethods } from './controller/grouping-methods.js';
import { createHistoryMethods } from './controller/history-methods.js';
import { createLayoutMethods } from './controller/layout-methods.js';
import { createLifecycleMethods } from './controller/lifecycle-methods.js';
import { createLocalizationMethods } from './controller/localization-methods.js';
import { createNavigationMethods } from './controller/navigation-methods.js';
import { createPersistenceMethods } from './controller/persistence-methods.js';
import { createPopupMethods } from './controller/popup-methods.js';
import { createRedrawMethods } from './controller/redraw-methods.js';
import { createRowMethods } from './controller/row-methods.js';
import { createPaginationMethods } from './controller/pagination-methods.js';
import { createSelectionMethods } from './controller/selection-methods.js';
import { createSpreadsheetMethods } from './controller/spreadsheet-methods.js';
import { createRangeMethods } from './controller/range-methods.js';
import { createFilterMethods } from './controller/filter-methods.js';
import { createSearchMethods } from './controller/search-methods.js';
import { createSortMethods } from './controller/sort-methods.js';
import { createValidationMethods } from './controller/validation-methods.js';
import { createPaginationKeyboardRuntime } from './pagination-keyboard-runtime.js';

export {
    applyDefaultColumnAlignments,
    bindLookupMetadataInitialization,
    collectLookupColumns,
    initializeLookupMetadataForRows,
    prepareCheckboxColumns,
    prepareLookupColumns
} from './column-pipeline.js';

const DEFAULT_PAGINATION_MODE = 'local';
const DEFAULT_PAGINATION_SIZE = 10;
const DEFAULT_FLOATING_MESSAGE_OPTIONS = {
    enabled: true,
    lookupDescriptions: true,
    validationErrors: true,
    largeTextPreviews: true,
    searchFilterStatus: true
};

const registerDeclarativeValidators = (crud, validators = []) => {
    if (typeof crud.replaceDeclarativeCellValidators !== 'function') {
        validators.forEach(validator => {
            if (typeof validator.validate !== 'function') return;

            crud.addCellValidator(
                validator.field,
                validator.message,
                validator.validate
            );
        });
        return;
    }

    const validatorsByField = new Map();

    validators.forEach(validator => {
        if (typeof validator.validate !== 'function') return;

        const fieldValidators = validatorsByField.get(validator.field) || [];

        fieldValidators.push({
            message: validator.message,
            validateFn: validator.validate
        });
        validatorsByField.set(validator.field, fieldValidators);
    });

    validatorsByField.forEach((fieldValidators, field) => {
        crud.replaceDeclarativeCellValidators(field, fieldValidators);
    });
};

const isPaginationConfig = pagination => {
    return pagination
        && typeof pagination === 'object'
        && !Array.isArray(pagination);
};

const applyPaginationAddRowOption = options => {
    if (
        options.pagination
        && options.paginationAddRow === undefined
    ) {
        options.paginationAddRow = 'table';
    }

    return options;
};

export const normalizePaginationOptions = (options = {}) => {
    const nextOptions = { ...options };
    const pagination = options.pagination;

    if (!isPaginationConfig(pagination)) {
        return applyPaginationAddRowOption(nextOptions);
    }

    if (pagination.enabled === false) {
        nextOptions.pagination = false;
        return nextOptions;
    }

    const pageSize = Number(pagination.pageSize);
    const mode = typeof pagination.mode === 'string' && pagination.mode
        ? pagination.mode
        : DEFAULT_PAGINATION_MODE;

    nextOptions.pagination = true;
    nextOptions.paginationMode = mode;
    nextOptions.paginationSize = Number.isInteger(pageSize) && pageSize > 0
        ? pageSize
        : DEFAULT_PAGINATION_SIZE;

    if (Object.prototype.hasOwnProperty.call(pagination, 'pageSizeSelector')) {
        nextOptions.paginationSizeSelector = pagination.pageSizeSelector;
    }

    return applyPaginationAddRowOption(nextOptions);
};

export const normalizeFloatingMessageOptions = (floatingMessages = undefined) => {
    if (floatingMessages === false) {
        return {
            enabled: false,
            lookupDescriptions: false,
            validationErrors: false,
            largeTextPreviews: false,
            searchFilterStatus: false
        };
    }

    const configured = floatingMessages && typeof floatingMessages === 'object'
        ? floatingMessages
        : {};
    const enabled = configured.enabled !== false;

    if (!enabled) {
        return {
            enabled: false,
            lookupDescriptions: false,
            validationErrors: false,
            largeTextPreviews: false,
            searchFilterStatus: false
        };
    }

    return {
        ...DEFAULT_FLOATING_MESSAGE_OPTIONS,
        enabled: true,
        lookupDescriptions: configured.lookupDescriptions !== false,
        validationErrors: configured.validationErrors !== false,
        largeTextPreviews: configured.largeTextPreviews !== false,
        searchFilterStatus: configured.searchFilterStatus !== false
    };
};

/**
 * Public controller returned by `AMB.table(...)`.
 *
 * The controller is the main AMB Grid API for data access, row operations,
 * selection, pagination, filters, search, validation, payload generation and
 * lifecycle cleanup.
 *
 * AMB Grid manages the underlying table engine internally. Advanced engine
 * access remains available for integration scenarios not covered by the
 * controller API, but normal application code should prefer the methods
 * exposed directly on this controller.
 *
 * `destroy()` releases the complete AMB-managed grid, including AMB event
 * bindings, lookup and large-text helpers, search helpers, floating messages,
 * dialogs, the CRUD layer and the internally managed table engine.
 *
 * @callback AMBGridDataGetter
 * @param {...unknown[]} args - Engine-compatible range arguments.
 * @returns {object[]} Current row data.
 */

/**
 * @callback AMBGridDataCountGetter
 * @param {...unknown[]} args - Engine-compatible range arguments.
 * @returns {number} Number of rows in the requested range.
 */

/**
 * @callback AMBGridEventCallback
 * @param {...unknown[]} args - Event-specific payload.
 * @returns {void}
 */

/**
 * @callback AMBGridOn
 * @param {string} eventName - Public grid event name.
 * @param {AMBGridEventCallback} callback - Event callback.
 * @returns {void}
 */

/**
 * @callback AMBGridOff
 * @param {string} eventName - Public grid event name.
 * @param {AMBGridEventCallback} [callback] - Specific callback to remove.
 * @returns {void}
 */

/**
 * @callback AMBGridCrudUnsubscribe
 * @returns {void}
 */

/**
 * @callback AMBGridOnCrud
 * @param {string} eventName - AMB CRUD event name.
 * @param {AMBGridEventCallback} callback - CRUD event callback.
 * @returns {AMBGridCrudUnsubscribe} Unsubscribe function.
 */

/**
 * @callback AMBGridDestroy
 * @returns {void}
 */

/**
 * @typedef {number|'first'|'prev'|'next'|'last'} AMBPageSelector
 */

/**
 * @callback AMBGridGetPage
 * @returns {number|false}
 */

/**
 * @callback AMBGridGetPageSize
 * @returns {number}
 */

/**
 * @callback AMBGridSetPage
 * @param {AMBPageSelector} page - Page to display.
 * @returns {Promise<unknown>}
 */

/**
 * @callback AMBGridChangePage
 * @returns {Promise<unknown>}
 */

/**
 * @callback AMBGridSetPageSize
 * @param {number} size - Number of rows to display on each page.
 * @returns {unknown}
 */

/**
 * @callback AMBGridSetMaxPage
 * @param {unknown} max - Maximum page value accepted by the runtime engine.
 * @returns {void}
 */

/**
 * @callback AMBGridSetPageToRow
 * @param {unknown} identifier - Row identifier or lookup value.
 * @returns {Promise<unknown>}
 */

/**
 * @callback AMBFilterCallback
 * @param {object} data - Row data to evaluate.
 * @param {object} [params] - Optional callback parameters.
 * @returns {boolean}
 */

/**
 * @typedef {object} AMBFilterDefinition
 * @property {string} field - Field name to filter.
 * @property {string} type - Filter comparison type.
 * @property {unknown} value - Value to compare.
 * @property {object} [params] - Optional filter parameters.
 */

/**
 * @callback AMBGridGetFilters
 * @param {...unknown[]} args - Engine-compatible filter read arguments.
 * @returns {object[]}
 */

/**
 * @callback AMBGridSetFilter
 * @param {string|AMBFilterCallback|AMBFilterDefinition[]} filter - Field, custom callback, or filter definitions.
 * @param {string|object} [typeOrParams] - Filter type for a field, or callback parameters.
 * @param {unknown} [value] - Filter value for a field filter.
 * @returns {unknown}
 */

/**
 * @callback AMBGridFilterMutator
 * @param {...unknown[]} args - Engine-compatible filter arguments.
 * @returns {unknown}
 */

/**
 * @callback AMBGridClearFilter
 * @param {boolean} [includeHeaderFilters] - Also clear header filters.
 * @returns {unknown}
 */

/**
 * @callback AMBGridRefreshFilter
 * @returns {void}
 */

/**
 * @callback AMBGridGetAjaxUrl
 * @returns {string}
 */

/**
 * @callback AMBGridDataRebase
 * @param {...unknown[]} args - Data-loading arguments forwarded to the engine.
 * @returns {unknown|Promise<unknown>|false}
 */

/**
 * @callback AMBGridImport
 * @param {unknown} format - Import format.
 * @param {unknown} accept - Accepted file types.
 * @param {unknown} reader - File reader mode.
 * @returns {Promise<unknown>|false}
 */

/**
 * @callback AMBGridClearData
 * @returns {unknown|Promise<unknown>|false}
 */

/**
 * @callback AMBGridAddData
 * @param {object[]} rowsData - Rows to add.
 * @param {unknown} addToTop - Position flag forwarded to the engine.
 * @param {unknown} [positionIdentifier] - Optional position identifier.
 * @returns {Promise<object[]>|false}
 */

/**
 * @callback AMBGridUpdateData
 * @param {object[]} rowsData - Row patches to update.
 * @returns {Promise<void>|false}
 */

/**
 * @callback AMBGridUpdateOrAddData
 * @param {object[]} rowsData - Rows to update or add.
 * @returns {Promise<object[]>|false}
 */

/**
 * @callback AMBGridUpdateOrAddRow
 * @param {unknown} identifier - Row identifier.
 * @param {object} rowData - Row data to update or add.
 * @returns {Promise<object|null>|false}
 */

/**
 * @callback AMBGridSearchData
 * @param {...unknown[]} args - Engine-compatible filter arguments.
 * @returns {object[]}
 */

/**
 * @callback AMBGridRecalc
 * @returns {void}
 */

/**
 * @callback AMBGridRowHeightOperation
 * @param {unknown} identifier - Row identifier or lookup value.
 * @returns {boolean}
 */

/**
 * @callback AMBGridScrollToRow
 * @param {unknown} identifier - Row identifier or lookup value.
 * @param {'top'|'center'|'bottom'|'nearest'} [position] - Scroll position.
 * @param {boolean} [scrollIfVisible] - Scroll even when already visible.
 * @returns {Promise<void>}
 */

/**
 * @callback AMBGridCellValidator
 * @param {unknown} value - Cell value to validate.
 * @param {object} rowData - Current row data.
 * @param {unknown} cell - Runtime cell component.
 * @param {CrudHelper} helper - AMB CRUD helper instance.
 * @returns {boolean} Whether the value is valid.
 */

/**
 * @callback AMBGridAddCellValidator
 * @param {string} field - Cell field name.
 * @param {string} message - Error message used when validation fails.
 * @param {AMBGridCellValidator} validateFn - Validator callback.
 * @returns {void}
 */

/**
 * @typedef {object} AMBTableController
 * @property {object} table - Internal table engine instance for advanced integrations. Prefer controller methods for normal usage.
 * @property {CrudHelper} crud - Advanced, compatible access to the CRUD layer. Prefer direct controller methods for normal reports and save payloads.
 * @property {Function} getColumnDefinitions - Return the current grid column definitions.
 * @property {Function} getColumns - Return current column components.
 * @property {Function} getColumn - Return one column component using a supported lookup.
 * @property {Function} updateColumnDefinition - Update one application data column and synchronize its AMB Grid runtime configuration.
 * @property {Function} addColumn - Add one top-level application data column through the managed AMB Grid column pipeline.
 * @property {Function} deleteColumn - Remove one top-level application data column while preserving AMB Grid row data and CRUD tracking.
 * @property {Function} setColumns - Replace the complete application column tree through the managed AMB Grid column pipeline.
 * @property {Function} getColumnDefinition - Return the runtime definition for one column.
 * @property {Function} getColumnElement - Return the runtime DOM element for one column.
 * @property {Function} getColumnField - Return the runtime field for one column.
 * @property {Function} getColumnCells - Return runtime Cell Components for one column.
 * @property {Function} validateColumnCells - Run native validation for one column's cells and return true or the failed Cell Components, not an AMB report.
 * @property {Function} getColumnRanges - Return selected Range Components overlapping one column.
 * @property {Function} isColumnVisible - Return the runtime visibility state for one column.
 * @property {Function} getColumnWidth - Return the runtime width for one column.
 * @property {Function} setColumnWidth - Set the runtime width for one column.
 * @property {Function} setColumnTitle - Update only the runtime title of one resolved column.
 * @property {Function} getColumnSubColumns - Return runtime child Column Components for one column.
 * @property {Function} getColumnParent - Return the runtime parent Column Component for one column.
 * @property {Function} getNextColumn - Return the next runtime Column Component.
 * @property {Function} getPrevColumn - Return the previous runtime Column Component.
 * @property {Function} getColumnDownloadTitle - Return the runtime title used for column downloads.
 * @property {Function} getColumnLayout - Return the current persistable column layout.
 * @property {Function} setColumnLayout - Apply a persistent column layout.
 * @property {Function} showColumn - Show a hidden grid column.
 * @property {Function} hideColumn - Hide a visible grid column.
 * @property {Function} toggleColumn - Toggle a grid column's visibility.
 * @property {Function} scrollToColumn - Scroll horizontally to a grid column.
 * @property {Function} moveColumn - Move a grid column relative to another column.
 * @property {Function} getSelectedRows - Return selected row data using the existing AMB Grid compatibility behavior.
 * @property {Function} getSelectedData - Return the data objects for the selected rows.
 * @property {Function} getSelectedRowComponents - Return the components for the selected rows.
 * @property {Function} clearSelection - Clear the complete row selection.
 * @property {Function} isRowSelected - Return whether one AMB Grid row is selected.
 * @property {Function} selectRow - Select one row by backend id or AMB temporary id.
 * @property {Function} deselectRow - Deselect one row by backend id or AMB temporary id.
 * @property {Function} toggleSelectRow - Toggle one row using a backend or AMB temporary identifier.
 * @property {Function} addRange - Add a selected range between two cell components.
 * @property {Function} getRanges - Return the current selected cell-range components.
 * @property {Function} getRangesData - Return data grouped by selected cell range.
 * @property {Function} getRangeElement - Return the runtime DOM element for one selected range.
 * @property {Function} getRangeData - Return runtime data for one selected range.
 * @property {Function} clearRangeValues - Clear application fields in one selected range through grouped AMB CRUD updates.
 * @property {Function} getRangeCells - Return runtime Cell Components for one selected range.
 * @property {Function} getRangeStructuredCells - Return structured runtime Cell Components for one selected range.
 * @property {Function} getRangeRows - Return runtime Row Components for one selected range.
 * @property {Function} getRangeColumns - Return runtime Column Components for one selected range.
 * @property {Function} getRangeBounds - Return the runtime bounds structure for one selected range.
 * @property {Function} getRangeTopEdge - Return the runtime top edge value for one selected range.
 * @property {Function} getRangeBottomEdge - Return the runtime bottom edge value for one selected range.
 * @property {Function} getRangeLeftEdge - Return the runtime left edge value for one selected range.
 * @property {Function} getRangeRightEdge - Return the runtime right edge value for one selected range.
 * @property {Function} setRangeBounds - Update both runtime bounds of one selected range.
 * @property {Function} setRangeStartBound - Update the runtime start bound of one selected range.
 * @property {Function} setRangeEndBound - Update the runtime end bound of one selected range.
 * @property {Function} removeRange - Remove one selected range from the runtime selection.
 * @property {Function} setSearchQuery - Set the global search query.
 * @property {Function} clearSearch - Clear global search state.
 * @property {Function} getSearchState - Return search query and selected search fields.
 * @property {Function} setSearchFields - Set the active search fields.
 * @property {Function} setSearchOptions - Set case-sensitive and whole-word search options.
 * @property {Function} getHeaderFilters - Return the current column header filters.
 * @property {Function} getHeaderFilterValue - Return the current header filter value for a column.
 * @property {Function} setHeaderFilterValue - Set the header filter value for a column.
 * @property {Function} setHeaderFilterFocus - Move focus to a column header filter.
 * @property {Function} reloadHeaderFilter - Rebuild a column's runtime header filter and re-evaluate its editor parameters.
 * @property {Function} clearHeaderFilter - Clear all column header filters.
 * @property {AMBGridRefreshFilter} refreshFilter - Re-run the filters currently applied to the grid.
 * @property {AMBGridGetFilters} getFilters - Return the current developer-managed filters.
 * @property {AMBGridFilterMutator} addFilter - Add a programmatic filter.
 * @property {AMBGridSetFilter} setFilter - Replace the developer-managed programmatic filters.
 * @property {AMBGridFilterMutator} removeFilter - Remove a programmatic filter.
 * @property {AMBGridClearFilter} clearFilter - Clear developer-managed filters while preserving global search.
 * @property {Function} getSorters - Return the current grid sorter definitions.
 * @property {Function} setSort - Apply one or more grid sorters.
 * @property {Function} clearSort - Clear the current grid sorting.
 * @property {AMBGridGetAjaxUrl} getAjaxUrl - Return the current AJAX data URL.
 * @property {AMBGridDataGetter} getData - Return the current grid row data.
 * @property {AMBGridDataCountGetter} getDataCount - Return the number of rows in the requested range.
 * @property {AMBGridDataRebase} setData - Replace the current dataset and register the loaded rows as a new clean AMB Grid CRUD baseline.
 * @property {AMBGridDataRebase} replaceData - Silently replace the current dataset and register the loaded rows as a new clean AMB Grid CRUD baseline.
 * @property {AMBGridImport} import - Import a local file and register the loaded rows as a new clean AMB Grid CRUD baseline.
 * @property {AMBGridAddData} addData - Add multiple managed rows through the AMB Grid CRUD lifecycle.
 * @property {AMBGridUpdateData} updateData - Partially update multiple managed rows through the AMB Grid CRUD lifecycle.
 * @property {AMBGridUpdateOrAddData} updateOrAddData - Update existing managed rows or add missing rows through the AMB Grid CRUD lifecycle.
 * @property {AMBGridClearData} clearData - Remove every runtime row and register an empty AMB Grid CRUD baseline.
 * @property {AMBGridSearchData} searchData - Return row data matching a filter definition.
 * @property {Function} getSheetDefinitions - Return the current spreadsheet sheet definitions.
 * @property {Function} getSheets - Return the current spreadsheet Sheet Components.
 * @property {Function} getSheet - Return one spreadsheet Sheet Component.
 * @property {Function} getSheetTitle - Return the runtime title of one spreadsheet sheet.
 * @property {Function} setSheetTitle - Set the runtime title of one spreadsheet sheet.
 * @property {Function} setSheetRows - Set the runtime row count of one spreadsheet sheet.
 * @property {Function} setSheetColumns - Set the runtime column count of one spreadsheet sheet.
 * @property {Function} getSheetKey - Return the runtime key of one spreadsheet sheet.
 * @property {Function} getSheetDefinition - Return the runtime definition of one spreadsheet sheet.
 * @property {Function} getSheetData - Return matrix data for a spreadsheet sheet.
 * @property {Function} setSheetData - Replace matrix data for a spreadsheet sheet.
 * @property {Function} clearSheet - Clear matrix data from a spreadsheet sheet.
 * @property {Function} setSheets - Replace the current spreadsheet sheets.
 * @property {Function} addSheet - Add a spreadsheet sheet.
 * @property {Function} activeSheet - Make a spreadsheet sheet active.
 * @property {Function} removeSheet - Remove a spreadsheet sheet.
 * @property {Function} clearCellEdited - Clear native edited markers from cells.
 * @property {Function} clearCellEditedMarker - Clear the native edited marker of one AMB-resolved cell without changing CRUD state.
 * @property {Function} clearCellValidation - Clear native validation markers from cells.
 * @property {Function} clearCellValidationMarker - Clear the native validation marker of one AMB-resolved cell without clearing AMB errors.
 * @property {Function} getEditedCells - Return cells marked as edited by the grid.
 * @property {Function} getInvalidCells - Return cells marked as invalid by the grid.
 * @property {Function} isCellEdited - Read a native edited marker independently from CRUD state and save payloads.
 * @property {Function} isCellValid - Read native runtime validation state independently from AMB Grid validation.
 * @property {CrudHelper['getChanges']} getChanges - Read changes currently classified by the AMB CRUD lifecycle.
 * @property {CrudHelper['getStateReport']} getStateReport - Return the complete AMB snapshot of rows, lifecycle state, errors, and changes.
 * @property {CrudHelper.getSavePayload} getSavePayload - Generate the AMB save payload using the supported payload options.
 * @property {CrudHelper['addRow']} addRow - Add a row through the AMB lifecycle rather than directly through the engine.
 * @property {AMBGridUpdateOrAddRow} updateOrAddRow - Update one existing managed row or add a missing row through the AMB Grid CRUD lifecycle.
 * @property {CrudHelper['updateRowFields']} updateRow - Patch a row through AMB tracking and validation rather than directly through the engine.
 * @property {CrudHelper['deleteRow']} deleteRow - Delete or mark one row deleted according to the AMB lifecycle.
 * @property {CrudHelper['rollbackRow']} rollbackRow - Restore or remove one row according to its AMB lifecycle state.
 * @property {CrudHelper['applyBackendIds']} applyBackendIds - Reconcile temporary and backend ids without sending data to the backend.
 * @property {CrudHelper['markRowSaved']} markRowSaved - Confirm one row as saved without sending data to the backend.
 * @property {CrudHelper['markRowsSaved']} markRowsSaved - Confirm an explicit row list as saved without sending data to the backend.
 * @property {CrudHelper['markValidChangesSaved']} markValidChangesSaved - Confirm valid changes and return saved/skipped rows without sending data to the backend.
 * @property {CrudHelper['hasErrors']} hasErrors - Return whether AMB CRUD currently tracks row or cell-field application errors.
 * @property {CrudHelper['getErrors']} getErrors - Return the grouped AMB CRUD error summary without reading native cell-validation markers.
 * @property {CrudHelper['getRowErrors']} getRowErrors - Return the currently registered AMB row-level errors.
 * @property {CrudHelper['getCellErrors']} getCellErrors - Return the currently registered AMB cell-field errors, not native Cell Components.
 * @property {CrudHelper['markCellError']} markCellError - Register an AMB application error for a row field without changing lifecycle state or native cell-validation markers.
 * @property {CrudHelper['clearCellError']} clearCellError - Clear one AMB row-field error without clearing native Cell Component validation state.
 * @property {CrudHelper['markRowError']} markRowError - Register an AMB application error for an entire row without changing its lifecycle state.
 * @property {CrudHelper['clearRowError']} clearRowError - Clear only an AMB row-level error, preserving cell-field errors and lifecycle state.
 * @property {CrudHelper['clearRowErrors']} clearCellErrorsForRow - Clear all AMB field errors for one row, preserving its general error and native cell-validation markers.
 * @property {CrudHelper['clearAllErrors']} clearErrorsForRow - Clear every AMB application error for one row only, preserving native cell-validation markers.
 * @property {AMBGridOnCrud} onCrud - Subscribe to an AMB CRUD application event and return its unsubscribe function, distinct from engine `on`.
 * @property {(eventName: string, callback: AMBGridEventCallback) => void} offCrud - Remove one specific AMB CRUD callback, distinct from engine `off`; remaining subscriptions are released on destroy.
 * @property {AMBGridAddCellValidator} addCellValidator - Append a runtime AMB rule for a field without immediately validating data.
 * @property {CrudHelper['removeCellValidator']} removeCellValidators - Remove every AMB rule for a field, including initial declarative rules, without immediately validating data.
 * @property {CrudHelper['validateAll']} validate - Validate AMB-managed rows and return the structured AMB Grid validation report.
 * @property {CrudHelper['validateChanges']} validateChanges - Validate AMB rows with pending insert or update changes.
 * @property {CrudHelper['validateRow']} validateRow - Validate one AMB-managed row by backend or temporary identifier.
 * @property {Function} getRows - Return row components in the requested range.
 * @property {Function} getRow - Return a row component by backend id, AMB temporary id, or supported lookup value.
 * @property {Function} getRowGroup - Return the row's runtime Group Component, or `false`.
 * @property {Function} getRowData - Return managed data for one row by backend id, AMB temporary id, or supported lookup value.
 * @property {Function} getRowIndex - Return the identifying index value for one row.
 * @property {Function} getNextRow - Return the next row component relative to one row, or `false`.
 * @property {Function} getPrevRow - Return the previous row component relative to one row, or `false`.
 * @property {Function} getRowElement - Return the runtime DOM element for one row.
 * @property {Function} getRowCells - Return the Cell Components for one row.
 * @property {Function} validateRowCells - Run native cell validation for one row, distinct from the structured AMB `validateRow` result.
 * @property {Function} getRowRanges - Return selected Range Components overlapping one row.
 * @property {Function} getRowCell - Return one Cell Component from a row.
 * @property {Function} getCellValue - Return the runtime value for one cell.
 * @property {Function} setCellValue - Update one resolved cell through AMB CRUD tracking and validation.
 * @property {Function} getCellOldValue - Return the previous runtime value for one cell.
 * @property {Function} restoreCellOldValue - Apply the previous runtime cell value through AMB CRUD tracking.
 * @property {Function} getCellInitialValue - Return the initial runtime value for one cell.
 * @property {Function} restoreCellInitialValue - Apply the initial runtime cell value through AMB CRUD tracking.
 * @property {Function} getCellRanges - Return selected Range Components overlapping one cell.
 * @property {Function} validateCell - Run native validation for one cell, distinct from AMB validation reports.
 * @property {Function} editCell - Attempt runtime editing with normal AMB editability checks, without replacing CRUD APIs.
 * @property {Function} cancelCellEdit - Cancel only the active runtime cell editor, without replacing CRUD APIs.
 * @property {Function} navigateCellPrev - Navigate to the previous editable cell starting from the cell resolved through its row and column.
 * @property {Function} navigateCellNext - Navigate to the next editable cell starting from the cell resolved through its row and column.
 * @property {Function} navigateCellLeft - Navigate left from the cell resolved through its row and column.
 * @property {Function} navigateCellRight - Navigate right from the cell resolved through its row and column.
 * @property {Function} navigateCellUp - Navigate upward from the cell resolved through its row and column.
 * @property {Function} navigateCellDown - Navigate downward from the cell resolved through its row and column.
 * @property {Function} getCellElement - Return the runtime DOM element for one cell.
 * @property {Function} getCellField - Return the runtime field for one cell.
 * @property {Function} getCellColumn - Return the Column Component for one cell.
 * @property {Function} getCellRow - Return the Row Component for one cell.
 * @property {Function} getCellData - Return runtime row data in the context of one cell.
 * @property {Function} getCellType - Return the runtime type for one cell.
 * @property {Function} checkCellHeight - Check the runtime height for one cell.
 * @property {AMBGridRowHeightOperation} normalizeRowHeight - Normalize the runtime height of one row.
 * @property {AMBGridRowHeightOperation} reformatRow - Reapply runtime formatting for one row.
 * @property {Function} freezeRow - Freeze one row through the AMB Grid public API, changing only its runtime row position.
 * @property {Function} unfreezeRow - Unfreeze one row through the AMB Grid public API, changing only its runtime row position.
 * @property {Function} isRowFrozen - Return whether one row is currently frozen through the AMB Grid public API.
 * @property {Function} expandTreeRow - Expand one Data Tree row when Data Tree is enabled, returning `true` only when delegated.
 * @property {Function} collapseTreeRow - Collapse one Data Tree row when Data Tree is enabled, returning `true` only when delegated.
 * @property {Function} toggleTreeRow - Toggle one Data Tree row when Data Tree is enabled, returning `true` only when delegated.
 * @property {Function} addTreeChild - Add a managed child row through the AMB Grid CRUD lifecycle.
 * @property {Function} getTreeParent - Return the Data Tree parent Row Component, or `false` when unavailable or at a root row.
 * @property {Function} getTreeChildren - Return the direct Data Tree child Row Components, or `false` when unavailable.
 * @property {Function} isTreeExpanded - Return the Data Tree runtime expanded state, or `false` when unavailable.
 * @property {Function} watchRowPosition - Register a callback for runtime display-position changes of one AMB-resolved row.
 * @property {Function} getRowPosition - Return the one-based position of a row.
 * @property {Function} getRowFromPosition - Return the row component at a numerical position.
 * @property {Function} moveRow - Move one managed row relative to another in a flat grid and realign technical row numbering.
 * @property {AMBGridScrollToRow} scrollToRow - Scroll vertically to a grid row.
 * @property {Function} searchRows - Return row components matching a filter definition.
 * @property {Function} navigatePrev - Move to the previous editable cell.
 * @property {Function} navigateNext - Move to the next editable cell.
 * @property {Function} navigateLeft - Move to the editable cell on the left.
 * @property {Function} navigateRight - Move to the editable cell on the right.
 * @property {Function} navigateUp - Move to the corresponding cell in the previous row.
 * @property {Function} navigateDown - Move to the corresponding cell in the next row.
 * @property {Function} getGroupedData - Return data in the current grouped output order.
 * @property {Function} getGroups - Return the current top-level group components.
 * @property {Function} getGroupKey - Return the runtime key for a group.
 * @property {Function} getGroupField - Return the runtime grouping field for a group.
 * @property {Function} getGroupElement - Return the runtime DOM element for a group.
 * @property {Function} getGroupRows - Return runtime Row Components for a group.
 * @property {Function} getGroupSubGroups - Return runtime child Group Components for a group.
 * @property {Function} getGroupParent - Return the runtime parent Group Component for a group.
 * @property {Function} isGroupVisible - Return the runtime visibility state for a group.
 * @property {Function} showGroup - Show a runtime group component.
 * @property {Function} hideGroup - Hide a runtime group component.
 * @property {Function} toggleGroup - Toggle a runtime group component.
 * @property {Function} scrollToGroup - Scroll to a runtime group component.
 * @property {Function} showRowPopup - Show a popup anchored to one resolved Row Component.
 * @property {Function} showColumnPopup - Show a popup anchored to one resolved Column Component.
 * @property {Function} showCellPopup - Show a popup anchored to one resolved Cell Component.
 * @property {Function} showGroupPopup - Show a popup anchored to a supplied Group Component.
 * @property {Function} setGroupBy - Change the runtime row grouping definition.
 * @property {Function} setGroupValues - Change the allowed values for grouping levels.
 * @property {Function} setGroupStartOpen - Change the initial group opening definition.
 * @property {Function} setGroupHeader - Change the group-header formatter definition.
 * @property {Function} getHistoryUndoSize - Return the number of actions available for undo.
 * @property {Function} getHistoryRedoSize - Return the number of actions available for redo.
 * @property {Function} clearHistory - Clear the native interaction history without changing AMB Grid CRUD state.
 * @property {Function} undo - Undo one interaction-history action and reconcile the affected AMB Grid CRUD state.
 * @property {Function} redo - Redo one interaction-history action and reconcile the affected AMB Grid CRUD state.
 * @property {AMBGridGetPage} getPage - Return the current page number.
 * @property {AMBGridGetPage} getPageMax - Return the maximum available page number.
 * @property {AMBGridGetPageSize} getPageSize - Return the number of rows allowed per page.
 * @property {AMBGridSetPage} setPage - Show a numbered or named pagination page.
 * @property {AMBGridChangePage} nextPage - Show the next page.
 * @property {AMBGridChangePage} previousPage - Show the previous page.
 * @property {AMBGridSetPageSize} setPageSize - Change the number of rows displayed on each page.
 * @property {AMBGridSetMaxPage} setMaxPage - Change the maximum page available to the grid.
 * @property {AMBGridSetPageToRow} setPageToRow - Show the local pagination page containing a row.
 * @property {Function} alert - Show a modal alert over the grid.
 * @property {Function} clearAlert - Clear the current modal grid alert.
 * @property {Function} getHtml - Return grid data as an HTML table string.
 * @property {Function} copyToClipboard - Copy grid data to the system clipboard.
 * @property {Function} download - Download grid data using a configured downloader.
 * @property {Function} downloadToTab - Open generated export data in a new browser tab.
 * @property {Function} print - Print grid data using the current print configuration.
 * @property {Function} getCalcResults - Return the current column calculation results.
 * @property {Function} getCalcData - Return runtime data for one calculation row.
 * @property {Function} getCalcElement - Return the runtime DOM element for one calculation row.
 * @property {Function} getCalcCells - Return runtime Cell Components for one calculation row.
 * @property {Function} getCalcCell - Return one runtime Cell Component from a calculation row.
 * @property {AMBGridRecalc} recalc - Recalculate the configured column calculations.
 * @property {Function} setLocale - Change the locale used by the grid.
 * @property {Function} getLocale - Return the current resolved grid locale.
 * @property {Function} getLang - Return the current runtime language definition.
 * @property {Function} setHeight - Change the runtime grid height.
 * @property {Function} setMinHeight - Change the runtime minimum grid height.
 * @property {Function} setMaxHeight - Change the runtime maximum grid height.
 * @property {Function} redraw - Redraw the grid.
 * @property {Function} blockRedraw - Temporarily suspend automatic redraws.
 * @property {Function} restoreRedraw - Restore automatic redraws.
 * @property {object|null} toolbar - Optional AMB CRUD toolbar controller.
 * @property {FeedbackRegion} feedback - Accessible grid status region.
 * @property {AMBGridOn} on - Subscribe an application callback to a public grid event.
 * @property {AMBGridOff} off - Remove application listeners while preserving AMB Grid internal bindings.
 * @property {AMBGridDestroy} destroy - Destroy the complete AMB-managed grid and its internally managed resources.
 */

/**
 * @typedef {object} AMBPaginationOptions
 * @property {boolean} [enabled=true] - Enable AMB object-style pagination.
 * @property {'local'|'remote'} [mode='local'] - Engine pagination mode.
 * @property {number} [pageSize=10] - Engine page size.
 * @property {number[]} [pageSizeSelector] - Engine page-size choices.
 */

/**
 * @typedef {object} AMBRowActionColumnActions
 * @property {boolean} [delete=true] - Show delete for clean and saved rows.
 * @property {boolean} [rollback=true] - Show rollback for modified and deleted rows.
 * @property {boolean} [removeNew=true] - Show remove for new rows.
 */

/**
 * @typedef {object} AMBRowActionColumnIcons
 * @property {string} [delete] - Custom delete button text or icon.
 * @property {string} [rollback] - Custom rollback button text or icon.
 * @property {string} [removeNew] - Custom remove-new button text or icon.
 */

/**
 * @typedef {object} AMBRowActionColumnLabels
 * @property {string} [delete='Delete row'] - Delete button label.
 * @property {string} [rollback='Rollback row'] - Rollback button label.
 * @property {string} [removeNew='Remove new row'] - Remove-new button label.
 */

/**
 * @typedef {object} AMBRowActionColumnOptions
 * @property {boolean} [enabled=false] - Add the managed row action column.
 * @property {AMBRowActionColumnActions} [actions] - Action visibility flags.
 * @property {AMBRowActionColumnIcons} [icons] - Custom action button text or icon overrides.
 * @property {AMBRowActionColumnLabels} [labels] - Action button aria-label overrides.
 * @property {string} [confirmDeleteMessage] - Confirmation text before deleting a clean row.
 * @property {string} [confirmRollbackMessage] - Confirmation text before rolling back a changed row.
 * @property {string} [confirmRemoveNewMessage] - Confirmation text before removing an unsaved row.
 * @property {Function} [confirmProvider] - Custom async confirmation function.
 */

/**
 * @typedef {object} AMBSelectionColumnOptions
 * @property {boolean} [enabled=false] - Add a row selection column.
 * @property {'single'|'multiple'} [mode='multiple'] - Selection mode.
 * @property {number} [width=45] - Selection column width.
 */

/**
 * @typedef {object} AMBSearchFilterOptions
 * @property {boolean} [enabled=false] - Show the filters button.
 */

/**
 * @typedef {object} AMBSearchOptions
 * @property {boolean} [enabled=false] - Show the search toolbar.
 * @property {string} [placeholder='Search...'] - Search input placeholder.
 * @property {boolean} [caseSensitive=false] - Match search text with case sensitivity.
 * @property {boolean} [wholeWord=false] - Match the query as a complete word or phrase.
 * @property {AMBSearchFilterOptions} [filters] - Search field filter options.
 */

/**
 * @typedef {object} AMBFloatingMessagesOptions
 * @property {boolean} [enabled=true] - Enable all floating message channels.
 * @property {boolean} [lookupDescriptions=true] - Show lookup descriptions for pointer or keyboard focus.
 * @property {boolean} [validationErrors=true] - Show validation errors for pointer or keyboard focus.
 * @property {boolean} [largeTextPreviews=true] - Show large-text previews for pointer or keyboard focus.
 * @property {boolean} [searchFilterStatus=true] - Show search filter status hover messages.
 */

/**
 * @typedef {object} AMBToolbarOptions
 * @property {boolean} [enabled=true] - Render the toolbar.
 * @property {Array.<string|object>} [buttons=['add','reload','save']] - Built-in ids or simple custom button definitions.
 * @property {Function} [onAdd] - Developer callback receiving `{ grid, event }`.
 * @property {Function} [onSave] - Developer callback receiving `{ grid, payload, event }`.
 * @property {Function} [onReload] - Developer callback receiving `{ grid, event }`.
 * @property {Function} [onValidate] - Developer callback receiving `{ grid, event }`.
 * @property {Function} [onPayload] - Developer callback receiving `{ grid, payload, event }`.
 */

/**
 * @typedef {object} AMBTableMessages
 * @property {string} [required='This field is required'] - Default required message.
 */

/**
 * @typedef {object} AMBErrorStyleOptions
 * @property {boolean} [highlightRowOnCellError=false] - Mark a row when one of its cells has an error.
 */

/**
 * @callback AMBGroupByFunction
 * @param {object} data - Row data.
 * @returns {unknown} Group key.
 */

/**
 * @typedef {{[key: string]: unknown}} AMBTablePassthroughOptions
 */

/**
 * Public options accepted by `AMB.table(...)`.
 *
 * Known AMB Grid options remain typed. Additional options are passed through
 * to the internal table engine as `unknown`, keeping that implementation an
 * internal detail of the AMB Grid public API.
 *
 * @typedef {AMBTablePassthroughOptions & {
 *   selector: string|HTMLElement,
 *   data?: object[],
 *   columns?: object[],
 *   pagination?: boolean|AMBPaginationOptions,
 *   rowActionColumn?: AMBRowActionColumnOptions,
 *   selectionColumn?: AMBSelectionColumnOptions,
 *   search?: AMBSearchOptions,
 *   floatingMessages?: boolean|AMBFloatingMessagesOptions,
 *   toolbar?: boolean|AMBToolbarOptions,
 *   messages?: AMBTableMessages,
 *   errorStyle?: AMBErrorStyleOptions,
 *   layout?: 'fitData'|'fitColumns'|'fitDataFill'|'fitDataStretch'|'fitDataTable',
 *   height?: string|number|false,
 *   history?: boolean,
 *   groupBy?: string|string[]|AMBGroupByFunction|Array.<string|AMBGroupByFunction>,
 *   responsiveLayout?: boolean|'hide'|'collapse',
 *   movableColumns?: boolean,
 *   paginationMode?: 'local'|'remote',
 *   paginationSize?: number|true,
 *   paginationSizeSelector?: true|number[]
 * }} AMBTableOptions
 */

/**
 * Creates an AMB-managed CRUD grid controller.
 *
 * The returned controller is the main public API for data access, row
 * operations, selection, pagination, filters, search, validation, payload
 * generation and lifecycle cleanup.
 *
 * AMB Grid manages the underlying table engine internally. Advanced engine
 * access is available through `table` for integration scenarios not yet
 * covered by the controller API, while normal application code should prefer
 * methods exposed directly on the controller.
 * `grid.on(...)` and `grid.off(...)` manage public engine events, while
 * `grid.onCrud(...)` and `grid.offCrud(...)` manage AMB CRUD lifecycle events.
 *
 * AMB Grid provides the CRUD application layer, column validation, rollback
 * handling, lookup behavior, initial lookup description metadata for loaded
 * rows, save payloads, optional row action and selection columns, hover
 * messages, large text previews, search helpers, and lifecycle cleanup.
 * Lookup columns created with `AMB.editors.lookup(...)` are marked on rendered
 * cells and their prefilled values are resolved asynchronously into internal
 * metadata after table build and data reloads. When lookup description
 * floating messages are enabled, lookup cells are marked on render so hover
 * descriptions can work before a cell is edited.
 *
 * Column validators can be provided with `validator`, `required`, or a
 * structured `validation` object. Most validators do not imply required:
 * use `required: true`, `validation.required`, or `AMB.validators.required()`
 * when empty values should fail validation.
 * Validators can also be added dynamically with `grid.addCellValidator(...)`;
 * `grid.removeCellValidators(field)` removes all current AMB rules for a field.
 * AMB numeric editors/formatters receive `hozAlign: 'right'` by default and
 * AMB date editors/formatters receive `hozAlign: 'center'` by default, only
 * when the column did not already define `hozAlign`.
 * Internal-engine pagination options are still passed through unchanged when
 * `pagination` is boolean. AMB Grid also accepts an object-style pagination
 * convenience layer:
 * `{ enabled: true, mode: 'local', pageSize: 10, pageSizeSelector: [10, 25, 50] }`.
 * Object-style pagination is translated to the corresponding internal-engine
 * options before grid creation and takes precedence over equivalent `paginationMode`,
 * `paginationSize`, and `paginationSizeSelector` values. Remote pagination is
 * only delegated to the underlying table engine; AMB Grid does not add
 * backend/server-side behavior.
 * When pagination is enabled, AMB Grid sets the underlying engine's
 * `paginationAddRow` to `'table'` unless explicitly provided, so
 * `grid.addRow(...)` appends to the whole grid, uses the underlying engine row
 * component to open the page containing the new row when possible, and attempts
 * to focus the first editable visible data cell. Action columns are not
 * candidates for automatic focus.
 *
 * @param {AMBTableOptions} options - AMB Grid options and supported internal-engine passthrough configuration.
 * @returns {AMBTableController} AMB table controller. Call `destroy()` when the owning page section, modal, tab, or view is disposed.
 *
 * Underscored fields on the returned controller are internal integration
 * objects and are not part of the stable public API.
 * @example
 * const grid = AMB.table({
 *   selector: '#people',
 *   data: [],
 *   columns: [
 *     { title: 'Name', field: 'name', editor: AMB.editors.text(), required: true }
 *   ]
 * });
 *
 * // later, when the page section/modal/view is disposed
 * grid.destroy();
 */
export function createTable(options = {}) {
    if (Object.prototype.hasOwnProperty.call(options, 'deleteColumn')) {
        throw new TypeError(
            'AMB.table: `deleteColumn` was renamed to `rowActionColumn`.'
        );
    }

    const {
        selector,
        columns,
        messages,
        rowActionColumn,
        selectionColumn,
        search,
        toolbar,
        floatingMessages,
        errorStyle,
        ...tabulatorOptions
    } = options;
    const normalizedFloatingMessages = normalizeFloatingMessageOptions(floatingMessages);
    const normalizedMessages = {
        ...DEFAULT_MESSAGES,
        ...messages
    };
    const normalizedOptions = normalizePaginationOptions(tabulatorOptions);
    let crud = null;
    let controller = null;
    let table = null;
    const confirmDialog = new ConfirmDialog();
    const selectionColumnController = createSelectionColumn(selectionColumn);
    const rowActionColumnController = rowActionColumn && rowActionColumn.enabled
        ? createRowActionColumn(rowActionColumn, () => crud, confirmDialog)
        : null;
    const columnPipelineOptions = {
        messages: normalizedMessages,
        lookupDescriptions: normalizedFloatingMessages.lookupDescriptions,
        getCrud: () => crud,
        getTable: () => table,
        selectionColumn: selectionColumnController
            ? selectionColumnController.column
            : null,
        rowActionColumn: rowActionColumnController
            ? rowActionColumnController.column
            : null
    };
    const columnPipeline = prepareColumnPipeline({
        ...columnPipelineOptions,
        columns
    });
    const lifecycleResources = {
        toolbarController: null,
        unsubscribeRowActionColumn: null,
        unsubscribeSelectionColumn: null,
        unsubscribeLookupMetadata: null,
        unsubscribeCalculationRecalc: null,
        calculationPresentationRuntime: null,
        historyRuntime: null,
        searchController: null,
        feedback: null,
        paginationKeyboardRuntime: null
    };

    if (selectionColumnController) {
        normalizedOptions.selectableRows = selectionColumnController.selectableRows;
    }

    if (columns) {
        normalizedOptions.columns = columnPipeline.runtimeColumns;
    }

    table = new Tabulator(selector, normalizedOptions);
    const tableElement = typeof selector === 'string'
        ? document.querySelector(selector)
        : selector;
    lifecycleResources.calculationPresentationRuntime =
        createCalculationPresentationRuntime(tableElement);
    const alertMethods = createAlertMethods({ table });
    const calculationMethods = createCalculationMethods({ table });
    const eventMethods = createEventMethods({ table });
    const exportMethods = createExportMethods({ table });
    const groupingMethods = createGroupingMethods({ table });
    const layoutMethods = createLayoutMethods({ table });
    const localizationMethods = createLocalizationMethods({ table });
    const persistenceMethods = createPersistenceMethods({ table });
    const redrawMethods = createRedrawMethods({ table });
    const sortMethods = createSortMethods({ table });
    const navigationMethods = createNavigationMethods({ table });
    const spreadsheetMethods = createSpreadsheetMethods({ table });
    crud = new CrudHelper(table, { errorStyle });
    lifecycleResources.unsubscribeCalculationRecalc =
        bindDeletedRowCalculationRecalc(table, crud);
    registerDeclarativeValidators(crud, columnPipeline.validators);
    lifecycleResources.historyRuntime = createHistoryRuntime({
        table,
        crud,
        historyEnabled: normalizedOptions.history === true
    });
    const historyMethods = createHistoryMethods({
        table,
        crud,
        historyRuntime: lifecycleResources.historyRuntime,
        historyEnabled: normalizedOptions.history === true
    });
    const columnRuntime = createColumnRuntime({
        table,
        crud,
        initialPipeline: columnPipeline,
        pipelineOptions: columnPipelineOptions,
        lifecycleResources,
        getSearchController: () => lifecycleResources.searchController
    });
    const columnMethods = createColumnMethods({
        table,
        columnRuntime
    });

    const dataMethods = createDataMethods({
        table,
        crud,
        autoColumnsEnabled: normalizedOptions.autoColumns === true
    });
    const crudMethods = createCrudMethods({ crud });
    const rowMethods = createRowMethods({ table, crud });
    const cellStateMethods = createCellStateMethods({ table, rowMethods });
    const cellMethods = createCellMethods({
        rowMethods,
        crud
    });
    const popupMethods = createPopupMethods({
        rowMethods,
        columnMethods
    });
    const paginationMethods = createPaginationMethods({ table, crud });
    lifecycleResources.paginationKeyboardRuntime = createPaginationKeyboardRuntime({
        table,
        tableElement,
        paginationMethods,
        enabled: normalizedOptions.pagination === true
    });
    const selectionMethods = createSelectionMethods({
        table,
        crud,
        selectionMode: selectionColumnController?.mode
    });
    const validationMethods = createValidationMethods({ crud });
    const rangeMethods = createRangeMethods({
        table,
        crud
    });
    lifecycleResources.unsubscribeSelectionColumn = selectionColumnController && typeof selectionColumnController.bind === 'function'
        ? selectionColumnController.bind(table)
        : null;
    const floatingMessage = new FloatingMessage({
        enabled: normalizedFloatingMessages.enabled
    });
    const cellMessageBinder = new CellMessageBinder({
        table,
        tableElement,
        crudHelper: crud,
        floatingMessage,
        validationErrors: normalizedFloatingMessages.validationErrors,
        lookupDescriptions: normalizedFloatingMessages.lookupDescriptions,
        largeTextPreviews: normalizedFloatingMessages.largeTextPreviews
    });
    lifecycleResources.unsubscribeLookupMetadata = bindLookupMetadataInitialization(
        table,
        columnPipeline.lookupColumns
    );
    lifecycleResources.toolbarController = createToolbar({
        selector,
        toolbar,
        getGrid: () => controller
    });
    lifecycleResources.feedback = new FeedbackRegion({
        className: [
            'amb-feedback-region--grid',
            lifecycleResources.toolbarController ? 'amb-feedback-region--connected' : ''
        ].filter(Boolean).join(' ')
    });
    if (tableElement && tableElement.parentNode) {
        tableElement.parentNode.insertBefore(lifecycleResources.feedback.element, tableElement);
    }
    lifecycleResources.searchController = createSearchController({
        selector,
        search,
        columns: columnPipeline.searchColumns,
        table,
        floatingMessage,
        showFilterStatus: normalizedFloatingMessages.searchFilterStatus,
        mountElement: lifecycleResources.toolbarController
            ? lifecycleResources.toolbarController.searchMount
            : null
    });
    const filterMethods = createFilterMethods({
        table,
        searchController: lifecycleResources.searchController
    });
    const searchMethods = createSearchMethods({
        searchController: lifecycleResources.searchController
    });

    if (rowActionColumnController) {
        lifecycleResources.unsubscribeRowActionColumn = crud.on('row-state-changed', ({ row }) => {
            rowActionColumnController.updateRowButton(row);
        });
    }

    const lifecycleMethods = createLifecycleMethods({
        table,
        crud,
        resources: lifecycleResources,
        getController: () => controller,
        cellMessageBinder,
        floatingMessage,
        confirmDialog
    });
    const controllerMethods = composeControllerMethods(
        alertMethods,
        calculationMethods,
        cellStateMethods,
        crudMethods,
        columnMethods,
        dataMethods,
        spreadsheetMethods,
        rowMethods,
        cellMethods,
        popupMethods,
        validationMethods,
        navigationMethods,
        groupingMethods,
        historyMethods,
        persistenceMethods,
        paginationMethods,
        selectionMethods,
        rangeMethods,
        filterMethods,
        searchMethods,
        sortMethods,
        exportMethods,
        eventMethods,
        localizationMethods,
        layoutMethods,
        redrawMethods,
        lifecycleMethods
    );

    controller = {
        table,
        crud,
        toolbar: lifecycleResources.toolbarController,
        feedback: lifecycleResources.feedback,
        /**
         * @private
         * @internal
         */
        _floatingMessage: floatingMessage,
        /**
         * @private
         * @internal
         */
        _cellMessageBinder: cellMessageBinder,
        /**
         * @private
         * @internal
         */
        _confirmDialog: confirmDialog,
        ...controllerMethods
    };

    return controller;
}

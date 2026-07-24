import { TabulatorFull as Tabulator } from 'tabulator-tables';
import { CrudHelper, ROW_STATE } from '../crud-helper.js';
import { CellMessageBinder } from '../../ui/cell-message-binder.js';
import { FloatingMessage } from '../../ui/floating-message.js';
import { ConfirmDialog } from '../../ui/confirm-dialog.js';
import { FeedbackRegion } from '../../ui/feedback-region.js';
import { createToolbar } from '../../ui/toolbar.js';
import { DEFAULT_MESSAGES, extractColumnValidators } from './validation-extraction.js';
import { createDeleteColumn } from './delete-column.js';
import { createSelectionColumn } from './selection-column.js';
import { createSearchController } from './search-controller.js';
import { createLargeTextBinder, createLookupDescriptionBinder } from './hover-binders.js';
import { composeControllerMethods } from './controller/compose-controller-methods.js';
import { createAlertMethods } from './controller/alert-methods.js';
import { createCalculationMethods } from './controller/calculation-methods.js';
import { createCellMethods } from './controller/cell-methods.js';
import { createCellStateMethods } from './controller/cell-state-methods.js';
import { createColumnMethods } from './controller/column-methods.js';
import { createDataMethods } from './controller/data-methods.js';
import { createEventMethods } from './controller/event-methods.js';
import { createExportMethods } from './controller/export-methods.js';
import { createGroupingMethods } from './controller/grouping-methods.js';
import { createHistoryMethods } from './controller/history-methods.js';
import { createLayoutMethods } from './controller/layout-methods.js';
import { createLocalizationMethods } from './controller/localization-methods.js';
import { createNavigationMethods } from './controller/navigation-methods.js';
import { createPersistenceMethods } from './controller/persistence-methods.js';
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
import { escapeHtmlText } from '../formatters.js';
import { getLookupOptionValue } from '../editors/shared.js';
import { getLookupMetadata, setLookupMetadata } from '../lookup-metadata.js';

const NUMERIC_EDITOR_TYPES = new Set(['integer', 'decimal']);
const NUMERIC_FORMATTER_TYPES = new Set([
    'integer',
    'decimal',
    'currency',
    'percent',
    'percentFromRatio'
]);
const DATE_EDITOR_TYPES = new Set(['date']);
const DATE_FORMATTER_TYPES = new Set(['date']);
const CHECKBOX_EDITOR_TYPES = new Set(['checkbox']);
const DEFAULT_PAGINATION_MODE = 'local';
const DEFAULT_PAGINATION_SIZE = 10;
const DEFAULT_FLOATING_MESSAGE_OPTIONS = {
    enabled: true,
    lookupDescriptions: true,
    validationErrors: true,
    largeTextPreviews: true,
    searchFilterStatus: true
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

const getAmbEditorType = column => {
    return column && column.editor && column.editor._ambEditorType;
};

const getAmbFormatterType = column => {
    return column && column.formatter && column.formatter._ambFormatterType;
};

const getDefaultHozAlign = column => {
    const editorType = getAmbEditorType(column);
    const formatterType = getAmbFormatterType(column);

    if (NUMERIC_EDITOR_TYPES.has(editorType) || NUMERIC_FORMATTER_TYPES.has(formatterType)) {
        return 'right';
    }

    if (DATE_EDITOR_TYPES.has(editorType) || DATE_FORMATTER_TYPES.has(formatterType)) {
        return 'center';
    }

    return undefined;
};

export const applyDefaultColumnAlignments = (columns = []) => {
    return (columns || []).map(column => {
        const nextColumn = { ...column };

        if (nextColumn.columns) {
            nextColumn.columns = applyDefaultColumnAlignments(nextColumn.columns);
        }

        if (nextColumn.hozAlign === undefined) {
            const defaultHozAlign = getDefaultHozAlign(nextColumn);

            if (defaultHozAlign !== undefined) {
                nextColumn.hozAlign = defaultHozAlign;
            }
        }

        return nextColumn;
    });
};

const isLookupColumn = column => {
    return column
        && column.editor
        && column.editor._ambEditorType === 'lookup';
};

const isCheckboxColumn = column => {
    return CHECKBOX_EDITOR_TYPES.has(getAmbEditorType(column));
};

const getLookupConfig = column => {
    return isLookupColumn(column) && column.editor._ambLookupConfig
        ? column.editor._ambLookupConfig
        : null;
};

const createLookupCellMarkerFormatter = (field, originalFormatter, showDescription = true) => {
    return (cell, formatterParams, onRendered) => {
        const cellElement = cell && cell.getElement && cell.getElement();

        if (cellElement) {
            if (showDescription) {
                cellElement.dataset.lookupField = field || cell.getField?.();
            } else {
                delete cellElement.dataset.lookupField;
            }
        }

        if (typeof originalFormatter === 'function') {
            return originalFormatter(cell, formatterParams, onRendered);
        }

        const value = cell && cell.getValue ? cell.getValue() : '';

        return escapeHtmlText(value);
    };
};

export const prepareLookupColumns = (columns = [], options = {}) => {
    const lookupDescriptionsEnabled = options.lookupDescriptions !== false;

    return (columns || []).map(column => {
        const nextColumn = { ...column };

        if (nextColumn.columns) {
            nextColumn.columns = prepareLookupColumns(nextColumn.columns, options);
        }

        const lookupConfig = getLookupConfig(nextColumn);
        const showDescription = Boolean(
            lookupDescriptionsEnabled
            && lookupConfig
            && lookupConfig.showDescription !== false
        );

        if (
            lookupConfig
            && (
                nextColumn.formatter === undefined
                || typeof nextColumn.formatter === 'function'
            )
        ) {
            nextColumn.formatter = createLookupCellMarkerFormatter(
                nextColumn.field,
                typeof nextColumn.formatter === 'function'
                    ? nextColumn.formatter
                    : null,
                showDescription
            );
        }

        return nextColumn;
    });
};

export const collectLookupColumns = (columns = []) => {
    const lookupColumns = [];

    (columns || []).forEach(column => {
        if (!column) return;

        if (column.columns) {
            lookupColumns.push(...collectLookupColumns(column.columns));
            return;
        }

        const config = getLookupConfig(column);

        if (!config || !column.field) return;

        lookupColumns.push({
            field: column.field,
            ...config
        });
    });

    return lookupColumns;
};

const getRowData = row => {
    if (!row) return null;

    if (typeof row.getData === 'function') {
        return row.getData();
    }

    return row;
};

const hasInitialLookupMetadata = (rowData, field, value) => {
    const metadata = getLookupMetadata(rowData, field);

    return Boolean(metadata && metadata.initial && metadata.initial.value === value);
};

export const initializeLookupMetadataForRows = async (rows = [], lookupColumns = []) => {
    const lookupRequests = new Map();

    (rows || []).forEach(row => {
        const rowData = getRowData(row);

        if (!rowData) return;

        lookupColumns.forEach(column => {
            const rawValue = rowData[column.field];
            const value = column.normalizeValue
                ? column.normalizeValue(rawValue)
                : String(rawValue ?? '');

            if (!value) return;
            if (hasInitialLookupMetadata(rowData, column.field, value)) return;

            const requestKey = `${column.field}\u0000${value}`;
            const request = lookupRequests.get(requestKey) || {
                column,
                value,
                rowData,
                targets: []
            };

            request.targets.push(rowData);
            lookupRequests.set(requestKey, request);
        });
    });

    await Promise.all([...lookupRequests.values()].map(async request => {
        const {
            column,
            value,
            rowData,
            targets
        } = request;
        let description = '';

        try {
            const items = column.lookupInstance
                && typeof column.lookupInstance.load === 'function'
                ? await column.lookupInstance.load({
                    query: value,
                    rowData,
                    field: column.field,
                    context: column.context || {}
                })
                : [];
            const item = (items || []).find(candidate => {
                const candidateValue = column.normalizeValue
                    ? column.normalizeValue(getLookupOptionValue(candidate, column.valueField))
                    : getLookupOptionValue(candidate, column.valueField);
                const comparableCandidateValue = column.normalizeComparableValue
                    ? column.normalizeComparableValue(candidateValue)
                    : candidateValue;
                const comparableValue = column.normalizeComparableValue
                    ? column.normalizeComparableValue(value)
                    : value;

                return comparableCandidateValue === comparableValue;
            });

            description = item && item[column.labelField] !== undefined
                ? item[column.labelField]
                : '';
        } catch (error) {
            console.error('Lookup metadata initialization failed', error);
        }

        targets.forEach(targetRowData => {
            setLookupMetadata(targetRowData, column.field, value, description, {
                setInitial: true
            });
        });
    }));
};

export const bindLookupMetadataInitialization = (table, lookupColumns = []) => {
    if (
        !table
        || !lookupColumns.length
        || typeof table.getRows !== 'function'
    ) {
        return () => {};
    }

    const initialize = () => {
        initializeLookupMetadataForRows(table.getRows(), lookupColumns)
            .catch(error => {
                console.error('Lookup metadata initialization failed', error);
            });
    };
    const eventNames = ['tableBuilt', 'dataLoaded'];

    initialize();

    if (typeof table.on === 'function') {
        eventNames.forEach(eventName => table.on(eventName, initialize));
    }

    return () => {
        if (typeof table.off !== 'function') return;

        eventNames.forEach(eventName => table.off(eventName, initialize));
    };
};

const configureLookupEditors = (columns, getCrud) => {
    const getCrudRowIdentifier = (crud, data) => {
        if (!crud || !data) return null;

        const id = data[crud.options.idField];

        if (id !== null && id !== undefined && id !== '') return id;

        return data[crud.options.tempIdField];
    };

    (columns || []).forEach(column => {
        if (
            column.editor
            && column.editor._ambEditorType === 'lookup'
            && typeof column.editor._ambSetLookupErrorHandlers === 'function'
        ) {
            column.editor._ambSetLookupErrorHandlers({
                markInvalid(cell, message) {
                    const crud = getCrud();
                    const row = cell && cell.getRow && cell.getRow();
                    const data = row && row.getData ? row.getData() : null;
                    const identifier = getCrudRowIdentifier(crud, data);
                    const field = cell && cell.getField && cell.getField();

                    if (!crud || identifier === null || identifier === undefined || !field) return;

                    crud.markCellError(identifier, field, message);
                },
                clearInvalid(cell) {
                    const crud = getCrud();
                    const row = cell && cell.getRow && cell.getRow();
                    const data = row && row.getData ? row.getData() : null;
                    const identifier = getCrudRowIdentifier(crud, data);
                    const field = cell && cell.getField && cell.getField();

                    if (!crud || identifier === null || identifier === undefined || !field) return;

                    crud.clearCellError(identifier, field);
                },
                applyRecord(cell, patch) {
                    const crud = getCrud();
                    const row = cell && cell.getRow && cell.getRow();
                    const data = row && row.getData ? row.getData() : null;
                    const identifier = getCrudRowIdentifier(crud, data);

                    if (!crud || identifier === null || identifier === undefined) return null;

                    return crud.updateRowFields(identifier, patch);
                }
            });
        }

        if (column.columns) {
            configureLookupEditors(column.columns, getCrud);
        }
    });
};

const isDeletedRow = (cell, getCrud) => {
    const crud = getCrud();
    const row = cell && cell.getRow && cell.getRow();
    const data = row && row.getData ? row.getData() : null;
    const stateField = crud ? crud.options.stateField : '_state';

    return Boolean(data && (data[stateField] || ROW_STATE.CLEAN) === ROW_STATE.DELETED);
};

const getCheckboxConfig = column => {
    return column && column.editor && column.editor._ambCheckboxConfig
        ? column.editor._ambCheckboxConfig
        : {
            checkedValue: true,
            uncheckedValue: false
        };
};

const isPrimaryMouseEvent = event => {
    return !event || event.button === undefined || event.button === 0;
};

const isCheckboxEditorTarget = target => {
    return Boolean(
        target
        && typeof target.closest === 'function'
        && target.closest('.amb-checkbox-editor')
    );
};

const stopCellPointerEvent = event => {
    if (!event) return;

    if (typeof event.preventDefault === 'function') {
        event.preventDefault();
    }

    if (typeof event.stopPropagation === 'function') {
        event.stopPropagation();
    }

    if (typeof event.stopImmediatePropagation === 'function') {
        event.stopImmediatePropagation();
    }
};

const getTargetCell = target => {
    return target && typeof target.closest === 'function'
        ? target.closest('.tabulator-cell')
        : null;
};

const suppressCheckboxCellClick = cell => {
    if (
        typeof document === 'undefined'
        || !document
        || typeof document.addEventListener !== 'function'
        || typeof document.removeEventListener !== 'function'
    ) {
        return;
    }

    const field = cell && typeof cell.getField === 'function' ? cell.getField() : null;
    const handleClick = event => {
        document.removeEventListener('click', handleClick, true);

        const targetCell = getTargetCell(event && event.target);

        if (!targetCell) return;

        const targetField = typeof targetCell.getAttribute === 'function'
            ? targetCell.getAttribute('tabulator-field')
            : null;

        if (field && targetField !== field) return;

        stopCellPointerEvent(event);
    };

    document.addEventListener('click', handleClick, true);
};

const toggleCheckboxCellFromMouse = (event, cell, column, getCrud) => {
    if (
        !isPrimaryMouseEvent(event)
        || isCheckboxEditorTarget(event && event.target)
        || isDeletedRow(cell, getCrud)
        || !cell
        || typeof cell.getValue !== 'function'
        || typeof cell.setValue !== 'function'
    ) {
        return false;
    }

    const config = getCheckboxConfig(column);
    const checked = cell.getValue() === config.checkedValue;

    stopCellPointerEvent(event);
    suppressCheckboxCellClick(cell);
    cell.setValue(checked ? config.uncheckedValue : config.checkedValue, true);

    return true;
};

export const prepareCheckboxColumns = (columns = [], getCrud = () => null) => {
    return (columns || []).map(column => {
        const nextColumn = { ...column };

        if (nextColumn.columns) {
            nextColumn.columns = prepareCheckboxColumns(nextColumn.columns, getCrud);
        }

        if (!isCheckboxColumn(nextColumn)) return nextColumn;

        const originalCellMouseDown = nextColumn.cellMouseDown;

        nextColumn.cellMouseDown = (event, cell) => {
            const handled = toggleCheckboxCellFromMouse(event, cell, nextColumn, getCrud);

            if (!handled && typeof originalCellMouseDown === 'function') {
                return originalCellMouseDown(event, cell);
            }

            return handled;
        };

        return nextColumn;
    });
};

const wrapEditableForDeletedRows = (columns, getCrud) => {
    return (columns || []).map(column => {
        const nextColumn = { ...column };

        if (nextColumn.columns) {
            nextColumn.columns = wrapEditableForDeletedRows(nextColumn.columns, getCrud);
        }

        if (!nextColumn.editor) return nextColumn;

        const originalEditable = nextColumn.editable;

        nextColumn.editable = cell => {
            if (isDeletedRow(cell, getCrud)) return false;

            if (typeof originalEditable === 'function') {
                return originalEditable(cell);
            }

            if (originalEditable !== undefined) {
                return originalEditable;
            }

            return true;
        };

        return nextColumn;
    });
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
 * @typedef {object} AMBTableController
 * @property {object} table - Internal table engine instance for advanced integrations. Prefer controller methods for normal usage.
 * @property {CrudHelper} crud - CRUD application layer for row state, validation, rollback, and save payloads.
 * @property {Function} getColumnDefinitions - Return the current grid column definitions.
 * @property {Function} getColumns - Return current column components.
 * @property {Function} getColumn - Return one column component using a supported lookup.
 * @property {Function} getColumnDefinition - Return the runtime definition for one column.
 * @property {Function} getColumnElement - Return the runtime DOM element for one column.
 * @property {Function} getColumnField - Return the runtime field for one column.
 * @property {Function} getColumnCells - Return runtime Cell Components for one column.
 * @property {Function} isColumnVisible - Return the runtime visibility state for one column.
 * @property {Function} getColumnWidth - Return the runtime width for one column.
 * @property {Function} setColumnWidth - Set the runtime width for one column.
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
 * @property {Function} selectRow - Select one row by backend id or AMB temporary id.
 * @property {Function} deselectRow - Deselect one row by backend id or AMB temporary id.
 * @property {Function} toggleSelectRow - Toggle one row using a backend or AMB temporary identifier.
 * @property {Function} addRange - Add a selected range between two cell components.
 * @property {Function} getRanges - Return the current selected cell-range components.
 * @property {Function} getRangesData - Return data grouped by selected cell range.
 * @property {Function} getRangeElement - Return the runtime DOM element for one selected range.
 * @property {Function} getRangeData - Return runtime data for one selected range.
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
 * @property {Function} clearHeaderFilter - Clear all column header filters.
 * @property {Function} refreshFilter - Re-run the filters currently applied to the grid.
 * @property {Function} getFilters - Return the current developer-managed filters.
 * @property {Function} addFilter - Add a programmatic filter.
 * @property {Function} setFilter - Replace the developer-managed programmatic filters.
 * @property {Function} removeFilter - Remove a programmatic filter.
 * @property {Function} clearFilter - Clear developer-managed filters while preserving global search.
 * @property {Function} getSorters - Return the current grid sorter definitions.
 * @property {Function} setSort - Apply one or more grid sorters.
 * @property {Function} clearSort - Clear the current grid sorting.
 * @property {Function} getAjaxUrl - Return the current AJAX data URL.
 * @property {Function} getData - Return the current grid row data.
 * @property {Function} getDataCount - Return the number of rows in the requested range.
 * @property {Function} searchData - Return row data matching a filter definition.
 * @property {Function} getSheetDefinitions - Return the current spreadsheet sheet definitions.
 * @property {Function} getSheets - Return the current spreadsheet Sheet Components.
 * @property {Function} getSheet - Return one spreadsheet Sheet Component.
 * @property {Function} getSheetTitle - Return the runtime title of one spreadsheet sheet.
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
 * @property {Function} clearCellValidation - Clear native validation markers from cells.
 * @property {Function} getEditedCells - Return cells marked as edited by the grid.
 * @property {Function} getInvalidCells - Return cells marked as invalid by the grid.
 * @property {Function} validate - Validate AMB-managed rows and return the structured AMB Grid validation report.
 * @property {Function} validateChanges - Validate AMB rows with pending insert or update changes.
 * @property {Function} validateRow - Validate one AMB-managed row by backend or temporary identifier.
 * @property {Function} getRows - Return row components in the requested range.
 * @property {Function} getRow - Return a row component by backend id, AMB temporary id, or supported lookup value.
 * @property {Function} getRowData - Return managed data for one row by backend id, AMB temporary id, or supported lookup value.
 * @property {Function} getRowIndex - Return the identifying index value for one row.
 * @property {Function} getNextRow - Return the next row component relative to one row, or `false`.
 * @property {Function} getPrevRow - Return the previous row component relative to one row, or `false`.
 * @property {Function} getRowElement - Return the runtime DOM element for one row.
 * @property {Function} getRowCells - Return the Cell Components for one row.
 * @property {Function} getRowCell - Return one Cell Component from a row.
 * @property {Function} getCellValue - Return the runtime value for one cell.
 * @property {Function} getCellOldValue - Return the previous runtime value for one cell.
 * @property {Function} getCellInitialValue - Return the initial runtime value for one cell.
 * @property {Function} getCellElement - Return the runtime DOM element for one cell.
 * @property {Function} getCellField - Return the runtime field for one cell.
 * @property {Function} getCellColumn - Return the Column Component for one cell.
 * @property {Function} getCellRow - Return the Row Component for one cell.
 * @property {Function} getCellData - Return runtime row data in the context of one cell.
 * @property {Function} getCellType - Return the runtime type for one cell.
 * @property {Function} checkCellHeight - Check the runtime height for one cell.
 * @property {Function} normalizeRowHeight - Normalize the runtime height of one row.
 * @property {Function} reformatRow - Reapply runtime formatting for one row.
 * @property {Function} freezeRow - Freeze one row through the AMB Grid public API, changing only its runtime row position.
 * @property {Function} unfreezeRow - Unfreeze one row through the AMB Grid public API, changing only its runtime row position.
 * @property {Function} isRowFrozen - Return whether one row is currently frozen through the AMB Grid public API.
 * @property {Function} expandTreeRow - Expand one Data Tree row when Data Tree is enabled, returning `true` only when delegated.
 * @property {Function} collapseTreeRow - Collapse one Data Tree row when Data Tree is enabled, returning `true` only when delegated.
 * @property {Function} toggleTreeRow - Toggle one Data Tree row when Data Tree is enabled, returning `true` only when delegated.
 * @property {Function} getTreeParent - Return the Data Tree parent Row Component, or `false` when unavailable or at a root row.
 * @property {Function} getTreeChildren - Return the direct Data Tree child Row Components, or `false` when unavailable.
 * @property {Function} isTreeExpanded - Return the Data Tree runtime expanded state, or `false` when unavailable.
 * @property {Function} getRowPosition - Return the one-based position of a row.
 * @property {Function} getRowFromPosition - Return the row component at a numerical position.
 * @property {Function} scrollToRow - Scroll vertically to a grid row.
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
 * @property {Function} setGroupBy - Change the runtime row grouping definition.
 * @property {Function} setGroupValues - Change the allowed values for grouping levels.
 * @property {Function} setGroupStartOpen - Change the initial group opening definition.
 * @property {Function} setGroupHeader - Change the group-header formatter definition.
 * @property {Function} getHistoryUndoSize - Return the number of actions available for undo.
 * @property {Function} getHistoryRedoSize - Return the number of actions available for redo.
 * @property {Function} clearHistory - Clear the native interaction history without changing AMB Grid CRUD state.
 * @property {Function} getPage - Return the current page number.
 * @property {Function} getPageMax - Return the maximum available page number.
 * @property {Function} getPageSize - Return the number of rows allowed per page.
 * @property {Function} setPage - Show a numbered or named pagination page.
 * @property {Function} nextPage - Show the next page.
 * @property {Function} previousPage - Show the previous page.
 * @property {Function} setPageSize - Change the number of rows displayed on each page.
 * @property {Function} setMaxPage - Change the maximum page available to the grid.
 * @property {Function} setPageToRow - Show the local pagination page containing a row.
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
 * @property {Function} recalc - Recalculate the configured column calculations.
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
 * @property {Function} on - Subscribe an application callback to a public grid event.
 * @property {Function} off - Remove application listeners while preserving AMB Grid internal bindings.
 * @property {Function} destroy - Destroy the complete AMB-managed grid and its internally managed resources.
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
 * `crud.addRow(...)` appends to the whole grid, uses the underlying engine row
 * component to open the page containing the new row when possible, and attempts
 * to focus the first editable visible data cell. Action/delete columns are not
 * candidates for automatic focus.
 *
 * @param {object} options - AMB Grid options, including supported internal-engine configuration.
 * @param {string|HTMLElement} options.selector - CSS selector or element used to mount the grid.
 * @param {object[]} [options.data] - Initial row data.
 * @param {object[]} [options.columns] - Grid column definitions with optional AMB validation metadata.
 * @param {boolean|object} [options.pagination] - Boolean pagination configuration or AMB object-style pagination convenience.
 * @param {boolean} [options.pagination.enabled=true] - Enable pagination when using AMB object-style pagination.
 * @param {'local'|'remote'} [options.pagination.mode='local'] - Pagination mode delegated to the underlying table engine as `paginationMode`.
 * @param {number} [options.pagination.pageSize=10] - Page size delegated to the underlying table engine as `paginationSize`.
 * @param {number[]} [options.pagination.pageSizeSelector] - Page size options delegated to the underlying table engine as `paginationSizeSelector`.
 * @param {object} [options.deleteColumn] - Optional row action column.
 * @param {boolean} [options.deleteColumn.enabled=false] - Add the delete/rollback/remove column.
 * @param {object} [options.deleteColumn.actions] - Action visibility flags.
 * @param {boolean} [options.deleteColumn.actions.delete=true] - Show delete for clean/saved rows.
 * @param {boolean} [options.deleteColumn.actions.rollback=true] - Show rollback for modified/deleted rows.
 * @param {boolean} [options.deleteColumn.actions.removeNew=true] - Show remove for new rows.
 * @param {object} [options.deleteColumn.icons] - Action button text/icon overrides.
 * @param {string} [options.deleteColumn.icons.delete='🗑'] - Delete button text/icon.
 * @param {string} [options.deleteColumn.icons.rollback='↶'] - Rollback button text/icon.
 * @param {string} [options.deleteColumn.icons.removeNew='×'] - Remove new-row button text/icon.
 * @param {object} [options.deleteColumn.labels] - Action button aria-label overrides.
 * @param {string} [options.deleteColumn.labels.delete='Delete row'] - Delete button aria-label.
 * @param {string} [options.deleteColumn.labels.rollback='Rollback row'] - Rollback button aria-label.
 * @param {string} [options.deleteColumn.labels.removeNew='Remove new row'] - Remove new-row button aria-label.
 * @param {string} [options.deleteColumn.confirmDeleteMessage] - Confirmation text before deleting a clean row.
 * @param {string} [options.deleteColumn.confirmRollbackMessage] - Confirmation text before rolling back a changed row.
 * @param {string} [options.deleteColumn.confirmRemoveNewMessage] - Confirmation text before removing an unsaved row.
 * @param {Function} [options.deleteColumn.confirmProvider] - Custom async confirmation function.
 * @param {object} [options.selectionColumn] - Optional row selection column.
 * @param {boolean} [options.selectionColumn.enabled=false] - Add a row selection column.
 * @param {'single'|'multiple'} [options.selectionColumn.mode='multiple'] - Selection mode.
 * @param {number} [options.selectionColumn.width=45] - Selection column width.
 * @param {object} [options.search] - Optional client-side search toolbar.
 * @param {boolean} [options.search.enabled=false] - Show the search toolbar.
 * @param {string} [options.search.placeholder='Search...'] - Search input placeholder.
 * @param {boolean} [options.search.caseSensitive=false] - Match search text with case sensitivity.
 * @param {boolean} [options.search.wholeWord=false] - Match the query as a complete word or phrase.
 * @param {object} [options.search.filters] - Search field filter options.
 * @param {boolean} [options.search.filters.enabled=false] - Show the filters button.
 * @param {boolean|object} [options.floatingMessages] - Hover message options. Set `false` to disable all `teh-floating-message` output.
 * @param {boolean} [options.floatingMessages.enabled=true] - Enable all floating message channels.
 * @param {boolean} [options.floatingMessages.lookupDescriptions=true] - Show lookup description hover messages.
 * @param {boolean} [options.floatingMessages.validationErrors=true] - Show validation error hover messages.
 * @param {boolean} [options.floatingMessages.largeTextPreviews=true] - Show large text preview hover messages.
 * @param {boolean} [options.floatingMessages.searchFilterStatus=true] - Show search filter status hover messages.
 * @param {boolean|object} [options.toolbar=true] - Backend-agnostic CRUD toolbar. Set `false` to disable.
 * @param {boolean} [options.toolbar.enabled=true] - Render the toolbar.
 * @param {Array.<string|object>} [options.toolbar.buttons=['add','reload','save']] - Built-in ids or simple custom button definitions.
 * @param {Function} [options.toolbar.onAdd] - Developer callback receiving `{ grid, event }`.
 * @param {Function} [options.toolbar.onSave] - Developer callback receiving `{ grid, payload, event }`.
 * @param {Function} [options.toolbar.onReload] - Developer callback receiving `{ grid, event }`.
 * @param {Function} [options.toolbar.onValidate] - Developer callback receiving `{ grid, event }`.
 * @param {Function} [options.toolbar.onPayload] - Developer callback receiving `{ grid, payload, event }`.
 * @param {object} [options.messages] - Shared UI and validation messages.
 * @param {string} [options.messages.required='This field is required'] - Default required message.
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
    const {
        selector,
        columns,
        messages,
        deleteColumn,
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
    const extracted = extractColumnValidators(columns, normalizedMessages);
    const dataColumns = prepareCheckboxColumns(
        prepareLookupColumns(
            wrapEditableForDeletedRows(extracted.columns, () => crud),
            { lookupDescriptions: normalizedFloatingMessages.lookupDescriptions }
        ),
        () => crud
    );
    const alignedDataColumns = applyDefaultColumnAlignments(dataColumns);
    const lookupColumns = collectLookupColumns(alignedDataColumns);
    const normalizedOptions = normalizePaginationOptions(tabulatorOptions);
    let crud = null;
    let unsubscribeDeleteColumn = null;
    let unsubscribeSelectionColumn = null;
    let unsubscribeLookupMetadata = null;
    let unsubscribeLookupDescriptions = null;
    let unsubscribeLargeText = null;
    let searchController = null;
    let toolbarController = null;
    let feedback = null;
    let controller = null;
    const confirmDialog = new ConfirmDialog();
    const selectionColumnController = createSelectionColumn(selectionColumn);
    const deleteColumnController = deleteColumn && deleteColumn.enabled
        ? createDeleteColumn(deleteColumn, () => crud, confirmDialog)
        : null;

    if (selectionColumnController && normalizedOptions.selectableRows === undefined) {
        normalizedOptions.selectableRows = selectionColumnController.selectableRows;
    }

    if (columns) {
        normalizedOptions.columns = [
            ...(selectionColumnController ? [selectionColumnController.column] : []),
            ...(deleteColumnController ? [deleteColumnController.column] : []),
            ...alignedDataColumns
        ];

        configureLookupEditors(normalizedOptions.columns, () => crud);
    }

    const table = new Tabulator(selector, normalizedOptions);
    const alertMethods = createAlertMethods({ table });
    const calculationMethods = createCalculationMethods({ table });
    const cellStateMethods = createCellStateMethods({ table });
    const columnMethods = createColumnMethods({ table });
    const dataMethods = createDataMethods({ table });
    const eventMethods = createEventMethods({ table });
    const exportMethods = createExportMethods({ table });
    const groupingMethods = createGroupingMethods({ table });
    const historyMethods = createHistoryMethods({ table });
    const layoutMethods = createLayoutMethods({ table });
    const localizationMethods = createLocalizationMethods({ table });
    const persistenceMethods = createPersistenceMethods({ table });
    const redrawMethods = createRedrawMethods({ table });
    const sortMethods = createSortMethods({ table });
    const navigationMethods = createNavigationMethods({ table });
    const spreadsheetMethods = createSpreadsheetMethods({ table });
    crud = new CrudHelper(table, { errorStyle });
    const rowMethods = createRowMethods({ table, crud });
    const cellMethods = createCellMethods({ rowMethods });
    const paginationMethods = createPaginationMethods({ table, crud });
    const selectionMethods = createSelectionMethods({ table, crud });
    const validationMethods = createValidationMethods({ crud });
    const rangeMethods = createRangeMethods({ table });
    unsubscribeSelectionColumn = selectionColumnController && typeof selectionColumnController.bind === 'function'
        ? selectionColumnController.bind(table)
        : null;
    const floatingMessage = new FloatingMessage({
        enabled: normalizedFloatingMessages.enabled
    });
    const cellMessageBinder = new CellMessageBinder(crud, floatingMessage, {
        enabled: normalizedFloatingMessages.validationErrors
    });
    unsubscribeLookupDescriptions = createLookupDescriptionBinder(table, floatingMessage, {
        enabled: normalizedFloatingMessages.lookupDescriptions
    });
    unsubscribeLookupMetadata = bindLookupMetadataInitialization(table, lookupColumns);
    unsubscribeLargeText = createLargeTextBinder(table, floatingMessage, {
        enabled: normalizedFloatingMessages.largeTextPreviews
    });
    toolbarController = createToolbar({
        selector,
        toolbar,
        getGrid: () => controller
    });
    feedback = new FeedbackRegion({
        className: [
            'amb-feedback-region--grid',
            toolbarController ? 'amb-feedback-region--connected' : ''
        ].filter(Boolean).join(' ')
    });
    const tableElement = typeof selector === 'string'
        ? document.querySelector(selector)
        : selector;

    if (tableElement && tableElement.parentNode) {
        tableElement.parentNode.insertBefore(feedback.element, tableElement);
    }
    searchController = createSearchController({
        selector,
        search,
        columns: alignedDataColumns,
        table,
        floatingMessage,
        showFilterStatus: normalizedFloatingMessages.searchFilterStatus,
        mountElement: toolbarController ? toolbarController.searchMount : null
    });
    const filterMethods = createFilterMethods({
        table,
        searchController
    });
    const searchMethods = createSearchMethods({ searchController });
    const controllerMethods = composeControllerMethods(
        alertMethods,
        calculationMethods,
        cellStateMethods,
        columnMethods,
        dataMethods,
        spreadsheetMethods,
        rowMethods,
        cellMethods,
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
        redrawMethods
    );

    if (deleteColumnController) {
        unsubscribeDeleteColumn = crud.on('row-state-changed', ({ row }) => {
            deleteColumnController.updateRowButton(row);
        });
    }

    extracted.validators.forEach(validator => {
        if (typeof validator.validate !== 'function') return;

        crud.addCellValidator(validator.field, validator.message, validator.validate);
    });

    controller = {
        table,
        crud,
        toolbar: toolbarController,
        feedback,
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
        ...controllerMethods,
        destroy() {
            if (toolbarController) {
                toolbarController.destroy();
                toolbarController = null;
                controller.toolbar = null;
            }

            if (unsubscribeDeleteColumn) {
                unsubscribeDeleteColumn();
                unsubscribeDeleteColumn = null;
            }

            if (unsubscribeSelectionColumn) {
                unsubscribeSelectionColumn();
                unsubscribeSelectionColumn = null;
            }

            if (unsubscribeLookupDescriptions) {
                unsubscribeLookupDescriptions();
                unsubscribeLookupDescriptions = null;
            }

            if (unsubscribeLookupMetadata) {
                unsubscribeLookupMetadata();
                unsubscribeLookupMetadata = null;
            }

            if (unsubscribeLargeText) {
                unsubscribeLargeText();
                unsubscribeLargeText = null;
            }

            if (searchController) {
                searchController.destroy();
                searchController = null;
            }

            if (feedback) {
                feedback.destroy();
                feedback = null;
                controller.feedback = null;
            }

            cellMessageBinder.destroy();
            floatingMessage.destroy();
            confirmDialog.destroy();
            crud.destroy();

            if (typeof table.destroy === 'function') {
                table.destroy();
            }
        }
    };

    return controller;
}

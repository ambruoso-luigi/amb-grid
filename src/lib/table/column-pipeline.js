import { ROW_STATE } from '../crud-helper.js';
import { escapeHtmlText, formatters } from '../formatters.js';
import { getLookupOptionValue } from '../editors/shared.js';
import { getLookupMetadata, setLookupMetadata } from '../lookup-metadata.js';
import {
    DEFAULT_MESSAGES,
    extractColumnValidators
} from './validation-extraction.js';
import { prepareColumnCalculations } from './column-calculation-runtime.js';

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

const cloneApplicationColumns = (columns = []) => {
    return (columns || []).map(column => {
        if (!column || typeof column !== 'object') return column;

        const nextColumn = { ...column };

        if (column.columns) {
            nextColumn.columns = cloneApplicationColumns(column.columns);
        }

        return nextColumn;
    });
};

const getAmbEditorType = column => {
    return column && column.editor && column.editor._ambEditorType;
};

const getAmbFormatterType = column => {
    return column && column.formatter && column.formatter._ambFormatterType;
};

/**
 * Applies editor-derived formatters only where the application omitted one.
 *
 * @param {object[]} columns - Prepared application column definitions.
 * @returns {object[]} Independently prepared definitions with default formatters.
 * @private
 * @internal
 */
export const applyDefaultEditorFormatters = (columns = []) => {
    return (columns || []).map(column => {
        const nextColumn = { ...column };

        if (nextColumn.columns) {
            nextColumn.columns = applyDefaultEditorFormatters(
                nextColumn.columns
            );
        }

        if (
            nextColumn.formatter === undefined
            && getAmbEditorType(nextColumn) === 'decimal'
        ) {
            const config = nextColumn.editor._ambDecimalConfig || {};
            const decimals = config.decimalDigits === undefined
                ? 2
                : config.decimalDigits;
            const locale = config.decimalSeparator === '.'
                ? 'en-US'
                : 'it-IT';

            nextColumn.formatter = formatters.decimal(decimals, { locale });
        }

        return nextColumn;
    });
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

const createLookupCellMarkerFormatter = (
    field,
    originalFormatter,
    showDescription = true
) => {
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

export const initializeLookupMetadataForRows = async (
    rows = [],
    lookupColumns = []
) => {
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
                    ? column.normalizeValue(getLookupOptionValue(
                        candidate,
                        column.valueField
                    ))
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
            setLookupMetadata(
                targetRowData,
                column.field,
                value,
                description,
                { setInitial: true }
            );
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

                    if (
                        !crud
                        || identifier === null
                        || identifier === undefined
                        || !field
                    ) {
                        return;
                    }

                    crud.markCellError(identifier, field, message);
                },
                clearInvalid(cell) {
                    const crud = getCrud();
                    const row = cell && cell.getRow && cell.getRow();
                    const data = row && row.getData ? row.getData() : null;
                    const identifier = getCrudRowIdentifier(crud, data);
                    const field = cell && cell.getField && cell.getField();

                    if (
                        !crud
                        || identifier === null
                        || identifier === undefined
                        || !field
                    ) {
                        return;
                    }

                    crud.clearCellError(identifier, field);
                },
                applyRecord(cell, patch) {
                    const crud = getCrud();
                    const row = cell && cell.getRow && cell.getRow();
                    const data = row && row.getData ? row.getData() : null;
                    const identifier = getCrudRowIdentifier(crud, data);

                    if (
                        !crud
                        || identifier === null
                        || identifier === undefined
                    ) {
                        return null;
                    }

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

    return Boolean(
        data
        && (data[stateField] || ROW_STATE.CLEAN) === ROW_STATE.DELETED
    );
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

    const field = cell && typeof cell.getField === 'function'
        ? cell.getField()
        : null;
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

export const prepareCheckboxColumns = (
    columns = [],
    getCrud = () => null
) => {
    return (columns || []).map(column => {
        const nextColumn = { ...column };

        if (nextColumn.columns) {
            nextColumn.columns = prepareCheckboxColumns(
                nextColumn.columns,
                getCrud
            );
        }

        if (!isCheckboxColumn(nextColumn)) return nextColumn;

        const originalCellMouseDown = nextColumn.cellMouseDown;

        nextColumn.cellMouseDown = (event, cell) => {
            const handled = toggleCheckboxCellFromMouse(
                event,
                cell,
                nextColumn,
                getCrud
            );

            if (!handled && typeof originalCellMouseDown === 'function') {
                return originalCellMouseDown(event, cell);
            }

            return handled;
        };

        return nextColumn;
    });
};

export const wrapEditableForDeletedRows = (
    columns = [],
    getCrud = () => null
) => {
    return (columns || []).map(column => {
        const nextColumn = { ...column };

        if (nextColumn.columns) {
            nextColumn.columns = wrapEditableForDeletedRows(
                nextColumn.columns,
                getCrud
            );
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

const composeRuntimeColumns = (
    preparedDataColumns,
    selectionColumn,
    deleteColumn
) => {
    const runtimeColumns = [];
    const managedColumns = new Set();

    [selectionColumn, deleteColumn].forEach(column => {
        if (!column || managedColumns.has(column)) return;

        managedColumns.add(column);
        runtimeColumns.push(column);
    });

    runtimeColumns.push(...preparedDataColumns);

    return runtimeColumns;
};

/**
 * Runs the centralized AMB Grid column preparation sequence.
 *
 * Application column definitions are structurally copied before declarative
 * validators are extracted, deleted-row editability is protected, lookup and
 * checkbox behavior is prepared, and default alignments are applied. Lookup
 * metadata configuration and editor callbacks are derived once from the
 * prepared data columns. AMB-managed selection and action definitions are
 * composed only after application data preparation.
 *
 * Repeated calls always start from unprepared application definitions and
 * return independent column arrays, so runtime callbacks and AMB-managed
 * columns do not accumulate.
 *
 * @param {object} options - Internal pipeline inputs.
 * @param {object[]} [options.columns=[]] - Application column definitions.
 * @param {object} [options.messages] - Declarative validator messages.
 * @param {boolean} [options.lookupDescriptions=true] - Enable lookup markers.
 * @param {Function} [options.getCrud] - Return the current CRUD helper.
 * @param {Function} [options.getTable] - Return the current internal table.
 * @param {object|null} [options.selectionColumn] - AMB-managed selection definition.
 * @param {object|null} [options.deleteColumn] - AMB-managed action definition.
 * @returns {{
 *   applicationColumns: object[],
 *   preparedDataColumns: object[],
 *   runtimeColumns: object[],
 *   validators: object[],
 *   lookupColumns: object[],
 *   searchColumns: object[]
 * }} Canonical application, prepared data, runtime, validation, lookup, and search results.
 * @private
 * @internal
 */
export const prepareColumnPipeline = ({
    columns = [],
    messages = DEFAULT_MESSAGES,
    lookupDescriptions = true,
    getCrud = () => null,
    getTable = () => null,
    selectionColumn = null,
    deleteColumn = null
} = {}) => {
    const applicationColumns = cloneApplicationColumns(columns);
    const extracted = extractColumnValidators(applicationColumns, messages);
    const calculationColumns = prepareColumnCalculations(
        extracted.columns,
        getCrud,
        getTable
    );
    const formattedColumns = applyDefaultEditorFormatters(
        calculationColumns
    );
    const editableColumns = wrapEditableForDeletedRows(
        formattedColumns,
        getCrud
    );
    const preparedLookupColumns = prepareLookupColumns(
        editableColumns,
        { lookupDescriptions }
    );
    const preparedCheckboxColumns = prepareCheckboxColumns(
        preparedLookupColumns,
        getCrud
    );
    const preparedDataColumns = applyDefaultColumnAlignments(
        preparedCheckboxColumns
    );
    const lookupColumns = collectLookupColumns(preparedDataColumns);

    configureLookupEditors(preparedDataColumns, getCrud);

    return {
        applicationColumns,
        preparedDataColumns,
        runtimeColumns: composeRuntimeColumns(
            preparedDataColumns,
            selectionColumn,
            deleteColumn
        ),
        validators: extracted.validators,
        lookupColumns,
        searchColumns: preparedDataColumns
    };
};

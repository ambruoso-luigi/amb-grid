import { TabulatorFull as Tabulator } from 'tabulator-tables';
import { CrudHelper, ROW_STATE } from './crud-helper.js';
import { CellMessageBinder } from '../ui/cell-message-binder.js';
import { FloatingMessage } from '../ui/floating-message.js';
import { ConfirmDialog } from '../ui/confirm-dialog.js';
import { LookupDialog } from '../ui/lookup-dialog.js';
import { SearchFiltersDialog } from '../ui/search-filters-dialog.js';
import { validators } from './validators.js';
import { formatters } from './formatters.js';
import { editors } from './editors.js';
import { parsers } from './parsers.js';
import { createLookup } from './lookup.js';
import { getLookupMetadata } from './lookup-metadata.js';

const DEFAULT_MESSAGES = {
    required: 'This field is required'
};

const DEFAULT_VALIDATION_MESSAGES = {
    date: 'Invalid date',
    decimal: 'Invalid decimal value',
    email: 'Invalid email address',
    integer: 'Value must be an integer',
    number: 'Value must be a number',
    pattern: 'Invalid format',
    custom: 'Invalid value'
};

const createRangeMessage = (min, max) => {
    return `Value must be between ${min} and ${max}`;
};

const createMinMessage = minValue => {
    return `Value must be at least ${minValue}`;
};

const createMaxMessage = maxValue => {
    return `Value must be at most ${maxValue}`;
};

const createMinLengthMessage = length => {
    return `Minimum length is ${length}`;
};

const createMaxLengthMessage = length => {
    return `Maximum length is ${length}`;
};

const extractValidationRules = (field, validation = {}, messages = DEFAULT_MESSAGES) => {
    const extractedValidators = [];

    if (!field || !validation) return extractedValidators;

    if (validation.required) {
        const requiredMessage = validation.required.message
            || messages.required
            || DEFAULT_MESSAGES.required;

        extractedValidators.push(validators.required(requiredMessage));
    }

    if (validation.pattern) {
        const regex = validation.pattern instanceof RegExp
            ? validation.pattern
            : validation.pattern.regex;
        const message = validation.pattern.message || DEFAULT_VALIDATION_MESSAGES.pattern;

        if (regex) {
            extractedValidators.push(validators.pattern(regex, message));
        }
    }

    if (validation.email) {
        const message = validation.email.message || DEFAULT_VALIDATION_MESSAGES.email;

        extractedValidators.push(validators.email(message));
    }

    if (validation.number) {
        const message = validation.number.message || DEFAULT_VALIDATION_MESSAGES.number;

        extractedValidators.push(validators.number(message));
    }

    if (validation.integer) {
        const message = validation.integer === true
            ? DEFAULT_VALIDATION_MESSAGES.integer
            : validation.integer.message || DEFAULT_VALIDATION_MESSAGES.integer;

        extractedValidators.push(validators.integer(message));
    }

    if (validation.decimal) {
        const decimalValidation = validation.decimal === true
            ? {}
            : validation.decimal;
        const { message, ...decimalOptions } = decimalValidation;

        extractedValidators.push(validators.decimal(
            decimalOptions,
            message || DEFAULT_VALIDATION_MESSAGES.decimal
        ));
    }

    if (validation.date) {
        const dateValidation = validation.date === true
            ? {}
            : validation.date;
        const { message, ...dateOptions } = dateValidation;

        extractedValidators.push(validators.date(
            dateOptions,
            message || DEFAULT_VALIDATION_MESSAGES.date
        ));
    }

    if (validation.range) {
        const { min, max, message } = validation.range;

        extractedValidators.push(validators.range(
            min,
            max,
            message || createRangeMessage(min, max)
        ));
    }

    if (validation.min !== undefined) {
        const minValue = typeof validation.min === 'number'
            ? validation.min
            : validation.min.value;
        const message = validation.min.message || createMinMessage(minValue);

        extractedValidators.push(validators.min(minValue, message));
    }

    if (validation.max !== undefined) {
        const maxValue = typeof validation.max === 'number'
            ? validation.max
            : validation.max.value;
        const message = validation.max.message || createMaxMessage(maxValue);

        extractedValidators.push(validators.max(maxValue, message));
    }

    if (validation.minLength !== undefined) {
        const length = typeof validation.minLength === 'number'
            ? validation.minLength
            : validation.minLength.value;
        const message = validation.minLength.message || createMinLengthMessage(length);

        extractedValidators.push(validators.minLength(length, message));
    }

    if (validation.maxLength !== undefined) {
        const length = typeof validation.maxLength === 'number'
            ? validation.maxLength
            : validation.maxLength.value;
        const message = validation.maxLength.message || createMaxLengthMessage(length);

        extractedValidators.push(validators.maxLength(length, message));
    }

    if (validation.custom && typeof validation.custom.validate === 'function') {
        extractedValidators.push(validators.custom(
            validation.custom.message || DEFAULT_VALIDATION_MESSAGES.custom,
            validation.custom.validate
        ));
    }

    return extractedValidators;
};

const extractColumnValidators = (columns, messages = DEFAULT_MESSAGES) => {
    const extractedValidators = [];

    const normalizedColumns = (columns || []).map(column => {
        const {
            validator,
            validation,
            required,
            requiredMessage,
            columns: childColumns,
            ...tabulatorColumn
        } = column;

        if (required && column.field) {
            extractedValidators.push({
                field: column.field,
                ...validators.required(requiredMessage || messages.required || DEFAULT_MESSAGES.required)
            });
        }

        extractValidationRules(column.field, validation, messages).forEach(extractedValidator => {
            extractedValidators.push({
                field: column.field,
                ...extractedValidator
            });
        });

        if (validator && column.field) {
            extractedValidators.push({
                field: column.field,
                message: validator.message,
                validate: validator.validate
            });
        }

        if (childColumns) {
            const childExtraction = extractColumnValidators(childColumns, messages);

            tabulatorColumn.columns = childExtraction.columns;
            extractedValidators.push(...childExtraction.validators);
        }

        return tabulatorColumn;
    });

    return {
        columns: normalizedColumns,
        validators: extractedValidators
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
                }
            });
        }

        if (column.columns) {
            configureLookupEditors(column.columns, getCrud);
        }
    });
};

const createDeleteColumn = (deleteColumn, getCrud, confirmDialog) => {
    const confirmDeleteMessage = deleteColumn.confirmDeleteMessage || deleteColumn.confirmMessage;
    const confirmRollbackMessage = deleteColumn.confirmRollbackMessage;
    const confirmRemoveNewMessage = deleteColumn.confirmRemoveNewMessage;
    const confirmProvider = deleteColumn.confirmProvider;

    const getRowState = row => {
        const crud = getCrud();
        const data = row.getData();
        const stateField = crud ? crud.options.stateField : '_state';

        return data[stateField] || ROW_STATE.CLEAN;
    };

    const getRowIdentifier = (crud, data) => {
        const id = data[crud.options.idField];

        if (id !== null && id !== undefined && id !== '') return id;

        return data[crud.options.tempIdField];
    };

    const getButtonConfig = state => {
        if (state === ROW_STATE.NEW) {
            return {
                text: '×',
                label: 'Remove new row',
                className: 'teh-delete-button--remove'
            };
        }

        if (state === ROW_STATE.MODIFIED) {
            return {
                text: '↶',
                label: 'Rollback modified row',
                className: 'teh-delete-button--rollback'
            };
        }

        if (state === ROW_STATE.DELETED) {
            return {
                text: '↶',
                label: 'Rollback deleted row',
                className: 'teh-delete-button--rollback'
            };
        }

        return {
            text: '🗑',
            label: 'Delete row',
            className: 'teh-delete-button--delete'
        };
    };

    const updateRowButton = row => {
        const rowElement = row && row.getElement && row.getElement();
        const button = rowElement && rowElement.querySelector('.teh-delete-button');

        if (!button) return;

        const state = getRowState(row);
        const config = getButtonConfig(state);

        button.classList.remove(
            'teh-delete-button--delete',
            'teh-delete-button--rollback',
            'teh-delete-button--remove'
        );
        button.classList.add(config.className);
        button.textContent = config.text;
        button.setAttribute('aria-label', config.label);
    };

    const scheduleRowButtonUpdate = row => {
        window.setTimeout(() => {
            updateRowButton(row);
        }, 0);
    };

    const requestConfirmation = async ({ action, message, row, state, id }) => {
        if (!message) return true;

        if (typeof confirmProvider === 'function') {
            return Boolean(await confirmProvider({ action, message, row, state, id }));
        }

        return confirmDialog.confirm({ message });
    };

    return {
        column: {
            width: deleteColumn.width || 55,
            hozAlign: 'center',
            headerSort: false,
            formatter: cell => {
                const state = getRowState(cell.getRow());
                const config = getButtonConfig(state);
                const button = document.createElement('button');

                button.type = 'button';
                button.className = `teh-delete-button ${config.className}`;
                button.textContent = config.text;
                button.setAttribute('aria-label', config.label);

                return button;
            },
            cellClick: async (event, cell) => {
                event.preventDefault();
                event.stopPropagation();

                const crud = getCrud();

                if (!crud) return;

                const row = cell.getRow();
                const data = row.getData();
                const id = data[crud.options.idField];
                const identifier = getRowIdentifier(crud, data);
                const state = getRowState(row);

                if (state === ROW_STATE.NEW) {
                    const confirmed = await requestConfirmation({
                        action: 'remove-new',
                        message: confirmRemoveNewMessage,
                        row,
                        state,
                        id: identifier
                    });

                    if (!confirmed) {
                        return;
                    }

                    crud.deleteRow(identifier);
                    scheduleRowButtonUpdate(row);
                    return;
                }

                if (state === ROW_STATE.MODIFIED || state === ROW_STATE.DELETED) {
                    const confirmed = await requestConfirmation({
                        action: 'rollback',
                        message: confirmRollbackMessage,
                        row,
                        state,
                        id: identifier
                    });

                    if (!confirmed) {
                        return;
                    }

                    crud.rollbackRow(identifier);
                    scheduleRowButtonUpdate(row);
                    return;
                }

                const confirmed = await requestConfirmation({
                    action: 'delete',
                    message: confirmDeleteMessage,
                    row,
                    state,
                    id: identifier
                });

                if (!confirmed) {
                    return;
                }

                crud.deleteRow(identifier);
                scheduleRowButtonUpdate(row);
            }
        },
        updateRowButton
    };
};

const createSelectionColumn = (selectionColumn = {}) => {
    const normalizedOptions = {
        enabled: false,
        mode: 'multiple',
        width: 45,
        ...selectionColumn
    };

    if (!normalizedOptions.enabled) return null;

    const isMultiple = normalizedOptions.mode !== 'single';

    return {
        column: {
            width: normalizedOptions.width,
            hozAlign: 'center',
            headerHozAlign: 'center',
            headerSort: false,
            cssClass: 'amb-selection-column',
            titleFormatter: isMultiple ? 'rowSelection' : () => '',
            titleFormatterParams: isMultiple ? { rowRange: 'active' } : undefined,
            formatter: 'rowSelection'
        },
        selectableRows: isMultiple ? true : 1
    };
};

const SEARCH_EXCLUDED_FIELDS = new Set([
    '_state',
    '_ambTempId',
    '_ambRowNumber'
]);

const normalizeSearchOptions = (search = {}) => {
    return {
        enabled: false,
        placeholder: 'Search...',
        ...search,
        filters: {
            enabled: false,
            ...(search.filters || {})
        }
    };
};

const getTableElement = selector => {
    if (typeof selector === 'string') {
        return document.querySelector(selector);
    }

    return selector || null;
};

const getSearchColumnTitle = column => {
    if (!column) return '';
    if (typeof column.title === 'string' && column.title.trim() !== '') return column.title;

    return column.field || '';
};

const collectSearchColumns = (columns = []) => {
    const collectedColumns = [];

    (columns || []).forEach(column => {
        if (!column) return;

        if (column.columns) {
            collectedColumns.push(...collectSearchColumns(column.columns));
            return;
        }

        if (!column.field) return;
        if (String(column.field).startsWith('_')) return;
        if (SEARCH_EXCLUDED_FIELDS.has(column.field)) return;

        collectedColumns.push({
            field: column.field,
            title: getSearchColumnTitle(column)
        });
    });

    return collectedColumns;
};

const createSearchToolbar = (selector, searchOptions) => {
    const tableElement = getTableElement(selector);

    if (!tableElement || !tableElement.parentNode) return null;

    const toolbar = document.createElement('div');
    const input = document.createElement('input');
    const filtersButton = document.createElement('button');

    toolbar.className = 'amb-search-toolbar';
    input.className = 'amb-search-toolbar__input';
    input.type = 'search';
    input.placeholder = searchOptions.placeholder;

    filtersButton.className = 'amb-search-toolbar__filters-button';
    filtersButton.type = 'button';
    filtersButton.textContent = 'Filters';

    toolbar.appendChild(input);

    if (searchOptions.filters.enabled) {
        toolbar.appendChild(filtersButton);
    }

    tableElement.parentNode.insertBefore(toolbar, tableElement);

    return {
        toolbar,
        input,
        filtersButton: searchOptions.filters.enabled ? filtersButton : null
    };
};

const getSearchableValues = (data, field) => {
    const values = [];
    const value = data && data[field];
    const lookupDescription = data
        && data._ambLookup
        && data._ambLookup[field]
        && data._ambLookup[field].current
        ? data._ambLookup[field].current.description
        : '';

    if (value !== null && value !== undefined) {
        values.push(String(value));
    }

    if (lookupDescription) {
        values.push(String(lookupDescription));
    }

    return values;
};

const createSearchController = ({
    selector,
    search,
    columns,
    table,
    floatingMessage
}) => {
    const searchOptions = normalizeSearchOptions(search);

    if (!searchOptions.enabled) {
        return null;
    }

    const availableColumns = collectSearchColumns(columns);
    const toolbar = createSearchToolbar(selector, searchOptions);
    const dialog = new SearchFiltersDialog();
    const searchState = {
        query: '',
        selectedFields: []
    };
    const searchFilter = data => {
        const query = searchState.query.trim().toLowerCase();
        const fields = searchState.selectedFields.length
            ? searchState.selectedFields
            : availableColumns.map(column => column.field);

        if (!query) return true;

        return fields.some(field => {
            return getSearchableValues(data, field).some(value => {
                return value.toLowerCase().includes(query);
            });
        });
    };
    let filterActive = false;

    const getSelectedColumns = () => {
        const selectedFields = new Set(searchState.selectedFields);

        return availableColumns.filter(column => selectedFields.has(column.field));
    };

    const updateFiltersButton = () => {
        if (!toolbar || !toolbar.filtersButton) return;

        const count = searchState.selectedFields.length;

        toolbar.filtersButton.textContent = count > 0
            ? `Filters (${count})`
            : 'Filters';
    };

    const applySearch = () => {
        const shouldFilter = searchState.query.trim() !== '';

        if (filterActive) {
            table.removeFilter(searchFilter);
            filterActive = false;
        }

        if (shouldFilter) {
            table.addFilter(searchFilter);
            filterActive = true;
        }
    };

    const setSearchQuery = query => {
        searchState.query = String(query || '');

        if (toolbar && toolbar.input && toolbar.input.value !== searchState.query) {
            toolbar.input.value = searchState.query;
        }

        applySearch();
    };

    const setSearchFields = fields => {
        const allowedFields = new Set(availableColumns.map(column => column.field));
        const nextFields = (fields || []).filter(field => allowedFields.has(field));

        searchState.selectedFields = [...new Set(nextFields)];
        updateFiltersButton();
        applySearch();
    };

    const showFiltersMessage = () => {
        if (!toolbar || !toolbar.filtersButton) return;

        const selectedColumns = getSelectedColumns();

        if (!selectedColumns.length) {
            floatingMessage.scheduleShow(toolbar.filtersButton, {
                type: 'info',
                title: 'Filters',
                message: 'Searching all available columns'
            });
            return;
        }

        floatingMessage.scheduleShow(toolbar.filtersButton, {
            type: 'info',
            title: 'Filters active',
            message: selectedColumns.map(column => `- ${column.title}`).join('\n')
        });
    };

    const hideFiltersMessage = () => {
        floatingMessage.hide();
    };

    const openFiltersDialog = async () => {
        const selectedFields = new Set(searchState.selectedFields);
        const result = await dialog.open({
            title: 'Search Filters',
            columns: availableColumns.map(column => ({
                ...column,
                selected: selectedFields.has(column.field)
            })),
            selectAllText: 'Select All',
            clearAllText: 'Clear All',
            applyText: 'Apply',
            cancelText: 'Cancel'
        });

        if (result && result.applied) {
            setSearchFields(result.selectedFields || []);
        }
    };

    const handleInput = event => {
        setSearchQuery(event.target.value);
    };

    if (toolbar) {
        toolbar.input.addEventListener('input', handleInput);

        if (toolbar.filtersButton) {
            toolbar.filtersButton.addEventListener('click', openFiltersDialog);
            toolbar.filtersButton.addEventListener('mouseover', showFiltersMessage);
            toolbar.filtersButton.addEventListener('mouseout', hideFiltersMessage);
        }
    }

    updateFiltersButton();

    return {
        setSearchQuery,
        clearSearch() {
            setSearchQuery('');
        },
        getSearchState() {
            return {
                query: searchState.query,
                selectedFields: [...searchState.selectedFields]
            };
        },
        setSearchFields,
        destroy() {
            if (filterActive) {
                table.removeFilter(searchFilter);
                filterActive = false;
            }

            if (toolbar) {
                toolbar.input.removeEventListener('input', handleInput);

                if (toolbar.filtersButton) {
                    toolbar.filtersButton.removeEventListener('click', openFiltersDialog);
                    toolbar.filtersButton.removeEventListener('mouseover', showFiltersMessage);
                    toolbar.filtersButton.removeEventListener('mouseout', hideFiltersMessage);
                }

                toolbar.toolbar.remove();
            }

            dialog.destroy();
            floatingMessage.hide();
        }
    };
};

const createLookupDescriptionBinder = (table, floatingMessage) => {
    const tableElement = table && table.element;

    if (!tableElement) {
        return () => {};
    }

    let activeCellElement = null;

    const findLookupCell = target => {
        return target && target.closest
            ? target.closest('.tabulator-cell[data-lookup-field]')
            : null;
    };

    const getRowForElement = rowElement => {
        return table.getRows().find(row => row.getElement && row.getElement() === rowElement) || null;
    };

    const getLookupDescription = cellElement => {
        const rowElement = cellElement.closest('.tabulator-row');
        const row = getRowForElement(rowElement);
        const field = cellElement.dataset.lookupField;
        const metadata = row && getLookupMetadata(row.getData(), field);

        return metadata && metadata.current ? metadata.current.description : '';
    };

    const showDescription = event => {
        const cellElement = findLookupCell(event.target);

        if (!cellElement || cellElement.dataset.cellError === 'true') return;
        if (cellElement === activeCellElement) return;

        const description = getLookupDescription(cellElement);

        if (!description) return;

        activeCellElement = cellElement;
        floatingMessage.scheduleShow(cellElement, {
            type: 'info',
            title: 'Description',
            message: description
        });
    };

    const hideDescription = event => {
        const cellElement = findLookupCell(event.target);

        if (!cellElement || cellElement !== activeCellElement) return;
        if (cellElement.contains(event.relatedTarget)) return;

        activeCellElement = null;
        floatingMessage.hide();
    };

    tableElement.addEventListener('mouseover', showDescription);
    tableElement.addEventListener('mouseout', hideDescription);

    return () => {
        tableElement.removeEventListener('mouseover', showDescription);
        tableElement.removeEventListener('mouseout', hideDescription);
        floatingMessage.hide();
    };
};

const createLargeTextBinder = (table, floatingMessage) => {
    const tableElement = table && table.element;

    if (!tableElement) {
        return () => {};
    }

    let activeCellElement = null;

    const findLargeTextCell = target => {
        return target && target.closest
            ? target.closest('.tabulator-cell[data-large-text-field]')
            : null;
    };

    const getRowForElement = rowElement => {
        return table.getRows().find(row => row.getElement && row.getElement() === rowElement) || null;
    };

    const getFullText = cellElement => {
        const rowElement = cellElement.closest('.tabulator-row');
        const row = getRowForElement(rowElement);
        const field = cellElement.dataset.largeTextField;
        const rowData = row && row.getData ? row.getData() : null;
        const value = rowData && field ? rowData[field] : '';

        if (value === null || value === undefined || value === '') return '';

        return String(value);
    };

    const showText = event => {
        const cellElement = findLargeTextCell(event.target);

        if (!cellElement || cellElement.dataset.cellError === 'true') return;
        if (cellElement === activeCellElement) return;

        const text = getFullText(cellElement);

        if (!text) return;

        activeCellElement = cellElement;
        floatingMessage.scheduleShow(cellElement, {
            type: 'info',
            title: 'Text',
            message: text
        });
    };

    const hideText = event => {
        const cellElement = findLargeTextCell(event.target);

        if (!cellElement || cellElement !== activeCellElement) return;
        if (cellElement.contains(event.relatedTarget)) return;

        activeCellElement = null;
        floatingMessage.hide();
    };

    tableElement.addEventListener('mouseover', showText);
    tableElement.addEventListener('mouseout', hideText);

    return () => {
        tableElement.removeEventListener('mouseover', showText);
        tableElement.removeEventListener('mouseout', hideText);
        floatingMessage.hide();
    };
};

export const AMB = {
    validators,
    formatters,
    editors,
    parsers,
    lookup: createLookup,
    LookupDialog,
    SearchFiltersDialog,

    table(options = {}) {
        const {
            selector,
            columns,
            messages,
            deleteColumn,
            selectionColumn,
            search,
            errorStyle,
            ...tabulatorOptions
        } = options;
        const normalizedMessages = {
            ...DEFAULT_MESSAGES,
            ...messages
        };
        const extracted = extractColumnValidators(columns, normalizedMessages);
        const normalizedOptions = { ...tabulatorOptions };
        let crud = null;
        let unsubscribeDeleteColumn = null;
        let unsubscribeLookupDescriptions = null;
        let unsubscribeLargeText = null;
        let searchController = null;
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
                ...extracted.columns
            ];

            configureLookupEditors(normalizedOptions.columns, () => crud);
        }

        const table = new Tabulator(selector, normalizedOptions);
        crud = new CrudHelper(table, { errorStyle });
        const floatingMessage = new FloatingMessage();
        const cellMessageBinder = new CellMessageBinder(crud, floatingMessage);
        unsubscribeLookupDescriptions = createLookupDescriptionBinder(table, floatingMessage);
        unsubscribeLargeText = createLargeTextBinder(table, floatingMessage);
        searchController = createSearchController({
            selector,
            search,
            columns: extracted.columns,
            table,
            floatingMessage
        });

        if (deleteColumnController) {
            unsubscribeDeleteColumn = crud.on('row-state-changed', ({ row }) => {
                deleteColumnController.updateRowButton(row);
            });
        }

        extracted.validators.forEach(validator => {
            if (typeof validator.validate !== 'function') return;

            crud.addCellValidator(validator.field, validator.message, validator.validate);
        });

        return {
            table,
            crud,
            floatingMessage,
            cellMessageBinder,
            confirmDialog,
            getSelectedRows() {
                return typeof table.getSelectedData === 'function'
                    ? table.getSelectedData()
                    : [];
            },
            clearSelection() {
                if (typeof table.deselectRow === 'function') {
                    table.deselectRow();
                }
            },
            selectRow(identifier) {
                const row = crud.findRowByKey(identifier);

                if (!row || typeof row.select !== 'function') return false;

                row.select();
                return true;
            },
            deselectRow(identifier) {
                const row = crud.findRowByKey(identifier);

                if (!row || typeof row.deselect !== 'function') return false;

                row.deselect();
                return true;
            },
            setSearchQuery(query) {
                if (!searchController) return false;

                searchController.setSearchQuery(query);
                return true;
            },
            clearSearch() {
                if (!searchController) return false;

                searchController.clearSearch();
                return true;
            },
            getSearchState() {
                if (!searchController) {
                    return {
                        query: '',
                        selectedFields: []
                    };
                }

                return searchController.getSearchState();
            },
            setSearchFields(fields) {
                if (!searchController) return false;

                searchController.setSearchFields(fields);
                return true;
            },
            destroy() {
                if (unsubscribeDeleteColumn) {
                    unsubscribeDeleteColumn();
                    unsubscribeDeleteColumn = null;
                }

                if (unsubscribeLookupDescriptions) {
                    unsubscribeLookupDescriptions();
                    unsubscribeLookupDescriptions = null;
                }

                if (unsubscribeLargeText) {
                    unsubscribeLargeText();
                    unsubscribeLargeText = null;
                }

                if (searchController) {
                    searchController.destroy();
                    searchController = null;
                }

                cellMessageBinder.destroy();
                floatingMessage.destroy();
                confirmDialog.destroy();

                if (typeof table.destroy === 'function') {
                    table.destroy();
                }
            }
        };
    }
};

import { LookupDialog } from '../../ui/lookup-dialog.js';
import { ensureLookupMetadata, setLookupMetadata } from '../lookup-metadata.js';
import { getInitialValue, getLookupOptionValue } from './shared.js';

    /**
     * Lookup code editor with a text input and search dialog button.
     *
     * @param {object} lookupInstance - Lookup instance created with `AMB.lookup`.
     * @param {object} [options] - Lookup editor options.
     * @param {boolean} [options.allowEmpty=true] - Allow saving an empty string.
     * @param {string} [options.buttonText='🔍'] - Dialog button text.
     * @param {boolean} [options.uppercase=false] - Convert typed values to uppercase.
     * @param {boolean} [options.trim=true] - Trim typed values before saving.
     * @param {boolean} [options.validateOnBlur=true] - Validate typed codes on blur.
     * @param {boolean} [options.autoComplete=false] - Enable inline lookup suggestions.
     * @param {number} [options.autoCompleteMinChars=1] - Minimum query length for suggestions.
     * @param {boolean} [options.autoCompleteOnTab=true] - Accept a suggestion with Tab.
     * @param {string} [options.invalidMessage='Invalid lookup code'] - Error message for invalid typed codes.
     * @param {object} [options.context] - Context passed to lookup loads.
     * @param {Array<object>} [options.columns] - Dialog columns.
     * @param {string} [options.valueField] - Stored value field override.
     * @param {string} [options.labelField] - Display label field override.
     * @returns {Function} Tabulator editor.
     * @example
     * const products = AMB.lookup({
     *   valueField: 'sku',
     *   labelField: 'description',
     *   load: loadProducts
     * });
     *
     * { title: 'Product', field: 'sku', editor: AMB.editors.lookup(products, {
     *   columns: [
     *     { field: 'sku', title: 'SKU' },
     *     { field: 'description', title: 'Description' }
     *   ]
     * }) }
     */
export function lookup(lookupInstance, options = {}) {
        const normalizedOptions = {
            allowEmpty: true,
            buttonText: '🔍',
            uppercase: false,
            trim: true,
            selectOnFocus: false,
            validateOnBlur: true,
            autoComplete: false,
            autoCompleteMinChars: 1,
            autoCompleteOnTab: true,
            invalidMessage: 'Invalid lookup code',
            columns: lookupInstance && lookupInstance.columns,
            search: lookupInstance && lookupInstance.search,
            mapToRow: lookupInstance && lookupInstance.mapToRow,
            ...options
        };
        const keyField = lookupInstance && lookupInstance.keyField;
        const valueField = lookupInstance && lookupInstance.valueField
            ? lookupInstance.valueField
            : normalizedOptions.valueField || keyField || 'value';
        const labelField = lookupInstance && lookupInstance.labelField
            ? lookupInstance.labelField
            : normalizedOptions.labelField || 'label';

        const editor = (cell, onRendered, success, cancel) => {
            const container = document.createElement('div');
            const input = document.createElement('input');
            const button = document.createElement('button');
            const initialValue = getInitialValue(cell);
            const row = cell.getRow && cell.getRow();
            const rowData = row && row.getData ? row.getData() : undefined;
            const field = cell.getField && cell.getField();
            const context = normalizedOptions.context || {};
            let closed = false;
            let dialogOpen = false;
            let autoCompleteRequestId = 0;
            let hasAutoCompleteSuggestion = false;
            let navigationScheduled = false;
            let tabCommitInProgress = false;

            container.className = 'amb-lookup-editor';
            input.className = 'amb-lookup-editor__input';
            input.type = 'text';
            input.value = initialValue;
            input.placeholder = normalizedOptions.placeholder || '';
            button.className = 'amb-lookup-editor__button';
            button.type = 'button';
            button.textContent = normalizedOptions.buttonText;

            container.appendChild(input);
            container.appendChild(button);

            const normalizeValue = rawValue => {
                const stringValue = rawValue === null || rawValue === undefined
                    ? ''
                    : String(rawValue);
                const value = normalizedOptions.trim
                    ? stringValue.trim()
                    : stringValue;

                return normalizedOptions.uppercase ? value.toUpperCase() : value;
            };
            const normalizedInitialValue = normalizeValue(initialValue);
            const getValue = () => normalizeValue(input.value);

            const closeWithSuccess = value => {
                if (closed) return;

                closed = true;
                success(value);
            };

            const closeWithCancel = () => {
                if (closed) return;

                closed = true;
                cancel();
            };

            const markInvalidCode = value => {
                if (typeof normalizedOptions.onInvalidCode === 'function') {
                    normalizedOptions.onInvalidCode({
                        value,
                        rowData,
                        field,
                        context,
                        lookupInstance,
                        message: normalizedOptions.invalidMessage,
                        cell
                    });
                    return;
                }

                if (typeof normalizedOptions.markInvalid === 'function') {
                    normalizedOptions.markInvalid(cell, normalizedOptions.invalidMessage);
                }
            };

            const clearInvalidCode = () => {
                if (typeof normalizedOptions.clearInvalid === 'function') {
                    normalizedOptions.clearInvalid(cell);
                }
            };

            const setCellLookupDescription = description => {
                const cellElement = cell && cell.getElement && cell.getElement();

                if (!cellElement) return;

                cellElement.dataset.lookupField = field;
            };

            const closeWithLookupItem = (value, item) => {
                const description = item && item[labelField];

                setLookupMetadata(rowData, field, value, description);
                setCellLookupDescription(description);
                clearInvalidCode();
                closeWithSuccess(value);
            };

            const applyMappedRecord = selected => {
                const mapToRow = normalizedOptions.mapToRow;

                if (!mapToRow || !selected) return null;

                const selectedKey = keyField ? selected[keyField] : null;
                const completeRecord = keyField
                    && lookupInstance
                    && typeof lookupInstance.getByKey === 'function'
                    ? lookupInstance.getByKey(selectedKey)
                    : selected;

                if (!completeRecord) {
                    throw new Error(`Lookup record "${selectedKey}" is not available in the record index`);
                }

                const patch = {};

                Object.entries(mapToRow).forEach(([rowField, recordField]) => {
                    patch[rowField] = completeRecord[recordField];
                });

                if (typeof normalizedOptions.applyRecord === 'function') {
                    return normalizedOptions.applyRecord(cell, patch, completeRecord);
                }

                if (row && typeof row.update === 'function') {
                    return row.update(patch);
                }

                return null;
            };

            const loadLookup = async query => {
                if (!lookupInstance || typeof lookupInstance.load !== 'function') {
                    return [];
                }

                return lookupInstance.load({
                    query,
                    rowData,
                    field,
                    context
                });
            };

            const findExactItem = async value => {
                const items = await loadLookup(value);

                return items.find(item => {
                    return normalizeValue(getLookupOptionValue(item, valueField)) === value;
                }) || null;
            };

            const invalidateManualAutoComplete = () => {
                autoCompleteRequestId += 1;
                hasAutoCompleteSuggestion = false;
            };

            const applyManualAutoComplete = async () => {
                if (!normalizedOptions.autoComplete || closed) return;

                const typedValue = getValue();
                const requestId = autoCompleteRequestId + 1;

                autoCompleteRequestId = requestId;
                hasAutoCompleteSuggestion = false;

                if (typedValue.length < normalizedOptions.autoCompleteMinChars) return;

                try {
                    const items = await loadLookup(typedValue);
                    const matchedItem = items.find(item => {
                        return normalizeValue(
                            getLookupOptionValue(item, valueField)
                        ).startsWith(typedValue);
                    });

                    if (closed || requestId !== autoCompleteRequestId) return;
                    if (!matchedItem) return;

                    const matchedValue = normalizeValue(
                        getLookupOptionValue(matchedItem, valueField)
                    );

                    if (!matchedValue || matchedValue === typedValue) return;

                    input.value = matchedValue;
                    input.setSelectionRange(typedValue.length, matchedValue.length);
                    hasAutoCompleteSuggestion = true;
                } catch {
                    // Manual autocomplete is opportunistic; validation still happens on commit.
                }
            };

            const initializeLookupMetadata = async () => {
                if (!normalizedInitialValue) return;

                const metadata = ensureLookupMetadata(rowData, field);

                if (metadata.initial) {
                    setCellLookupDescription(metadata.current && metadata.current.description);
                    return;
                }

                try {
                    const item = await findExactItem(normalizedInitialValue);
                    const description = item && item[labelField];

                    setLookupMetadata(rowData, field, normalizedInitialValue, description || '', {
                        setInitial: true
                    });
                    setCellLookupDescription(description);
                } catch (error) {
                    console.error('Lookup metadata initialization failed', error);
                    setLookupMetadata(rowData, field, normalizedInitialValue, '', {
                        setInitial: true
                    });
                    setCellLookupDescription('');
                }
            };

            const commit = async () => {
                const value = getValue();

                input.value = value;

                if (value === normalizedInitialValue) {
                    if (value === '') {
                        clearInvalidCode();
                        closeWithCancel();
                        return;
                    }

                    try {
                        const item = await findExactItem(value);

                        if (item) {
                            const description = item[labelField];

                            setLookupMetadata(rowData, field, value, description);
                            setCellLookupDescription(description);
                            clearInvalidCode();
                        } else {
                            setLookupMetadata(rowData, field, value, '');
                            setCellLookupDescription('');
                            markInvalidCode(value);
                        }
                    } catch (error) {
                        console.error('Lookup validation failed', error);
                    }

                    closeWithCancel();
                    return;
                }

                if (value === '') {
                    if (normalizedOptions.allowEmpty) {
                        setLookupMetadata(rowData, field, '', '');
                        setCellLookupDescription('');
                        clearInvalidCode();
                        closeWithSuccess('');
                        return;
                    }

                    closeWithCancel();
                    return;
                }

                try {
                    const item = await findExactItem(value);

                    if (item) {
                        closeWithLookupItem(value, item);
                        return;
                    }
                } catch (error) {
                    console.error('Lookup validation failed', error);
                    closeWithCancel();
                    return;
                }

                setLookupMetadata(rowData, field, value, '');
                setCellLookupDescription('');
                markInvalidCode(value);
                closeWithSuccess(value);
            };

            const resolveManualAutoCompleteBeforeCommit = async () => {
                const typedValue = getValue();

                if (!normalizedOptions.autoComplete || !typedValue) return;

                const requestId = autoCompleteRequestId + 1;

                autoCompleteRequestId = requestId;

                if (
                    hasAutoCompleteSuggestion
                    && input.selectionStart < input.selectionEnd
                ) {
                    input.setSelectionRange(input.value.length, input.value.length);
                    hasAutoCompleteSuggestion = false;
                    return;
                }

                hasAutoCompleteSuggestion = false;

                if (typedValue.length < normalizedOptions.autoCompleteMinChars) return;

                try {
                    const items = await loadLookup(typedValue);

                    if (closed || requestId !== autoCompleteRequestId) return;

                    const exactItem = items.find(item => {
                        return normalizeValue(
                            getLookupOptionValue(item, valueField)
                        ) === typedValue;
                    });
                    const matchedItem = exactItem || items.find(item => {
                        return normalizeValue(
                            getLookupOptionValue(item, valueField)
                        ).startsWith(typedValue);
                    });

                    if (!matchedItem) return;

                    const matchedValue = normalizeValue(
                        getLookupOptionValue(matchedItem, valueField)
                    );

                    if (!matchedValue) return;

                    input.value = matchedValue;
                    input.setSelectionRange(matchedValue.length, matchedValue.length);
                } catch {
                    // Commit keeps the existing validation behavior if resolution fails.
                }
            };

            const commitAndNavigate = async direction => {
                if (closed || navigationScheduled || tabCommitInProgress) return;

                const table = cell && cell.getTable && cell.getTable();

                tabCommitInProgress = true;
                await resolveManualAutoCompleteBeforeCommit();
                await commit();

                if (!table || navigationScheduled) return;

                navigationScheduled = true;
                globalThis.setTimeout(() => {
                    if (direction === 'prev' && typeof table.navigatePrev === 'function') {
                        table.navigatePrev();
                        return;
                    }

                    if (direction === 'next' && typeof table.navigateNext === 'function') {
                        table.navigateNext();
                    }
                }, 0);
            };

            input.addEventListener('input', event => {
                if (normalizedOptions.uppercase) {
                    input.value = input.value.toUpperCase();
                }

                const isDeleteInput = typeof event.inputType === 'string'
                    && event.inputType.startsWith('delete');

                if (isDeleteInput || input.value === '') {
                    invalidateManualAutoComplete();
                    return;
                }

                applyManualAutoComplete();
            });
            input.addEventListener('keydown', event => {
                if (event.key === 'Backspace' || event.key === 'Delete') {
                    invalidateManualAutoComplete();
                    return;
                }

                if (event.key === 'Tab') {
                    event.preventDefault();
                    return commitAndNavigate(event.shiftKey ? 'prev' : 'next');
                }

                if (event.key === 'Enter') {
                    return commit();
                }

                if (event.key === 'Escape') {
                    closeWithCancel();
                }
            });
            input.addEventListener('blur', () => {
                if (dialogOpen || tabCommitInProgress) return;

                if (normalizedOptions.validateOnBlur) {
                    return commit();
                }
            });
            button.addEventListener('mousedown', event => {
                event.preventDefault();
            });
            button.addEventListener('click', async event => {
                event.preventDefault();
                event.stopPropagation();

                if (typeof normalizedOptions.onOpenDialog === 'function') {
                    normalizedOptions.onOpenDialog({
                        value: getValue(),
                        rowData,
                        field,
                        context,
                        lookupInstance,
                        success: closeWithSuccess,
                        cancel: closeWithCancel
                    });
                    return;
                }

                if (!normalizedOptions.dialog || typeof normalizedOptions.dialog.open !== 'function') {
                    return;
                }

                dialogOpen = true;

                try {
                    const configuredColumns = normalizedOptions.columns;
                    const visibleColumns = configuredColumns
                        ? configuredColumns.filter(column => {
                            return column && column.field && column.visible === true;
                        })
                        : normalizedOptions.dialogColumns || [
                            { field: valueField, title: 'Code', width: 140 },
                            { field: labelField, title: 'Description' }
                        ];
                    const searchFields = normalizedOptions.search
                        && normalizedOptions.search.fields !== 'visible'
                        && Array.isArray(normalizedOptions.search.fields)
                        ? normalizedOptions.search.fields.filter(searchField => {
                            return visibleColumns.some(column => column.field === searchField);
                        })
                        : visibleColumns.map(column => column.field);
                    const selected = await normalizedOptions.dialog.open({
                        title: normalizedOptions.dialogTitle || 'Search value',
                        columns: visibleColumns,
                        data: await loadLookup(''),
                        valueField,
                        searchFields,
                        searchPlaceholder: normalizedOptions.searchPlaceholder || 'Search...'
                    });

                    if (!selected) return;

                    const selectedValue = selected[valueField];

                    if (selectedValue === null || selectedValue === undefined) return;

                    const mappedEditorField = normalizedOptions.mapToRow
                        && normalizedOptions.mapToRow[field];
                    const committedValue = mappedEditorField
                        ? selected[mappedEditorField]
                        : selectedValue;

                    const appliedRecord = applyMappedRecord(selected);

                    if (normalizedOptions.mapToRow && appliedRecord === null) return;

                    input.value = String(committedValue ?? '');
                    closeWithLookupItem(String(committedValue ?? ''), selected);
                } finally {
                    dialogOpen = false;
                }
            });

            onRendered(() => {
                const cursorPosition = input.value.length;

                input.focus();

                if (normalizedOptions.selectOnFocus) {
                    input.select();
                } else {
                    input.setSelectionRange(cursorPosition, cursorPosition);
                }

                initializeLookupMetadata();
            });

            return container;
        };

        editor._ambEditorType = 'lookup';
        editor._ambSetLookupErrorHandlers = handlers => {
            normalizedOptions.markInvalid = handlers.markInvalid;
            normalizedOptions.clearInvalid = handlers.clearInvalid;
            normalizedOptions.applyRecord = handlers.applyRecord;
        };

        return editor;
}

import { LookupDialog } from '../../ui/lookup-dialog.js';
import { ensureLookupMetadata, setLookupMetadata } from '../lookup-metadata.js';
import { getInitialValue } from './shared.js';

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
            ...options
        };
        const valueField = lookupInstance && lookupInstance.valueField
            ? lookupInstance.valueField
            : normalizedOptions.valueField || 'value';
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

            const getValue = () => {
                const value = normalizedOptions.trim ? input.value.trim() : input.value;

                return normalizedOptions.uppercase ? value.toUpperCase() : value;
            };

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

                return items.find(item => getLookupOptionValue(item, valueField) === value) || null;
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
                        return getLookupOptionValue(item, valueField).startsWith(typedValue);
                    });

                    if (closed || requestId !== autoCompleteRequestId) return;
                    if (!matchedItem) return;

                    const matchedValue = getLookupOptionValue(matchedItem, valueField);

                    if (!matchedValue || matchedValue === typedValue) return;

                    input.value = matchedValue;
                    input.setSelectionRange(typedValue.length, matchedValue.length);
                    hasAutoCompleteSuggestion = true;
                } catch {
                    // Manual autocomplete is opportunistic; validation still happens on commit.
                }
            };

            const initializeLookupMetadata = async () => {
                if (!initialValue) return;

                const metadata = ensureLookupMetadata(rowData, field);

                if (metadata.initial) {
                    setCellLookupDescription(metadata.current && metadata.current.description);
                    return;
                }

                try {
                    const item = await findExactItem(initialValue);
                    const description = item && item[labelField];

                    setLookupMetadata(rowData, field, initialValue, description || '', {
                        setInitial: true
                    });
                    setCellLookupDescription(description);
                } catch {
                    setLookupMetadata(rowData, field, initialValue, '', {
                        setInitial: true
                    });
                    setCellLookupDescription('');
                }
            };

            const commit = async () => {
                const value = getValue();

                input.value = value;

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
                } catch {
                    // Invalid lookup values are handled by cancelling below.
                }

                setLookupMetadata(rowData, field, value, '');
                setCellLookupDescription('');
                markInvalidCode(value);
                closeWithSuccess(value);
            };

            input.addEventListener('input', () => {
                if (normalizedOptions.uppercase) {
                    input.value = input.value.toUpperCase();
                }

                applyManualAutoComplete();
            });
            input.addEventListener('keydown', event => {
                if (
                    event.key === 'Tab'
                    && normalizedOptions.autoCompleteOnTab
                    && hasAutoCompleteSuggestion
                    && input.selectionStart < input.selectionEnd
                ) {
                    event.preventDefault();
                    input.setSelectionRange(input.value.length, input.value.length);
                    hasAutoCompleteSuggestion = false;
                    return;
                }

                if (event.key === 'Enter') {
                    commit();
                    return;
                }

                if (event.key === 'Escape') {
                    closeWithCancel();
                }
            });
            input.addEventListener('blur', () => {
                if (dialogOpen) return;

                if (normalizedOptions.validateOnBlur) {
                    commit();
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
                    const selected = await normalizedOptions.dialog.open({
                        title: normalizedOptions.dialogTitle || 'Search value',
                        columns: normalizedOptions.dialogColumns || [
                            { field: valueField, title: 'Code', width: 140 },
                            { field: labelField, title: 'Description' }
                        ],
                        data: await loadLookup(''),
                        valueField,
                        searchPlaceholder: normalizedOptions.searchPlaceholder || 'Search...'
                    });

                    if (!selected) return;

                    const selectedValue = selected[valueField];

                    if (selectedValue === null || selectedValue === undefined) return;

                    input.value = String(selectedValue);
                    closeWithLookupItem(String(selectedValue), selected);
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
        };

        return editor;
}

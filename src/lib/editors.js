import TomSelect from 'tom-select';
import Datepicker from 'vanillajs-datepicker/Datepicker';
import { parsers } from './parsers.js';
import { ensureLookupMetadata, setLookupMetadata } from './lookup-metadata.js';

const getInitialValue = cell => {
    const value = cell.getValue();

    if (value === null || value === undefined) return '';

    return String(value);
};

const focusInput = (input, onRendered, options = {}) => {
    onRendered(() => {
        const cursorPosition = input.value.length;

        input.focus();

        if (options.selectOnFocus === true) {
            input.select();
            return;
        }

        input.setSelectionRange(cursorPosition, cursorPosition);
    });
};

const normalizeIntegerInput = (value, options = {}) => {
    const allowNegative = options.allowNegative === true;
    let normalizedValue = '';

    Array.from(String(value)).forEach(character => {
        if (/\d/.test(character)) {
            normalizedValue += character;
            return;
        }

        if (allowNegative && character === '-' && normalizedValue === '') {
            normalizedValue = '-';
        }
    });

    return normalizedValue;
};

const normalizeDecimalInput = (value, options = {}) => {
    const decimalSeparator = options.decimalSeparator || ',';
    const shouldNormalizeSeparator = options.normalizeDotToComma !== false;
    const allowNegative = options.allowNegative === true;
    let normalizedValue = '';
    let hasSeparator = false;
    let integerCount = 0;
    let decimalCount = 0;

    Array.from(String(value)).forEach(character => {
        let nextCharacter = character;

        if (shouldNormalizeSeparator && decimalSeparator === ',' && character === '.') {
            nextCharacter = ',';
        }

        if (shouldNormalizeSeparator && decimalSeparator === '.' && character === ',') {
            nextCharacter = '.';
        }

        if (allowNegative && nextCharacter === '-' && normalizedValue === '') {
            normalizedValue = '-';
            return;
        }

        if (/\d/.test(nextCharacter)) {
            if (hasSeparator) {
                if (options.decimalDigits !== undefined && decimalCount >= options.decimalDigits) {
                    return;
                }

                decimalCount += 1;
                normalizedValue += nextCharacter;
                return;
            }

            if (options.integerDigits !== undefined && integerCount >= options.integerDigits) {
                return;
            }

            integerCount += 1;
            normalizedValue += nextCharacter;
            return;
        }

        if (nextCharacter === decimalSeparator && !hasSeparator) {
            hasSeparator = true;
            normalizedValue += nextCharacter;
        }
    });

    return normalizedValue;
};

const parseDecimalValue = (value, decimalSeparator) => {
    return Number(String(value).replace(decimalSeparator, '.'));
};

const getDateFormatParts = format => {
    if (format === 'dd/mm/yyyy') {
        return {
            separator: '/',
            groups: [2, 2, 4]
        };
    }

    if (format === 'yyyy-mm-dd') {
        return {
            separator: '-',
            groups: [4, 2, 2]
        };
    }

    return null;
};

const normalizeDateInput = (value, format) => {
    const formatParts = getDateFormatParts(format);

    if (!formatParts) return String(value);

    const digits = String(value).replace(/\D/g, '').slice(0, 8);
    const groups = [];
    let offset = 0;

    formatParts.groups.forEach(groupLength => {
        const group = digits.slice(offset, offset + groupLength);

        if (group) {
            groups.push(group);
        }

        offset += groupLength;
    });

    return groups.join(formatParts.separator).slice(0, 10);
};

const countDigits = value => {
    return (String(value).match(/\d/g) || []).length;
};

const getDateCursorPosition = (normalizedValue, digitCount) => {
    if (digitCount <= 0) return 0;

    let currentDigitCount = 0;

    for (let index = 0; index < normalizedValue.length; index += 1) {
        if (/\d/.test(normalizedValue[index])) {
            currentDigitCount += 1;
        }

        if (currentDigitCount >= digitCount) {
            return index + 1;
        }
    }

    return normalizedValue.length;
};

const createSelectOption = ({ value, label }) => {
    const option = document.createElement('option');

    option.value = value;
    option.textContent = label;

    return option;
};

const normalizeSelectOption = (option, options) => {
    if (typeof option === 'string') {
        return {
            value: option,
            label: option
        };
    }

    const value = option && option[options.valueField];
    const label = option && option[options.labelField];

    return {
        value: value === null || value === undefined ? '' : String(value),
        label: label === null || label === undefined ? String(value ?? '') : String(label)
    };
};

const getLookupOptionValue = (item, valueField) => {
    const value = item && item[valueField];

    return value === null || value === undefined ? '' : String(value);
};

const createLookupOption = (value, label, valueField, labelField) => {
    return {
        [valueField]: value,
        [labelField]: label
    };
};

const toCssSize = value => {
    if (typeof value === 'number') return `${value}px`;
    if (value === null || value === undefined || value === '') return '';

    return String(value);
};

export const editors = {
    text(options = {}) {
        return (cell, onRendered, success, cancel) => {
            const input = document.createElement('input');

            input.type = 'text';
            input.value = getInitialValue(cell);

            if (options.maxLength !== undefined) {
                input.maxLength = options.maxLength;
            }

            const normalizeInputValue = () => {
                if (options.uppercase) {
                    input.value = input.value.toUpperCase();
                }

                if (options.lowercase) {
                    input.value = input.value.toLowerCase();
                }
            };

            const getValue = () => {
                return options.trim ? input.value.trim() : input.value;
            };

            input.addEventListener('input', normalizeInputValue);
            input.addEventListener('keydown', event => {
                if (event.key === 'Enter') {
                    success(getValue());
                    return;
                }

                if (event.key === 'Escape') {
                    cancel();
                }
            });
            input.addEventListener('blur', () => {
                success(getValue());
            });

            focusInput(input, onRendered, {
                selectOnFocus: options.selectOnFocus === true
            });
            return input;
        };
    },

    select(options = {}) {
        const normalizedOptions = {
            options: [],
            allowEmpty: true,
            emptyLabel: '',
            valueField: 'value',
            labelField: 'label',
            ...options
        };

        return (cell, onRendered, success, cancel) => {
            const select = document.createElement('select');

            if (normalizedOptions.allowEmpty) {
                select.appendChild(createSelectOption({
                    value: '',
                    label: normalizedOptions.emptyLabel
                }));
            }

            normalizedOptions.options.forEach(option => {
                select.appendChild(createSelectOption(
                    normalizeSelectOption(option, normalizedOptions)
                ));
            });

            select.value = getInitialValue(cell);

            const commit = () => {
                success(select.value);
            };

            select.addEventListener('change', commit);
            select.addEventListener('blur', commit);
            select.addEventListener('keydown', event => {
                if (event.key === 'Escape') {
                    cancel();
                }
            });

            onRendered(() => {
                select.focus();
            });
            return select;
        };
    },

    autocomplete(lookupInstance, options = {}) {
        const normalizedOptions = {
            allowEmpty: true,
            maxOptions: 20,
            dropdownWidth: 420,
            showCodeOnlyInEditor: true,
            ...options
        };
        const valueField = lookupInstance && lookupInstance.valueField
            ? lookupInstance.valueField
            : normalizedOptions.valueField || 'value';
        const labelField = lookupInstance && lookupInstance.labelField
            ? lookupInstance.labelField
            : normalizedOptions.labelField || 'label';
        const codeField = normalizedOptions.codeField || valueField;
        const descriptionField = normalizedOptions.descriptionField || labelField;
        const renderDefaultOption = (item, escape) => `
            <div class="amb-lookup-option">
                <span class="amb-lookup-option__code">${escape(item[codeField] ?? '')}</span>
                <span class="amb-lookup-option__description">${escape(item[descriptionField] ?? '')}</span>
            </div>
        `;
        const renderDefaultItem = (item, escape) => {
            const code = escape(item[codeField] ?? '');
            const description = escape(item[descriptionField] ?? '');

            if (normalizedOptions.showCodeOnlyInEditor) {
                return `<div class="amb-lookup-item">${code}</div>`;
            }

            return `
                <div class="amb-lookup-option">
                    <span class="amb-lookup-option__code">${code}</span>
                    <span class="amb-lookup-option__description">${description}</span>
                </div>
            `;
        };

        return (cell, onRendered, success, cancel) => {
            const select = document.createElement('select');
            const initialValue = getInitialValue(cell);
            const row = cell.getRow && cell.getRow();
            const rowData = row && row.getData ? row.getData() : undefined;
            const field = cell.getField && cell.getField();
            let tomSelect = null;
            let closed = false;
            let initializing = false;
            let blurTimeout = null;

            const destroyTomSelect = () => {
                if (blurTimeout) {
                    window.clearTimeout(blurTimeout);
                    blurTimeout = null;
                }

                if (tomSelect) {
                    tomSelect.destroy();
                    tomSelect = null;
                }
            };

            const closeWithSuccess = value => {
                if (closed) return;

                closed = true;
                success(value);
                destroyTomSelect();
            };

            const closeWithCancel = () => {
                if (closed) return;

                closed = true;
                cancel();
                destroyTomSelect();
            };

            const loadLookup = async query => {
                if (!lookupInstance || typeof lookupInstance.load !== 'function') {
                    return [];
                }

                return lookupInstance.load({
                    query,
                    rowData,
                    field,
                    context: normalizedOptions.context || {}
                });
            };

            const setValueSilently = value => {
                initializing = true;

                try {
                    tomSelect.setValue(value, true);
                } finally {
                    initializing = false;
                }
            };

            const addRawOption = value => {
                tomSelect.addOption(createLookupOption(value, value, valueField, labelField));
                setValueSilently(value);
            };

            if (normalizedOptions.allowEmpty) {
                select.appendChild(createSelectOption({
                    value: '',
                    label: ''
                }));
            }

            const loadInitialOptionsAndValue = async () => {
                if (!tomSelect || closed) return;

                try {
                    const items = await loadLookup('');

                    if (closed || !tomSelect) return;

                    tomSelect.addOptions(items);

                    if (initialValue) {
                        const matchedItem = items.find(item => getLookupOptionValue(item, valueField) === initialValue);

                        if (!matchedItem) {
                            tomSelect.addOption(createLookupOption(
                                initialValue,
                                initialValue,
                                valueField,
                                labelField
                            ));
                        }

                        setValueSilently(initialValue);
                    }

                    tomSelect.refreshOptions(false);
                    tomSelect.open();
                    tomSelect.focus();
                } catch {
                    if (!closed && tomSelect && initialValue) {
                        addRawOption(initialValue);
                        tomSelect.refreshOptions(false);
                        tomSelect.open();
                        tomSelect.focus();
                    }
                }
            };

            onRendered(() => {
                tomSelect = new TomSelect(select, {
                    valueField,
                    labelField,
                    searchField: [labelField, valueField],
                    placeholder: normalizedOptions.placeholder,
                    maxOptions: normalizedOptions.maxOptions,
                    create: false,
                    persist: false,
                    closeAfterSelect: true,
                    openOnFocus: true,
                    dropdownParent: 'body',
                    load: async (query, callback) => {
                        try {
                            callback(await loadLookup(query));
                        } catch {
                            callback([]);
                        }
                    },
                    render: {
                        option: normalizedOptions.renderOption || renderDefaultOption,
                        item: normalizedOptions.renderItem || renderDefaultItem
                    },
                    onChange: value => {
                        if (initializing || closed) return;

                        if (value === '' && normalizedOptions.allowEmpty) {
                            closeWithSuccess('');
                            return;
                        }

                        if (value !== '') {
                            closeWithSuccess(value);
                        }
                    },
                    onBlur: () => {
                        blurTimeout = window.setTimeout(() => {
                            if (closed) return;

                            const value = tomSelect ? tomSelect.getValue() : '';

                            if (value === '') {
                                closeWithCancel();
                            }
                        }, 200);
                    }
                });

                if (normalizedOptions.dropdownWidth && tomSelect.dropdown) {
                    tomSelect.dropdown.style.width = `${normalizedOptions.dropdownWidth}px`;
                }

                tomSelect.control_input.addEventListener('keydown', event => {
                    if (event.key === 'Escape') {
                        closeWithCancel();
                    }
                });
                loadInitialOptionsAndValue();
            });

            select.addEventListener('keydown', event => {
                if (event.key === 'Escape') {
                    closeWithCancel();
                }
            });

            return select;
        };
    },

    lookup(lookupInstance, options = {}) {
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
    },

    checkbox(options = {}) {
        const normalizedOptions = {
            checkedValue: true,
            uncheckedValue: false,
            checkedLabel: 'Yes',
            uncheckedLabel: 'No',
            ...options
        };

        return (cell, onRendered, success, cancel) => {
            const container = document.createElement('label');
            const input = document.createElement('input');
            const label = document.createElement('span');
            let closed = false;

            container.className = 'amb-checkbox-editor';
            input.className = 'amb-checkbox-editor__input';
            input.type = 'checkbox';
            input.checked = cell.getValue() === normalizedOptions.checkedValue;
            label.className = 'amb-checkbox-editor__label';

            const getValue = () => {
                return input.checked
                    ? normalizedOptions.checkedValue
                    : normalizedOptions.uncheckedValue;
            };

            const updateLabel = () => {
                label.textContent = input.checked
                    ? normalizedOptions.checkedLabel
                    : normalizedOptions.uncheckedLabel;
            };

            const closeWithSuccess = () => {
                if (closed) return;

                closed = true;
                success(getValue());
            };

            const closeWithCancel = () => {
                if (closed) return;

                closed = true;
                cancel();
            };

            updateLabel();

            input.addEventListener('change', () => {
                updateLabel();
                closeWithSuccess();
            });
            input.addEventListener('keydown', event => {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    closeWithSuccess();
                    return;
                }

                if (event.key === 'Escape') {
                    event.preventDefault();
                    closeWithCancel();
                }
            });
            input.addEventListener('blur', closeWithSuccess);

            container.append(input, label);

            onRendered(() => {
                input.focus();
            });

            return container;
        };
    },

    largeText(options = {}) {
        const normalizedOptions = {
            title: 'Edit text',
            rows: 10,
            placeholder: '',
            saveText: 'Save',
            cancelText: 'Cancel',
            width: 640,
            maxWidth: '90vw',
            height: 'auto',
            textareaHeight: 260,
            horizontalScroll: false,
            resize: 'vertical',
            ...options
        };

        return (cell, onRendered, success, cancel) => {
            const placeholder = document.createElement('span');
            const overlay = document.createElement('div');
            const panel = document.createElement('div');
            const title = document.createElement('h2');
            const textarea = document.createElement('textarea');
            const actions = document.createElement('div');
            const cancelButton = document.createElement('button');
            const saveButton = document.createElement('button');
            let closed = false;

            placeholder.textContent = '';
            overlay.className = 'amb-large-text-editor';
            panel.className = 'amb-large-text-editor__panel';
            title.className = 'amb-large-text-editor__title';
            textarea.className = 'amb-large-text-editor__textarea';
            actions.className = 'amb-large-text-editor__actions';
            cancelButton.className = 'amb-large-text-editor__button';
            saveButton.className = 'amb-large-text-editor__button amb-large-text-editor__button--primary';

            title.textContent = normalizedOptions.title;
            textarea.value = getInitialValue(cell);
            textarea.rows = normalizedOptions.rows;
            textarea.placeholder = normalizedOptions.placeholder;
            cancelButton.type = 'button';
            cancelButton.textContent = normalizedOptions.cancelText;
            saveButton.type = 'button';
            saveButton.textContent = normalizedOptions.saveText;

            panel.style.width = toCssSize(normalizedOptions.width);
            panel.style.maxWidth = toCssSize(normalizedOptions.maxWidth);

            if (normalizedOptions.height !== 'auto') {
                panel.style.height = toCssSize(normalizedOptions.height);
            }

            textarea.style.height = toCssSize(normalizedOptions.textareaHeight);
            textarea.style.resize = normalizedOptions.resize;

            if (normalizedOptions.horizontalScroll) {
                textarea.style.overflowX = 'auto';
                textarea.style.whiteSpace = 'pre';
                textarea.wrap = 'off';
            } else {
                textarea.style.overflowX = 'hidden';
                textarea.style.whiteSpace = 'pre-wrap';
                textarea.wrap = 'soft';
            }

            actions.append(cancelButton, saveButton);
            panel.append(title, textarea, actions);
            overlay.appendChild(panel);

            const destroyPopup = () => {
                overlay.remove();
            };

            const closeWithSuccess = () => {
                if (closed) return;

                closed = true;
                success(textarea.value);
                destroyPopup();
            };

            const closeWithCancel = () => {
                if (closed) return;

                closed = true;
                cancel();
                destroyPopup();
            };

            cancelButton.addEventListener('click', closeWithCancel);
            saveButton.addEventListener('click', closeWithSuccess);
            overlay.addEventListener('mousedown', event => {
                if (event.target === overlay) {
                    event.preventDefault();
                    closeWithCancel();
                }
            });
            textarea.addEventListener('keydown', event => {
                if (event.key === 'Escape') {
                    event.preventDefault();
                    closeWithCancel();
                    return;
                }

                if (event.key === 'Enter' && event.ctrlKey) {
                    event.preventDefault();
                    closeWithSuccess();
                }
            });

            document.body.appendChild(overlay);

            onRendered(() => {
                textarea.focus();
                textarea.setSelectionRange(textarea.value.length, textarea.value.length);
            });

            return placeholder;
        };
    },

    integer(options = {}) {
        const normalizedOptions = {
            allowEmpty: true,
            allowNegative: false,
            ...options
        };

        return (cell, onRendered, success, cancel) => {
            const input = document.createElement('input');

            input.type = 'text';
            input.inputMode = 'numeric';
            input.value = normalizeIntegerInput(getInitialValue(cell), normalizedOptions);

            if (normalizedOptions.maxLength !== undefined) {
                input.maxLength = normalizedOptions.maxLength;
            }

            const sanitizeInput = () => {
                const previousValue = input.value;
                const previousSelectionStart = input.selectionStart || 0;
                const beforeCaret = previousValue.slice(0, previousSelectionStart);
                const normalizedBeforeCaret = normalizeIntegerInput(beforeCaret, normalizedOptions);
                const normalizedValue = normalizeIntegerInput(previousValue, normalizedOptions);

                input.value = normalizedValue;
                input.setSelectionRange(normalizedBeforeCaret.length, normalizedBeforeCaret.length);
            };

            const commit = () => {
                const value = input.value;

                if (value === '' || value === '-') {
                    if (normalizedOptions.allowEmpty) {
                        success('');
                        return;
                    }

                    cancel();
                    return;
                }

                const numberValue = Number(value);

                if (!Number.isFinite(numberValue)) {
                    cancel();
                    return;
                }

                if (normalizedOptions.min !== undefined && numberValue < normalizedOptions.min) {
                    cancel();
                    return;
                }

                if (normalizedOptions.max !== undefined && numberValue > normalizedOptions.max) {
                    cancel();
                    return;
                }

                success(numberValue);
            };

            input.addEventListener('input', sanitizeInput);
            input.addEventListener('keydown', event => {
                if (event.key === 'Enter') {
                    commit();
                    return;
                }

                if (event.key === 'Escape') {
                    cancel();
                }
            });
            input.addEventListener('blur', commit);

            focusInput(input, onRendered, {
                selectOnFocus: options.selectOnFocus === true
            });
            return input;
        };
    },

    decimal(options = {}) {
        const normalizedOptions = {
            decimalDigits: 2,
            allowEmpty: true,
            allowNegative: false,
            decimalSeparator: ',',
            normalizeDotToComma: true,
            ...options
        };

        return (cell, onRendered, success, cancel) => {
            const input = document.createElement('input');

            input.type = 'text';
            input.inputMode = 'decimal';
            input.value = normalizeDecimalInput(
                normalizedOptions.decimalSeparator === ','
                    ? getInitialValue(cell).replace('.', ',')
                    : getInitialValue(cell),
                normalizedOptions
            );

            const sanitizeInput = () => {
                const previousValue = input.value;
                const previousSelectionStart = input.selectionStart || 0;
                const beforeCaret = previousValue.slice(0, previousSelectionStart);
                const normalizedBeforeCaret = normalizeDecimalInput(beforeCaret, normalizedOptions);
                const normalizedValue = normalizeDecimalInput(previousValue, normalizedOptions);

                input.value = normalizedValue;
                input.setSelectionRange(normalizedBeforeCaret.length, normalizedBeforeCaret.length);
            };

            const commit = () => {
                const value = input.value;
                const emptyValues = [
                    '',
                    '-',
                    normalizedOptions.decimalSeparator,
                    `-${normalizedOptions.decimalSeparator}`
                ];

                if (emptyValues.includes(value)) {
                    if (normalizedOptions.allowEmpty) {
                        success('');
                        return;
                    }

                    cancel();
                    return;
                }

                const numberValue = parseDecimalValue(value, normalizedOptions.decimalSeparator);

                if (!Number.isFinite(numberValue)) {
                    cancel();
                    return;
                }

                if (normalizedOptions.min !== undefined && numberValue < normalizedOptions.min) {
                    cancel();
                    return;
                }

                if (normalizedOptions.max !== undefined && numberValue > normalizedOptions.max) {
                    cancel();
                    return;
                }

                success(numberValue);
            };

            input.addEventListener('input', sanitizeInput);
            input.addEventListener('keydown', event => {
                if (event.key === 'Enter') {
                    commit();
                    return;
                }

                if (event.key === 'Escape') {
                    cancel();
                }
            });
            input.addEventListener('blur', commit);

            focusInput(input, onRendered, {
                selectOnFocus: options.selectOnFocus === true
            });
            return input;
        };
    },

    date(options = {}) {
        const normalizedOptions = {
            format: 'dd/mm/yyyy',
            allowEmpty: true,
            picker: false,
            selectOnFocus: false,
            ...options
        };

        return (cell, onRendered, success, cancel) => {
            const input = document.createElement('input');
            const initialValue = getInitialValue(cell);
            const initialParsedValue = parsers.date({
                inputFormat: normalizedOptions.format,
                outputFormat: normalizedOptions.format
            }).parse(initialValue);

            input.type = 'text';
            input.inputMode = 'numeric';
            input.value = initialValue === ''
                ? ''
                : initialParsedValue === null
                    ? initialValue
                    : initialParsedValue;
            input.maxLength = 10;

            if (normalizedOptions.picker) {
                let datepicker = null;
                let closed = false;
                let blurTimeout = null;

                input.className = 'amb-date-editor';

                const destroyDatepicker = () => {
                    if (blurTimeout) {
                        window.clearTimeout(blurTimeout);
                        blurTimeout = null;
                    }

                    if (datepicker) {
                        datepicker.destroy();
                        datepicker = null;
                    }
                };

                const closeWithSuccess = value => {
                    if (closed) return;

                    closed = true;
                    destroyDatepicker();
                    success(value);
                };

                const closeWithCancel = () => {
                    if (closed) return;

                    closed = true;
                    destroyDatepicker();
                    cancel();
                };

                const commit = () => {
                    const value = input.value;

                    if (value === '') {
                        if (normalizedOptions.allowEmpty) {
                            closeWithSuccess('');
                            return;
                        }

                        closeWithCancel();
                        return;
                    }

                    const parsedValue = parsers.date({
                        inputFormat: normalizedOptions.format,
                        outputFormat: normalizedOptions.format,
                        allowEmpty: normalizedOptions.allowEmpty
                    }).parse(value);

                    if (parsedValue === null) {
                        closeWithCancel();
                        return;
                    }

                    closeWithSuccess(parsedValue);
                };

                const sanitizeInput = () => {
                    const previousValue = input.value;
                    const previousSelectionStart = input.selectionStart || 0;
                    const digitsBeforeCaret = countDigits(previousValue.slice(0, previousSelectionStart));
                    const normalizedValue = normalizeDateInput(previousValue, normalizedOptions.format);

                    input.value = normalizedValue;
                    input.setSelectionRange(
                        getDateCursorPosition(normalizedValue, digitsBeforeCaret),
                        getDateCursorPosition(normalizedValue, digitsBeforeCaret)
                    );
                };

                input.addEventListener('input', sanitizeInput);
                input.addEventListener('changeDate', event => {
                    const date = event.detail && event.detail.date;

                    if (!date) return;

                    const formattedValue = Datepicker.formatDate(date, normalizedOptions.format);

                    input.value = formattedValue;
                    closeWithSuccess(formattedValue);
                });
                input.addEventListener('keydown', event => {
                    if (event.key === 'Enter') {
                        commit();
                        return;
                    }

                    if (event.key === 'Escape') {
                        closeWithCancel();
                    }
                });
                input.addEventListener('blur', () => {
                    blurTimeout = window.setTimeout(() => {
                        if (closed) return;

                        const activeElement = document.activeElement;
                        const isPickerFocused = activeElement
                            && activeElement.closest
                            && activeElement.closest('.datepicker');

                        if (isPickerFocused || (datepicker && datepicker.active)) {
                            return;
                        }

                        commit();
                    }, 300);
                });

                onRendered(() => {
                    datepicker = new Datepicker(input, {
                        autohide: true,
                        format: normalizedOptions.format,
                        container: document.body
                    });
                    input.focus();

                    if (normalizedOptions.selectOnFocus) {
                        input.select();
                    } else {
                        input.setSelectionRange(input.value.length, input.value.length);
                    }

                    datepicker.show();
                });

                return input;
            }

            const sanitizeInput = () => {
                const previousValue = input.value;
                const previousSelectionStart = input.selectionStart || 0;
                const digitsBeforeCaret = countDigits(previousValue.slice(0, previousSelectionStart));
                const normalizedValue = normalizeDateInput(previousValue, normalizedOptions.format);

                input.value = normalizedValue;
                input.setSelectionRange(
                    getDateCursorPosition(normalizedValue, digitsBeforeCaret),
                    getDateCursorPosition(normalizedValue, digitsBeforeCaret)
                );
            };

            const commit = () => {
                const value = input.value;

                if (value === '') {
                    if (normalizedOptions.allowEmpty) {
                        success('');
                        return;
                    }

                    cancel();
                    return;
                }

                const parsedValue = parsers.date({
                    inputFormat: normalizedOptions.format,
                    outputFormat: normalizedOptions.format,
                    allowEmpty: normalizedOptions.allowEmpty
                }).parse(value);

                if (parsedValue === null) {
                    cancel();
                    return;
                }

                success(parsedValue);
            };

            input.addEventListener('input', sanitizeInput);
            input.addEventListener('keydown', event => {
                if (event.key === 'Enter') {
                    commit();
                    return;
                }

                if (event.key === 'Escape') {
                    cancel();
                }
            });
            input.addEventListener('blur', commit);

            focusInput(input, onRendered, {
                selectOnFocus: normalizedOptions.selectOnFocus
            });
            return input;
        };
    }
};

export { normalizeDecimalInput, normalizeDateInput, parseDecimalValue };

import TomSelect from 'tom-select';
import { parsers } from './parsers.js';

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
                selectOnFocus: options.selectOnFocus !== false
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
            selectOnFocus: true,
            validateOnBlur: true,
            ...options
        };
        const valueField = lookupInstance && lookupInstance.valueField
            ? lookupInstance.valueField
            : normalizedOptions.valueField || 'value';
        const labelField = lookupInstance && lookupInstance.labelField
            ? lookupInstance.labelField
            : normalizedOptions.labelField || 'label';

        return (cell, onRendered, success, cancel) => {
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

            const resolveTitle = async value => {
                if (!value) return;

                try {
                    const item = await findExactItem(value);
                    const label = item && item[labelField];

                    if (!closed && label !== null && label !== undefined) {
                        input.title = String(label);
                    }
                } catch {
                    input.title = '';
                }
            };

            const commit = async () => {
                const value = getValue();

                input.value = value;

                if (value === '') {
                    if (normalizedOptions.allowEmpty) {
                        closeWithSuccess('');
                        return;
                    }

                    closeWithCancel();
                    return;
                }

                try {
                    const item = await findExactItem(value);

                    if (item) {
                        closeWithSuccess(value);
                        return;
                    }
                } catch {
                    // Invalid lookup values are handled by cancelling below.
                }

                closeWithCancel();
            };

            input.addEventListener('input', () => {
                if (normalizedOptions.uppercase) {
                    input.value = input.value.toUpperCase();
                }
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
                    closeWithSuccess(String(selectedValue));
                } finally {
                    dialogOpen = false;
                }
            });

            onRendered(() => {
                input.focus();

                if (normalizedOptions.selectOnFocus) {
                    input.select();
                }

                resolveTitle(getValue());
            });

            return container;
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

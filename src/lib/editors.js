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

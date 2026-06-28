import { focusInput, getInitialValue } from './shared.js';

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

export const normalizeDecimalInput = (value, options = {}) => {
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

export const parseDecimalValue = (value, decimalSeparator) => {
    return Number(String(value).replace(decimalSeparator, '.'));
};

    /**
     * Integer editor. Saves a number, or an empty string when allowed.
     *
     * @param {object} [options] - Integer editor options.
     * @param {boolean} [options.allowEmpty=true] - Save an empty string for empty input.
     * @param {*} [options.emptyValue] - Optional value saved when the input is left empty, such as `0`, `null`, or `''`; when omitted, defaults keep the current empty behavior.
     * @param {boolean} [options.allowNegative=false] - Allow a leading minus sign.
     * @param {number} [options.min] - Minimum accepted value.
     * @param {number} [options.max] - Maximum accepted value.
     * @param {number} [options.maxLength] - Native input maximum length.
     * @param {boolean} [options.selectOnFocus=false] - Select the full value when editing starts.
     * @returns {Function} Tabulator editor.
     */
export function integer(options = {}) {
        const normalizedOptions = {
            allowEmpty: true,
            allowNegative: false,
            ...options
        };

        const editor = (cell, onRendered, success, cancel) => {
            const input = document.createElement('input');

            input.type = 'text';
            input.className = 'amb-cell-editor amb-cell-editor--number';
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
                    if (normalizedOptions.emptyValue !== undefined) {
                        success(normalizedOptions.emptyValue);
                        return;
                    }

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

        editor._ambEditorType = 'integer';

        return editor;
}

    /**
     * Decimal editor. Saves a number, or an empty string when allowed.
     *
     * @param {object} [options] - Decimal editor options.
     * @param {number} [options.decimalDigits=2] - Maximum digits after the separator.
     * @param {number} [options.integerDigits] - Maximum digits before the separator.
     * @param {boolean} [options.allowEmpty=true] - Save an empty string for empty input.
     * @param {*} [options.emptyValue] - Optional value saved when the input is left empty, such as `0`, `null`, or `''`; when omitted, defaults keep the current empty behavior.
     * @param {boolean} [options.allowNegative=false] - Allow a leading minus sign.
     * @param {string} [options.decimalSeparator=','] - Decimal separator shown while editing.
     * @param {boolean} [options.normalizeDotToComma=true] - Convert the alternate separator while typing.
     * @param {number} [options.min] - Minimum accepted value.
     * @param {number} [options.max] - Maximum accepted value.
     * @param {boolean} [options.selectOnFocus=false] - Select the full value when editing starts.
     * @returns {Function} Tabulator editor.
     */
export function decimal(options = {}) {
        const normalizedOptions = {
            decimalDigits: 2,
            allowEmpty: true,
            allowNegative: false,
            decimalSeparator: ',',
            normalizeDotToComma: true,
            ...options
        };

        const editor = (cell, onRendered, success, cancel) => {
            const input = document.createElement('input');

            input.type = 'text';
            input.className = 'amb-cell-editor amb-cell-editor--number';
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
                    if (normalizedOptions.emptyValue !== undefined) {
                        success(normalizedOptions.emptyValue);
                        return;
                    }

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

        editor._ambEditorType = 'decimal';

        return editor;
}

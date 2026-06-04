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

const normalizeDecimalInput = (value, options = {}) => {
    const decimalSeparator = options.decimalSeparator || ',';
    const shouldNormalizeSeparator = options.normalizeDotToComma !== false;
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
            ...options
        };

        return (cell, onRendered, success, cancel) => {
            const input = document.createElement('input');

            input.type = 'text';
            input.inputMode = 'numeric';
            input.value = getInitialValue(cell).replace(/\D/g, '');

            if (normalizedOptions.maxLength !== undefined) {
                input.maxLength = normalizedOptions.maxLength;
            }

            const sanitizeInput = () => {
                input.value = input.value.replace(/\D/g, '');
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

                if (value === '') {
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
    }
};

export { normalizeDecimalInput, parseDecimalValue };

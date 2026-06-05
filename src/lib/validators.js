import { parsers } from './parsers.js';

const isEmptyValue = value => {
    return value === null
        || value === undefined
        || (typeof value === 'string' && value.trim() === '');
};

const normalizeDecimalValidationValue = (value, decimalSeparator) => {
    return String(value).trim().replace(decimalSeparator, '.');
};

const getDecimalParts = normalizedValue => {
    const unsignedValue = normalizedValue.startsWith('-')
        ? normalizedValue.slice(1)
        : normalizedValue;
    const [integerPart = '', decimalPart = ''] = unsignedValue.split('.');

    return {
        integerPart,
        decimalPart
    };
};

export const validators = {
    required(message) {
        return {
            message,
            validate: value => {
                return !isEmptyValue(value);
            }
        };
    },

    pattern(regex, message) {
        return {
            message,
            validate: value => {
                if (isEmptyValue(value)) return true;

                return regex.test(String(value));
            }
        };
    },

    email(message = 'Invalid email address') {
        return {
            message,
            validate: value => {
                if (isEmptyValue(value)) return true;

                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value));
            }
        };
    },

    number(message = 'Value must be a number') {
        return {
            message,
            validate: value => {
                if (isEmptyValue(value)) return true;

                return Number.isFinite(Number(value));
            }
        };
    },

    integer(message = 'Value must be an integer') {
        return {
            message,
            validate: value => {
                if (isEmptyValue(value)) return true;

                return Number.isInteger(Number(value));
            }
        };
    },

    decimal(options = {}, message = 'Invalid decimal value') {
        const normalizedOptions = {
            allowNegative: false,
            decimalSeparator: ',',
            ...options
        };

        return {
            message,
            validate: value => {
                if (isEmptyValue(value)) return true;

                const normalizedValue = normalizeDecimalValidationValue(
                    value,
                    normalizedOptions.decimalSeparator
                );
                const numberValue = Number(normalizedValue);

                if (!Number.isFinite(numberValue)) return false;
                if (!normalizedOptions.allowNegative && numberValue < 0) return false;

                const { integerPart, decimalPart } = getDecimalParts(normalizedValue);

                if (
                    normalizedOptions.integerDigits !== undefined
                    && integerPart.length > normalizedOptions.integerDigits
                ) {
                    return false;
                }

                if (
                    normalizedOptions.decimalDigits !== undefined
                    && decimalPart.length > normalizedOptions.decimalDigits
                ) {
                    return false;
                }

                return true;
            }
        };
    },

    date(options = {}, message = 'Invalid date') {
        const normalizedOptions = {
            format: 'dd/mm/yyyy',
            allowEmpty: true,
            ...options
        };
        const parser = parsers.date({
            inputFormat: normalizedOptions.format,
            outputFormat: 'Date',
            allowEmpty: normalizedOptions.allowEmpty
        });

        return {
            message,
            validate: value => {
                if (isEmptyValue(value) && normalizedOptions.allowEmpty) return true;

                const parsedValue = parser.parse(value);

                return parsedValue instanceof Date
                    && Number.isFinite(parsedValue.getTime());
            }
        };
    },

    range(min, max, message) {
        return {
            message,
            validate: value => {
                if (isEmptyValue(value)) return true;

                const numberValue = Number(value);

                if (!Number.isFinite(numberValue)) return false;
                if (min !== undefined && numberValue < min) return false;
                if (max !== undefined && numberValue > max) return false;

                return true;
            }
        };
    },

    min(minValue, message = `Value must be at least ${minValue}`) {
        return validators.range(minValue, undefined, message);
    },

    max(maxValue, message = `Value must be at most ${maxValue}`) {
        return validators.range(undefined, maxValue, message);
    },

    minLength(length, message) {
        return {
            message,
            validate: value => {
                if (isEmptyValue(value)) return true;

                return String(value).length >= length;
            }
        };
    },

    maxLength(length, message) {
        return {
            message,
            validate: value => {
                if (isEmptyValue(value)) return true;

                return String(value).length <= length;
            }
        };
    },

    custom(message, validateFn) {
        return {
            message,
            validate: validateFn
        };
    }
};

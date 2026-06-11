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

/**
 * Validator factories for AMB Grid and CrudHelper.
 *
 * Except for `required`, validators treat empty values as valid.
 *
 * @namespace validators
 */
export const validators = {
    /**
     * Require a non-empty value.
     *
     * @param {string} message - Message shown when the value is empty.
     * @returns {{message: string, validate: Function}} Validator object.
     */
    required(message) {
        return {
            message,
            validate: value => {
                return !isEmptyValue(value);
            }
        };
    },

    /**
     * Validate non-empty values against a regular expression.
     *
     * @param {RegExp} regex - Pattern to test.
     * @param {string} message - Message shown when the pattern does not match.
     * @returns {{message: string, validate: Function}} Validator object.
     */
    pattern(regex, message) {
        return {
            message,
            validate: value => {
                if (isEmptyValue(value)) return true;

                return regex.test(String(value));
            }
        };
    },

    /**
     * Validate non-empty values as email addresses.
     *
     * @param {string} [message='Invalid email address'] - Validation message.
     * @returns {{message: string, validate: Function}} Validator object.
     */
    email(message = 'Invalid email address') {
        return {
            message,
            validate: value => {
                if (isEmptyValue(value)) return true;

                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value));
            }
        };
    },

    /**
     * Validate non-empty values as finite JavaScript numbers.
     *
     * @param {string} [message='Value must be a number'] - Validation message.
     * @returns {{message: string, validate: Function}} Validator object.
     */
    number(message = 'Value must be a number') {
        return {
            message,
            validate: value => {
                if (isEmptyValue(value)) return true;

                return Number.isFinite(Number(value));
            }
        };
    },

    /**
     * Validate non-empty values as integers.
     *
     * @param {string} [message='Value must be an integer'] - Validation message.
     * @returns {{message: string, validate: Function}} Validator object.
     */
    integer(message = 'Value must be an integer') {
        return {
            message,
            validate: value => {
                if (isEmptyValue(value)) return true;

                return Number.isInteger(Number(value));
            }
        };
    },

    /**
     * Validate non-empty decimal values with optional digit limits.
     *
     * @param {object} [options] - Decimal validation options.
     * @param {boolean} [options.allowNegative=false] - Allow numbers below zero.
     * @param {string} [options.decimalSeparator=','] - Decimal separator accepted in strings.
     * @param {number} [options.integerDigits] - Maximum digits before the separator.
     * @param {number} [options.decimalDigits] - Maximum digits after the separator.
     * @param {string} [message='Invalid decimal value'] - Validation message.
     * @returns {{message: string, validate: Function}} Validator object.
     */
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

    /**
     * Validate date values using the AMB date parser.
     *
     * @param {object} [options] - Date validation options.
     * @param {'dd/mm/yyyy'|'yyyy-mm-dd'|'yyyymmdd'|Date|string} [options.format='dd/mm/yyyy'] - Expected input format.
     * @param {boolean} [options.allowEmpty=true] - Whether empty values are valid.
     * @param {string} [message='Invalid date'] - Validation message.
     * @returns {{message: string, validate: Function}} Validator object.
     */
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

    /**
     * Validate non-empty numeric values between optional bounds.
     *
     * @param {number} [min] - Inclusive minimum value.
     * @param {number} [max] - Inclusive maximum value.
     * @param {string} message - Validation message.
     * @returns {{message: string, validate: Function}} Validator object.
     */
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

    /**
     * Validate non-empty numeric values against an inclusive minimum.
     *
     * @param {number} minValue - Inclusive minimum value.
     * @param {string} [message] - Validation message.
     * @returns {{message: string, validate: Function}} Validator object.
     */
    min(minValue, message = `Value must be at least ${minValue}`) {
        return validators.range(minValue, undefined, message);
    },

    /**
     * Validate non-empty numeric values against an inclusive maximum.
     *
     * @param {number} maxValue - Inclusive maximum value.
     * @param {string} [message] - Validation message.
     * @returns {{message: string, validate: Function}} Validator object.
     */
    max(maxValue, message = `Value must be at most ${maxValue}`) {
        return validators.range(undefined, maxValue, message);
    },

    /**
     * Validate the minimum string length for non-empty values.
     *
     * @param {number} length - Minimum length.
     * @param {string} message - Validation message.
     * @returns {{message: string, validate: Function}} Validator object.
     */
    minLength(length, message) {
        return {
            message,
            validate: value => {
                if (isEmptyValue(value)) return true;

                return String(value).length >= length;
            }
        };
    },

    /**
     * Validate the maximum string length for non-empty values.
     *
     * @param {number} length - Maximum length.
     * @param {string} message - Validation message.
     * @returns {{message: string, validate: Function}} Validator object.
     */
    maxLength(length, message) {
        return {
            message,
            validate: value => {
                if (isEmptyValue(value)) return true;

                return String(value).length <= length;
            }
        };
    },

    /**
     * Create a custom validator.
     *
     * @param {string} message - Validation message.
     * @param {Function} validateFn - Validation function.
     * @returns {{message: string, validate: Function}} Validator object.
     */
    custom(message, validateFn) {
        return {
            message,
            validate: validateFn
        };
    },

    /**
     * Pass when at least one child validator accepts the value.
     *
     * @param {object[]} validatorsList - Validators to evaluate.
     * @param {string} [message='Value does not match any allowed format'] - Validation message.
     * @returns {{message: string, validate: Function}} Validator object.
     */
    anyOf(validatorsList, message = 'Value does not match any allowed format') {
        return {
            message,
            validate: value => {
                if (!Array.isArray(validatorsList) || validatorsList.length === 0) {
                    return false;
                }

                return validatorsList.some(validator => {
                    return validator
                        && typeof validator.validate === 'function'
                        && validator.validate(value);
                });
            }
        };
    },

    /**
     * Pass only when every child validator accepts the value.
     *
     * @param {object[]} validatorsList - Validators to evaluate.
     * @param {string} [message='Value does not satisfy all validation rules'] - Validation message.
     * @returns {{message: string, validate: Function}} Validator object.
     */
    allOf(validatorsList, message = 'Value does not satisfy all validation rules') {
        return {
            message,
            validate: value => {
                if (!Array.isArray(validatorsList) || validatorsList.length === 0) {
                    return false;
                }

                return validatorsList.every(validator => {
                    return validator
                        && typeof validator.validate === 'function'
                        && validator.validate(value);
                });
            }
        };
    }
};

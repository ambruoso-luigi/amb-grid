import { validators } from '../validators.js';

export const DEFAULT_MESSAGES = {
    required: 'This field is required'
};

export const DEFAULT_VALIDATION_MESSAGES = {
    date: 'Invalid date',
    decimal: 'Invalid decimal value',
    email: 'Invalid email address',
    integer: 'Value must be an integer',
    number: 'Value must be a number',
    pattern: 'Invalid format',
    custom: 'Invalid value'
};

export const createRangeMessage = (min, max) => {
    return `Value must be between ${min} and ${max}`;
};

export const createMinMessage = minValue => {
    return `Value must be at least ${minValue}`;
};

export const createMaxMessage = maxValue => {
    return `Value must be at most ${maxValue}`;
};

export const createMinLengthMessage = length => {
    return `Minimum length is ${length}`;
};

export const createMaxLengthMessage = length => {
    return `Maximum length is ${length}`;
};

export const extractValidationRules = (field, validation = {}, messages = DEFAULT_MESSAGES) => {
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

export const extractColumnValidators = (columns, messages = DEFAULT_MESSAGES) => {
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

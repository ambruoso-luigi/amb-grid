import { validators } from '../validators.js';

export const DEFAULT_MESSAGES = {
    required: 'This field is required'
};

export const DEFAULT_VALIDATION_MESSAGES = {
    allowedValues: 'Choose a value from the list',
    codiceFiscale: 'Invalid Codice Fiscale',
    date: 'Invalid date',
    decimal: 'Invalid decimal value',
    email: 'Invalid email address',
    iban: 'Invalid IBAN',
    integer: 'Value must be an integer',
    italianIban: 'Invalid Italian IBAN',
    number: 'Value must be a number',
    pattern: 'Invalid format',
    custom: 'Invalid value',
    unique: 'Value must be unique'
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

const buildValidatorFromConfig = (config, messages = DEFAULT_MESSAGES) => {
    if (!config || typeof config !== 'object' || !config.type) return null;

    if (config.type === 'pattern') {
        if (!config.regex) return null;

        return validators.pattern(
            config.regex,
            config.message || DEFAULT_VALIDATION_MESSAGES.pattern
        );
    }

    if (config.type === 'email') {
        return validators.email(config.message || DEFAULT_VALIDATION_MESSAGES.email);
    }

    if (config.type === 'iban') {
        return validators.iban(config.message || DEFAULT_VALIDATION_MESSAGES.iban);
    }

    if (config.type === 'italianIban') {
        return validators.italianIban(config.message || DEFAULT_VALIDATION_MESSAGES.italianIban);
    }

    if (config.type === 'codiceFiscale') {
        return validators.codiceFiscale(config.message || DEFAULT_VALIDATION_MESSAGES.codiceFiscale);
    }

    if (config.type === 'unique') {
        const { type, message, ...uniqueOptions } = config;

        return validators.unique(
            uniqueOptions,
            message || DEFAULT_VALIDATION_MESSAGES.unique
        );
    }

    if (config.type === 'allowedValues') {
        const { type, values, message, ...allowedValuesOptions } = config;

        return validators.allowedValues(
            values,
            allowedValuesOptions,
            message || DEFAULT_VALIDATION_MESSAGES.allowedValues
        );
    }

    if (config.type === 'integer') {
        return validators.integer(config.message || DEFAULT_VALIDATION_MESSAGES.integer);
    }

    if (config.type === 'number') {
        return validators.number(config.message || DEFAULT_VALIDATION_MESSAGES.number);
    }

    if (config.type === 'date') {
        const { type, message, ...dateOptions } = config;

        return validators.date(
            dateOptions,
            message || DEFAULT_VALIDATION_MESSAGES.date
        );
    }

    if (config.type === 'minLength') {
        return validators.minLength(
            config.value,
            config.message || createMinLengthMessage(config.value)
        );
    }

    if (config.type === 'maxLength') {
        return validators.maxLength(
            config.value,
            config.message || createMaxLengthMessage(config.value)
        );
    }

    if (config.type === 'range') {
        return validators.range(
            config.min,
            config.max,
            config.message || createRangeMessage(config.min, config.max)
        );
    }

    if (config.type === 'min') {
        return validators.min(
            config.value,
            config.message || createMinMessage(config.value)
        );
    }

    if (config.type === 'max') {
        return validators.max(
            config.value,
            config.message || createMaxMessage(config.value)
        );
    }

    if (config.type === 'required') {
        return validators.required(
            config.message || messages.required || DEFAULT_MESSAGES.required
        );
    }

    return null;
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

    if (validation.iban) {
        const message = validation.iban === true
            ? DEFAULT_VALIDATION_MESSAGES.iban
            : validation.iban.message || DEFAULT_VALIDATION_MESSAGES.iban;

        extractedValidators.push(validators.iban(message));
    }

    if (validation.italianIban) {
        const message = validation.italianIban === true
            ? DEFAULT_VALIDATION_MESSAGES.italianIban
            : validation.italianIban.message || DEFAULT_VALIDATION_MESSAGES.italianIban;

        extractedValidators.push(validators.italianIban(message));
    }

    if (validation.codiceFiscale) {
        const message = validation.codiceFiscale === true
            ? DEFAULT_VALIDATION_MESSAGES.codiceFiscale
            : validation.codiceFiscale.message || DEFAULT_VALIDATION_MESSAGES.codiceFiscale;

        extractedValidators.push(validators.codiceFiscale(message));
    }

    if (validation.unique) {
        const uniqueValidation = validation.unique === true
            ? {}
            : validation.unique;
        const { message, ...uniqueOptions } = uniqueValidation;

        extractedValidators.push(validators.unique(
            {
                field,
                ...uniqueOptions
            },
            message || DEFAULT_VALIDATION_MESSAGES.unique
        ));
    }

    if (validation.allowedValues) {
        const allowedValuesValidation = Array.isArray(validation.allowedValues)
            ? { values: validation.allowedValues }
            : validation.allowedValues;
        const {
            values,
            message,
            ...allowedValuesOptions
        } = allowedValuesValidation;

        extractedValidators.push(validators.allowedValues(
            values,
            allowedValuesOptions,
            message || DEFAULT_VALIDATION_MESSAGES.allowedValues
        ));
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

    if (validation.anyOf) {
        const childValidators = (validation.anyOf.validators || [])
            .map(config => buildValidatorFromConfig(config, messages))
            .filter(Boolean);

        extractedValidators.push(validators.anyOf(
            childValidators,
            validation.anyOf.message
        ));
    }

    if (validation.allOf) {
        const childValidators = (validation.allOf.validators || [])
            .map(config => buildValidatorFromConfig(config, messages))
            .filter(Boolean);

        extractedValidators.push(validators.allOf(
            childValidators,
            validation.allOf.message
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

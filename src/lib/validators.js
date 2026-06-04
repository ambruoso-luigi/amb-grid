const isEmptyValue = value => {
    return value === null
        || value === undefined
        || (typeof value === 'string' && value.trim() === '');
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

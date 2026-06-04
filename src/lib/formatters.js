const isEmptyValue = value => {
    return value === null
        || value === undefined
        || value === '';
};

const getCellValue = cell => {
    return cell.getValue();
};

const stringifyValue = value => {
    if (value === null || value === undefined) return '';

    return String(value);
};

export const formatters = {
    text() {
        return cell => {
            return stringifyValue(getCellValue(cell));
        };
    },

    uppercase() {
        return cell => {
            return stringifyValue(getCellValue(cell)).toUpperCase();
        };
    },

    lowercase() {
        return cell => {
            return stringifyValue(getCellValue(cell)).toLowerCase();
        };
    },

    decimal(decimals = 2, options = {}) {
        return cell => {
            const value = getCellValue(cell);

            if (isEmptyValue(value)) return '';

            const numberValue = Number(value);

            if (!Number.isFinite(numberValue)) {
                return stringifyValue(value);
            }

            return numberValue.toLocaleString(options.locale || 'it-IT', {
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals,
                ...options
            });
        };
    },

    integer(options = {}) {
        return formatters.decimal(0, options);
    },

    emptyPlaceholder(placeholder = '-') {
        return cell => {
            const value = getCellValue(cell);

            if (isEmptyValue(value)) return placeholder;

            return stringifyValue(value);
        };
    }
};

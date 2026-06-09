import { parsers } from './parsers.js';

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

            const { locale = 'it-IT', ...formatOptions } = options;

            return numberValue.toLocaleString(locale, {
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals,
                ...formatOptions
            });
        };
    },

    integer(options = {}) {
        return formatters.decimal(0, options);
    },

    currency(options = {}) {
        return cell => {
            const value = getCellValue(cell);

            if (isEmptyValue(value)) return '';

            const numberValue = Number(value);

            if (!Number.isFinite(numberValue)) {
                return stringifyValue(value);
            }

            const {
                locale = 'it-IT',
                currency = 'EUR',
                ...formatOptions
            } = options;

            return numberValue.toLocaleString(locale, {
                style: 'currency',
                currency,
                ...formatOptions
            });
        };
    },

    date(format = 'dd/mm/yyyy', options = {}) {
        return cell => {
            const value = getCellValue(cell);

            if (isEmptyValue(value)) return '';

            const parsedValue = parsers.date({
                inputFormat: options.inputFormat || format,
                outputFormat: options.outputFormat || format
            }).parse(value);

            if (parsedValue === null) {
                return stringifyValue(value);
            }

            return parsedValue;
        };
    },

    percent(decimals = 2, options = {}) {
        return cell => {
            const value = getCellValue(cell);

            if (isEmptyValue(value)) return '';

            const numberValue = Number(value);

            if (!Number.isFinite(numberValue)) {
                return stringifyValue(value);
            }

            const { locale = 'it-IT', ...formatOptions } = options;

            return numberValue.toLocaleString(locale, {
                style: 'percent',
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals,
                ...formatOptions
            });
        };
    },

    emptyPlaceholder(placeholder = '-') {
        return cell => {
            const value = getCellValue(cell);

            if (isEmptyValue(value)) return placeholder;

            return stringifyValue(value);
        };
    },

    checkbox(options = {}) {
        const normalizedOptions = {
            checkedValue: true,
            uncheckedValue: false,
            checkedLabel: 'Yes',
            uncheckedLabel: 'No',
            checkedSymbol: '☑',
            uncheckedSymbol: '☐',
            ...options
        };

        return cell => {
            const value = getCellValue(cell);
            const checked = value === normalizedOptions.checkedValue;
            const symbol = checked
                ? normalizedOptions.checkedSymbol
                : normalizedOptions.uncheckedSymbol;
            const label = checked
                ? normalizedOptions.checkedLabel
                : normalizedOptions.uncheckedLabel;

            return `${symbol} ${label}`;
        };
    },

    largeTextPreview(options = {}) {
        const normalizedOptions = {
            maxLength: 40,
            ellipsis: '...',
            ...options
        };

        return cell => {
            const value = getCellValue(cell);
            const cellElement = cell.getElement && cell.getElement();

            if (cellElement) {
                cellElement.dataset.largeTextField = cell.getField();
            }

            if (isEmptyValue(value)) return '';

            const text = stringifyValue(value).replace(/\s+/g, ' ').trim();

            if (text === '') return '';
            if (text.length <= normalizedOptions.maxLength) return text;

            return `${text.slice(0, normalizedOptions.maxLength)}${normalizedOptions.ellipsis}`;
        };
    }
};

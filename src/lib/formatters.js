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

/**
 * Escape text for safe insertion into formatter HTML output.
 *
 * @param {*} value - Value to stringify and escape.
 * @returns {string} HTML-escaped text.
 */
export const escapeHtmlText = value => {
    return stringifyValue(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
};

/**
 * Formatter factories for Tabulator columns.
 *
 * @namespace formatters
 */
export const formatters = {
    /**
     * Plain text formatter.
     *
     * @returns {Function} Tabulator formatter returning an empty string for nullish values.
     */
    text() {
        return cell => {
            return escapeHtmlText(getCellValue(cell));
        };
    },

    /**
     * Uppercase text formatter.
     *
     * @returns {Function} Tabulator formatter.
     */
    uppercase() {
        return cell => {
            return escapeHtmlText(stringifyValue(getCellValue(cell)).toUpperCase());
        };
    },

    /**
     * Lowercase text formatter.
     *
     * @returns {Function} Tabulator formatter.
     */
    lowercase() {
        return cell => {
            return escapeHtmlText(stringifyValue(getCellValue(cell)).toLowerCase());
        };
    },

    /**
     * Fixed-decimal numeric formatter.
     *
     * @param {number} [decimals=2] - Minimum and maximum fraction digits.
     * @param {object} [options] - Locale and Intl number format options.
     * @returns {Function} Tabulator formatter.
     */
    decimal(decimals = 2, options = {}) {
        return cell => {
            const value = getCellValue(cell);

            if (isEmptyValue(value)) return '';

            const numberValue = Number(value);

            if (!Number.isFinite(numberValue)) {
                return escapeHtmlText(value);
            }

            const { locale = 'it-IT', ...formatOptions } = options;

            return numberValue.toLocaleString(locale, {
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals,
                ...formatOptions
            });
        };
    },

    /**
     * Integer numeric formatter.
     *
     * @param {object} [options] - Locale and Intl number format options.
     * @returns {Function} Tabulator formatter.
     */
    integer(options = {}) {
        return formatters.decimal(0, options);
    },

    /**
     * Currency formatter.
     *
     * @param {object} [options] - Locale, currency code, and Intl options.
     * @returns {Function} Tabulator formatter.
     */
    currency(options = {}) {
        return cell => {
            const value = getCellValue(cell);

            if (isEmptyValue(value)) return '';

            const numberValue = Number(value);

            if (!Number.isFinite(numberValue)) {
                return escapeHtmlText(value);
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

    /**
     * Date formatter using AMB date parsers.
     *
     * @param {'dd/mm/yyyy'|'dd-mm-yyyy'|'dd.mm.yyyy'|'mm/dd/yyyy'|'mm-dd-yyyy'|'yyyy-mm-dd'|'yyyy/mm/dd'|'yyyymmdd'|'it'|'iso'|'legacy'} [format='dd/mm/yyyy'] - Display format.
     * @param {object} [options] - Parser format overrides.
     * @param {string|Date} [options.inputFormat] - Source date format.
     * @param {string} [options.outputFormat] - Display date format.
     * @returns {Function} Tabulator formatter.
     */
    date(format = 'dd/mm/yyyy', options = {}) {
        return cell => {
            const value = getCellValue(cell);

            if (isEmptyValue(value)) return '';

            const parsedValue = parsers.date({
                inputFormat: options.inputFormat || format,
                outputFormat: options.outputFormat || format
            }).parse(value);

            if (parsedValue === null) {
                return escapeHtmlText(value);
            }

            return parsedValue;
        };
    },

    /**
     * Percentage formatter using Intl.NumberFormat percent semantics.
     *
     * @param {number} [decimals=2] - Minimum and maximum fraction digits.
     * @param {object} [options] - Locale and Intl options.
     * @returns {Function} Tabulator formatter.
     */
    percent(decimals = 2, options = {}) {
        return cell => {
            const value = getCellValue(cell);

            if (isEmptyValue(value)) return '';

            const numberValue = Number(value);

            if (!Number.isFinite(numberValue)) {
                return escapeHtmlText(value);
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

    /**
     * Percentage formatter for values stored as ratios with fixed decimal precision.
     *
     * The maximum displayed percentage precision is derived from the stored
     * ratio precision: `max(0, ratioDecimalDigits - 2)`. Trailing fractional
     * zeros are hidden by default.
     *
     * @param {number} [ratioDecimalDigits=2] - Maximum decimal digits stored in the ratio.
     * @param {object} [options] - Locale and Intl options.
     * @returns {Function} Tabulator formatter.
     * @example
     * formatter: AMB.formatters.percentFromRatio(3)
     */
    percentFromRatio(ratioDecimalDigits = 2, options = {}) {
        const normalizedRatioDigits = Number.isFinite(Number(ratioDecimalDigits))
            ? Math.max(0, Math.trunc(Number(ratioDecimalDigits)))
            : 2;
        const displayDecimalDigits = Math.max(0, normalizedRatioDigits - 2);

        return formatters.percent(displayDecimalDigits, {
            minimumFractionDigits: 0,
            ...options
        });
    },

    /**
     * Placeholder formatter for empty values.
     *
     * @param {string} [placeholder='-'] - Text used for null, undefined, or empty string.
     * @returns {Function} Tabulator formatter.
     */
    emptyPlaceholder(placeholder = '-') {
        return cell => {
            const value = getCellValue(cell);

            if (isEmptyValue(value)) return escapeHtmlText(placeholder);

            return escapeHtmlText(value);
        };
    },

    /**
     * Checkbox-style formatter for boolean-like values.
     *
     * @param {object} [options] - Checkbox display options.
     * @param {*} [options.checkedValue=true] - Stored value treated as checked.
     * @param {*} [options.uncheckedValue=false] - Stored value treated as unchecked.
     * @param {string} [options.checkedLabel='Yes'] - Label for checked values.
     * @param {string} [options.uncheckedLabel='No'] - Label for unchecked values.
     * @param {string} [options.checkedSymbol='☑'] - Symbol for checked values.
     * @param {string} [options.uncheckedSymbol='☐'] - Symbol for unchecked values.
     * @returns {Function} Tabulator formatter.
     */
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

            return `${escapeHtmlText(symbol)} ${escapeHtmlText(label)}`;
        };
    },

    /**
     * Short preview formatter for long text cells.
     *
     * @param {object} [options] - Preview options.
     * @param {number} [options.maxLength=40] - Maximum preview length before truncation.
     * @param {string} [options.ellipsis='...'] - Text appended after truncated previews.
     * @returns {Function} Tabulator formatter.
     */
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
            if (text.length <= normalizedOptions.maxLength) return escapeHtmlText(text);

            return escapeHtmlText(`${text.slice(0, normalizedOptions.maxLength)}${normalizedOptions.ellipsis}`);
        };
    }
};

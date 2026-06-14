const DEFAULT_DATE_OPTIONS = {
    inputFormat: 'dd/mm/yyyy',
    outputFormat: 'yyyy-mm-dd',
    allowEmpty: true
};

const isEmptyValue = value => {
    return value === null
        || value === undefined
        || (typeof value === 'string' && value.trim() === '');
};

const padDatePart = value => {
    return String(value).padStart(2, '0');
};

const normalizeDateFormat = format => {
    const aliases = {
        iso: 'yyyy-mm-dd',
        ISO: 'yyyy-mm-dd',
        it: 'dd/mm/yyyy',
        IT: 'dd/mm/yyyy',
        legacy: 'yyyymmdd'
    };

    return aliases[format] || format;
};

const isValidDateParts = (year, month, day) => {
    const date = new Date(year, month - 1, day);

    return date.getFullYear() === year
        && date.getMonth() === month - 1
        && date.getDate() === day;
};

const parseDateValue = (value, inputFormat) => {
    const normalizedInputFormat = normalizeDateFormat(inputFormat);

    if (normalizedInputFormat === Date || normalizedInputFormat === 'Date') {
        if (!(value instanceof Date) || !Number.isFinite(value.getTime())) return null;

        return {
            year: value.getFullYear(),
            month: value.getMonth() + 1,
            day: value.getDate()
        };
    }

    const stringValue = String(value).trim();
    let match;
    let year;
    let month;
    let day;

    if (normalizedInputFormat === 'dd/mm/yyyy') {
        match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(stringValue);
        if (!match) return null;

        day = Number(match[1]);
        month = Number(match[2]);
        year = Number(match[3]);
    } else if (normalizedInputFormat === 'dd-mm-yyyy') {
        match = /^(\d{2})-(\d{2})-(\d{4})$/.exec(stringValue);
        if (!match) return null;

        day = Number(match[1]);
        month = Number(match[2]);
        year = Number(match[3]);
    } else if (normalizedInputFormat === 'dd.mm.yyyy') {
        match = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(stringValue);
        if (!match) return null;

        day = Number(match[1]);
        month = Number(match[2]);
        year = Number(match[3]);
    } else if (normalizedInputFormat === 'mm/dd/yyyy') {
        match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(stringValue);
        if (!match) return null;

        month = Number(match[1]);
        day = Number(match[2]);
        year = Number(match[3]);
    } else if (normalizedInputFormat === 'mm-dd-yyyy') {
        match = /^(\d{2})-(\d{2})-(\d{4})$/.exec(stringValue);
        if (!match) return null;

        month = Number(match[1]);
        day = Number(match[2]);
        year = Number(match[3]);
    } else if (normalizedInputFormat === 'yyyy-mm-dd') {
        match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(stringValue);
        if (!match) return null;

        year = Number(match[1]);
        month = Number(match[2]);
        day = Number(match[3]);
    } else if (normalizedInputFormat === 'yyyy/mm/dd') {
        match = /^(\d{4})\/(\d{2})\/(\d{2})$/.exec(stringValue);
        if (!match) return null;

        year = Number(match[1]);
        month = Number(match[2]);
        day = Number(match[3]);
    } else if (normalizedInputFormat === 'yyyymmdd') {
        match = /^(\d{4})(\d{2})(\d{2})$/.exec(stringValue);
        if (!match) return null;

        year = Number(match[1]);
        month = Number(match[2]);
        day = Number(match[3]);
    } else {
        return null;
    }

    if (!isValidDateParts(year, month, day)) return null;

    return { year, month, day };
};

const formatDateValue = ({ year, month, day }, outputFormat) => {
    const normalizedOutputFormat = normalizeDateFormat(outputFormat);
    const formattedMonth = padDatePart(month);
    const formattedDay = padDatePart(day);

    if (normalizedOutputFormat === 'dd/mm/yyyy') {
        return `${formattedDay}/${formattedMonth}/${year}`;
    }

    if (normalizedOutputFormat === 'dd-mm-yyyy') {
        return `${formattedDay}-${formattedMonth}-${year}`;
    }

    if (normalizedOutputFormat === 'dd.mm.yyyy') {
        return `${formattedDay}.${formattedMonth}.${year}`;
    }

    if (normalizedOutputFormat === 'mm/dd/yyyy') {
        return `${formattedMonth}/${formattedDay}/${year}`;
    }

    if (normalizedOutputFormat === 'mm-dd-yyyy') {
        return `${formattedMonth}-${formattedDay}-${year}`;
    }

    if (normalizedOutputFormat === 'yyyy-mm-dd') {
        return `${year}-${formattedMonth}-${formattedDay}`;
    }

    if (normalizedOutputFormat === 'yyyy/mm/dd') {
        return `${year}/${formattedMonth}/${formattedDay}`;
    }

    if (normalizedOutputFormat === 'yyyymmdd') {
        return `${year}${formattedMonth}${formattedDay}`;
    }

    if (normalizedOutputFormat === 'Date') {
        return new Date(year, month - 1, day);
    }

    return null;
};

/**
 * Parser factories used by editors, formatters, and validators.
 *
 * @namespace parsers
 */
export const parsers = {
    /**
     * Create a strict date parser.
     *
     * Supports `dd/mm/yyyy`, `dd-mm-yyyy`, `dd.mm.yyyy`, `mm/dd/yyyy`,
     * `mm-dd-yyyy`, `yyyy-mm-dd`, `yyyy/mm/dd`, `yyyymmdd`, `Date`, and the
     * `it`, `iso`, and `legacy` aliases.
     * Invalid dates return `null`; empty values follow `allowEmpty`.
     *
     * @param {object} [options] - Date parser options.
     * @param {'dd/mm/yyyy'|'dd-mm-yyyy'|'dd.mm.yyyy'|'mm/dd/yyyy'|'mm-dd-yyyy'|'yyyy-mm-dd'|'yyyy/mm/dd'|'yyyymmdd'|'it'|'iso'|'legacy'|Date|string} [options.inputFormat='dd/mm/yyyy'] - Expected input format.
     * @param {'dd/mm/yyyy'|'dd-mm-yyyy'|'dd.mm.yyyy'|'mm/dd/yyyy'|'mm-dd-yyyy'|'yyyy-mm-dd'|'yyyy/mm/dd'|'yyyymmdd'|'it'|'iso'|'legacy'|'Date'} [options.outputFormat='yyyy-mm-dd'] - Returned format.
     * @param {boolean} [options.allowEmpty=true] - Whether empty values parse as an empty string.
     * @returns {{parse: Function}} Parser object with a `parse(value)` method.
     */
    date(options = {}) {
        const normalizedOptions = {
            ...DEFAULT_DATE_OPTIONS,
            ...options
        };

        return {
            parse(value) {
                if (isEmptyValue(value)) {
                    return normalizedOptions.allowEmpty ? '' : null;
                }

                const dateParts = parseDateValue(value, normalizedOptions.inputFormat);

                if (!dateParts) return null;

                return formatDateValue(dateParts, normalizedOptions.outputFormat);
            }
        };
    }
};

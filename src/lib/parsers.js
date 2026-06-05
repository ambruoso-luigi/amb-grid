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

const isValidDateParts = (year, month, day) => {
    const date = new Date(year, month - 1, day);

    return date.getFullYear() === year
        && date.getMonth() === month - 1
        && date.getDate() === day;
};

const parseDateValue = (value, inputFormat) => {
    if (inputFormat === Date || inputFormat === 'Date') {
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

    if (inputFormat === 'dd/mm/yyyy') {
        match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(stringValue);
        if (!match) return null;

        day = Number(match[1]);
        month = Number(match[2]);
        year = Number(match[3]);
    } else if (inputFormat === 'yyyy-mm-dd') {
        match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(stringValue);
        if (!match) return null;

        year = Number(match[1]);
        month = Number(match[2]);
        day = Number(match[3]);
    } else if (inputFormat === 'yyyymmdd') {
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
    const formattedMonth = padDatePart(month);
    const formattedDay = padDatePart(day);

    if (outputFormat === 'dd/mm/yyyy') {
        return `${formattedDay}/${formattedMonth}/${year}`;
    }

    if (outputFormat === 'yyyy-mm-dd') {
        return `${year}-${formattedMonth}-${formattedDay}`;
    }

    if (outputFormat === 'yyyymmdd') {
        return `${year}${formattedMonth}${formattedDay}`;
    }

    if (outputFormat === 'Date') {
        return new Date(year, month - 1, day);
    }

    return null;
};

export const parsers = {
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

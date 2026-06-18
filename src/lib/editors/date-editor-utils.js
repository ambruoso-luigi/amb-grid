import { parsers } from '../parsers.js';

export const normalizeDateFormat = format => {
    const aliases = {
        iso: 'yyyy-mm-dd',
        ISO: 'yyyy-mm-dd',
        it: 'dd/mm/yyyy',
        IT: 'dd/mm/yyyy',
        legacy: 'yyyymmdd'
    };

    return aliases[format] || format;
};

export const normalizeDateEditorOptions = (options = {}) => {
    const mode = options.mode
        || (options.picker === true ? 'manualWithPickerButton' : 'manual');

    return {
        format: 'dd/mm/yyyy',
        allowEmpty: true,
        invalidBehavior: 'commitRaw',
        mode,
        picker: false,
        selectOnFocus: false,
        ...options,
        mode
    };
};

export const getDateEditorBehavior = mode => {
    return {
        hasManualInput: mode !== 'pickerOnly',
        hasPickerButton: mode === 'manualWithPickerButton',
        autoOpenPicker: mode === 'pickerOnly'
    };
};

const getDateFormatParts = format => {
    const normalizedFormat = normalizeDateFormat(format);

    if (normalizedFormat === 'dd/mm/yyyy') {
        return {
            separator: '/',
            groups: [2, 2, 4]
        };
    }

    if (normalizedFormat === 'dd-mm-yyyy') {
        return {
            separator: '-',
            groups: [2, 2, 4]
        };
    }

    if (normalizedFormat === 'dd.mm.yyyy') {
        return {
            separator: '.',
            groups: [2, 2, 4]
        };
    }

    if (normalizedFormat === 'mm/dd/yyyy') {
        return {
            separator: '/',
            groups: [2, 2, 4]
        };
    }

    if (normalizedFormat === 'mm-dd-yyyy') {
        return {
            separator: '-',
            groups: [2, 2, 4]
        };
    }

    if (normalizedFormat === 'yyyy-mm-dd') {
        return {
            separator: '-',
            groups: [4, 2, 2]
        };
    }

    if (normalizedFormat === 'yyyy/mm/dd') {
        return {
            separator: '/',
            groups: [4, 2, 2]
        };
    }

    if (normalizedFormat === 'yyyymmdd') {
        return {
            separator: '',
            groups: [4, 2, 2]
        };
    }

    return null;
};

const isCompatibleAutoFormattedValue = (value, normalizedValue, separator) => {
    let normalizedIndex = 0;

    for (const character of value) {
        while (
            normalizedValue[normalizedIndex] === separator
            && character !== separator
        ) {
            normalizedIndex += 1;
        }

        if (character !== normalizedValue[normalizedIndex]) {
            return false;
        }

        normalizedIndex += 1;
    }

    return true;
};

export const normalizeDateInput = (value, format) => {
    const formatParts = getDateFormatParts(format);
    const stringValue = String(value);

    if (!formatParts) return stringValue;

    if (formatParts.separator !== '' && stringValue.includes(formatParts.separator)) {
        return stringValue
            .replace(new RegExp(`[^\\d\\${formatParts.separator}]`, 'g'), '')
            .slice(0, 10);
    }

    const digits = stringValue.replace(/\D/g, '').slice(0, 8);
    const groups = [];
    let offset = 0;

    formatParts.groups.forEach(groupLength => {
        const group = digits.slice(offset, offset + groupLength);

        if (group) {
            groups.push(group);
        }

        offset += groupLength;
    });

    const maxLength = formatParts.separator === '' ? 8 : 10;

    return groups.join(formatParts.separator).slice(0, maxLength);
};

export const normalizeDateInputChange = ({
    value,
    format,
    selectionStart,
    inputType
}) => {
    const stringValue = String(value);
    const formatParts = getDateFormatParts(format);

    if (!formatParts || stringValue === '') {
        return {
            value: stringValue,
            selectionStart: stringValue.length
        };
    }

    if (formatParts.separator === '') {
        const digits = stringValue.replace(/\D/g, '').slice(0, 8);

        return {
            value: digits,
            selectionStart: Math.min(selectionStart || digits.length, digits.length)
        };
    }

    const cursorAtEnd = selectionStart === stringValue.length;
    const typingForward = inputType === 'insertText'
        || inputType === 'insertCompositionText'
        || inputType === undefined;
    const digits = stringValue.replace(/\D/g, '');
    const normalizedValue = normalizeDateInput(digits, format);
    const isCompatibleAutoFormattedPrefix = isCompatibleAutoFormattedValue(
        stringValue,
        normalizedValue,
        formatParts.separator
    );

    if (!cursorAtEnd || !typingForward || !isCompatibleAutoFormattedPrefix) {
        return {
            value: stringValue,
            selectionStart: selectionStart || stringValue.length
        };
    }

    return {
        value: normalizedValue,
        selectionStart: normalizedValue.length
    };
};

export const parseDateEditorValue = (value, options = {}) => {
    const normalizedOptions = {
        format: 'dd/mm/yyyy',
        allowEmpty: true,
        invalidBehavior: 'commitRaw',
        ...options
    };

    if (value === '') {
        if (normalizedOptions.allowEmpty) {
            return {
                action: 'success',
                value: ''
            };
        }

        return normalizedOptions.invalidBehavior === 'cancel'
            ? { action: 'cancel' }
            : { action: 'success', value };
    }

    const parsedValue = parsers.date({
        inputFormat: normalizedOptions.format,
        outputFormat: normalizedOptions.format,
        allowEmpty: normalizedOptions.allowEmpty
    }).parse(value);

    if (parsedValue === null) {
        return normalizedOptions.invalidBehavior === 'cancel'
            ? { action: 'cancel' }
            : { action: 'success', value };
    }

    return {
        action: 'success',
        value: parsedValue
    };
};

export const formatPickerDate = (value, format) => {
    return parsers.date({
        inputFormat: Date,
        outputFormat: format,
        allowEmpty: false
    }).parse(value);
};

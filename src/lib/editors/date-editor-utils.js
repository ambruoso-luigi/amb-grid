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

export const sanitizeDateInputCharacters = (value, format) => {
    const formatParts = getDateFormatParts(format);
    const stringValue = String(value);

    if (!formatParts) return stringValue;
    if (formatParts.separator === '') return stringValue.replace(/\D/g, '');

    return stringValue.replace(
        new RegExp(`[^\\d\\${formatParts.separator}]`, 'g'),
        ''
    );
};

export const isAllowedDateInputKey = (event, format) => {
    if (!event) return true;

    if (event.ctrlKey || event.metaKey) {
        return ['a', 'c', 'v', 'x', 'y', 'z'].includes(
            String(event.key).toLowerCase()
        );
    }

    const allowedControlKeys = new Set([
        'Backspace',
        'Delete',
        'ArrowLeft',
        'ArrowRight',
        'Tab',
        'Home',
        'End',
        'Enter',
        'Escape'
    ]);

    if (allowedControlKeys.has(event.key)) return true;
    if (/^\d$/.test(event.key)) return true;

    const formatParts = getDateFormatParts(format);

    return Boolean(
        formatParts
        && formatParts.separator
        && event.key === formatParts.separator
    );
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
    const stringValue = sanitizeDateInputCharacters(value, format);

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
    const originalValue = String(value);
    const formatParts = getDateFormatParts(format);
    const originalSelectionStart = selectionStart === undefined
        ? originalValue.length
        : selectionStart;
    const sanitizedPrefix = sanitizeDateInputCharacters(
        originalValue.slice(0, originalSelectionStart),
        format
    );
    const stringValue = sanitizeDateInputCharacters(originalValue, format);
    const sanitizedSelectionStart = sanitizedPrefix.length;

    if (!formatParts || stringValue === '') {
        return {
            value: stringValue,
            selectionStart: Math.min(sanitizedSelectionStart, stringValue.length)
        };
    }

    if (formatParts.separator === '') {
        const digits = stringValue.replace(/\D/g, '').slice(0, 8);

        return {
            value: digits,
            selectionStart: Math.min(sanitizedSelectionStart, digits.length)
        };
    }

    const cursorAtEnd = sanitizedSelectionStart === stringValue.length;
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
            selectionStart: sanitizedSelectionStart
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

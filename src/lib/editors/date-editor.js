import Datepicker from 'vanillajs-datepicker/Datepicker';
import { parsers } from '../parsers.js';
import { focusInput, getInitialValue } from './shared.js';

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

export const normalizeDateInput = (value, format) => {
    const formatParts = getDateFormatParts(format);

    if (!formatParts) return String(value);

    const digits = String(value).replace(/\D/g, '').slice(0, 8);
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

const countDigits = value => {
    return (String(value).match(/\d/g) || []).length;
};

const getDateCursorPosition = (normalizedValue, digitCount) => {
    if (digitCount <= 0) return 0;

    let currentDigitCount = 0;

    for (let index = 0; index < normalizedValue.length; index += 1) {
        if (/\d/.test(normalizedValue[index])) {
            currentDigitCount += 1;
        }

        if (currentDigitCount >= digitCount) {
            return index + 1;
        }
    }

    return normalizedValue.length;
};

    /**
     * Date editor. Saves a date string in the configured format.
     *
     * @param {object} [options] - Date editor options.
     * @param {'dd/mm/yyyy'|'dd-mm-yyyy'|'dd.mm.yyyy'|'mm/dd/yyyy'|'mm-dd-yyyy'|'yyyy-mm-dd'|'yyyy/mm/dd'|'yyyymmdd'|'it'|'iso'|'legacy'} [options.format='dd/mm/yyyy'] - Input and saved date format.
     * @param {boolean} [options.allowEmpty=true] - Save an empty string for empty input.
     * @param {boolean} [options.picker=false] - Open a date picker while editing.
     * @param {boolean} [options.selectOnFocus=false] - Select the full value when editing starts.
     * @returns {Function} Tabulator editor.
     */
export function date(options = {}) {
        const normalizedOptions = {
            format: 'dd/mm/yyyy',
            allowEmpty: true,
            picker: false,
            selectOnFocus: false,
            ...options
        };
        const pickerFormat = normalizeDateFormat(normalizedOptions.format);

        return (cell, onRendered, success, cancel) => {
            const input = document.createElement('input');
            const initialValue = getInitialValue(cell);
            const initialParsedValue = parsers.date({
                inputFormat: normalizedOptions.format,
                outputFormat: normalizedOptions.format
            }).parse(initialValue);

            input.type = 'text';
            input.inputMode = 'numeric';
            input.value = initialValue === ''
                ? ''
                : initialParsedValue === null
                    ? initialValue
                    : initialParsedValue;
            input.maxLength = pickerFormat === 'yyyymmdd'
                ? 8
                : 10;

            if (normalizedOptions.picker) {
                let datepicker = null;
                let closed = false;
                let blurTimeout = null;

                input.className = 'amb-date-editor';

                const destroyDatepicker = () => {
                    if (blurTimeout) {
                        window.clearTimeout(blurTimeout);
                        blurTimeout = null;
                    }

                    if (datepicker) {
                        datepicker.destroy();
                        datepicker = null;
                    }
                };

                const closeWithSuccess = value => {
                    if (closed) return;

                    closed = true;
                    destroyDatepicker();
                    success(value);
                };

                const closeWithCancel = () => {
                    if (closed) return;

                    closed = true;
                    destroyDatepicker();
                    cancel();
                };

                const commit = () => {
                    const value = input.value;

                    if (value === '') {
                        if (normalizedOptions.allowEmpty) {
                            closeWithSuccess('');
                            return;
                        }

                        closeWithCancel();
                        return;
                    }

                    const parsedValue = parsers.date({
                        inputFormat: normalizedOptions.format,
                        outputFormat: normalizedOptions.format,
                        allowEmpty: normalizedOptions.allowEmpty
                    }).parse(value);

                    if (parsedValue === null) {
                        closeWithCancel();
                        return;
                    }

                    closeWithSuccess(parsedValue);
                };

                const sanitizeInput = () => {
                    const previousValue = input.value;
                    const previousSelectionStart = input.selectionStart || 0;
                    const digitsBeforeCaret = countDigits(previousValue.slice(0, previousSelectionStart));
                    const normalizedValue = normalizeDateInput(previousValue, normalizedOptions.format);

                    input.value = normalizedValue;
                    input.setSelectionRange(
                        getDateCursorPosition(normalizedValue, digitsBeforeCaret),
                        getDateCursorPosition(normalizedValue, digitsBeforeCaret)
                    );
                };

                input.addEventListener('input', sanitizeInput);
                input.addEventListener('changeDate', event => {
                    const date = event.detail && event.detail.date;

                    if (!date) return;

                    const formattedValue = Datepicker.formatDate(date, pickerFormat);

                    input.value = formattedValue;
                    closeWithSuccess(formattedValue);
                });
                input.addEventListener('keydown', event => {
                    if (event.key === 'Enter') {
                        commit();
                        return;
                    }

                    if (event.key === 'Escape') {
                        closeWithCancel();
                    }
                });
                input.addEventListener('blur', () => {
                    blurTimeout = window.setTimeout(() => {
                        if (closed) return;

                        const activeElement = document.activeElement;
                        const isPickerFocused = activeElement
                            && activeElement.closest
                            && activeElement.closest('.datepicker');

                        if (isPickerFocused || (datepicker && datepicker.active)) {
                            return;
                        }

                        commit();
                    }, 300);
                });

                onRendered(() => {
                    datepicker = new Datepicker(input, {
                        autohide: true,
                        format: pickerFormat,
                        container: document.body
                    });
                    input.focus();

                    if (normalizedOptions.selectOnFocus) {
                        input.select();
                    } else {
                        input.setSelectionRange(input.value.length, input.value.length);
                    }

                    datepicker.show();
                });

                return input;
            }

            const sanitizeInput = () => {
                const previousValue = input.value;
                const previousSelectionStart = input.selectionStart || 0;
                const digitsBeforeCaret = countDigits(previousValue.slice(0, previousSelectionStart));
                const normalizedValue = normalizeDateInput(previousValue, normalizedOptions.format);

                input.value = normalizedValue;
                input.setSelectionRange(
                    getDateCursorPosition(normalizedValue, digitsBeforeCaret),
                    getDateCursorPosition(normalizedValue, digitsBeforeCaret)
                );
            };

            const commit = () => {
                const value = input.value;

                if (value === '') {
                    if (normalizedOptions.allowEmpty) {
                        success('');
                        return;
                    }

                    cancel();
                    return;
                }

                const parsedValue = parsers.date({
                    inputFormat: normalizedOptions.format,
                    outputFormat: normalizedOptions.format,
                    allowEmpty: normalizedOptions.allowEmpty
                }).parse(value);

                if (parsedValue === null) {
                    cancel();
                    return;
                }

                success(parsedValue);
            };

            input.addEventListener('input', sanitizeInput);
            input.addEventListener('keydown', event => {
                if (event.key === 'Enter') {
                    commit();
                    return;
                }

                if (event.key === 'Escape') {
                    cancel();
                }
            });
            input.addEventListener('blur', commit);

            focusInput(input, onRendered, {
                selectOnFocus: normalizedOptions.selectOnFocus
            });
            return input;
        };
    }

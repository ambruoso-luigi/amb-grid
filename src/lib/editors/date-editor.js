import Datepicker from 'vanillajs-datepicker/Datepicker';
import { parsers } from '../parsers.js';
import {
    normalizeDateFormat,
    normalizeDateInputChange,
    parseDateEditorValue
} from './date-editor-utils.js';
import { focusInput, getInitialValue } from './shared.js';

const DATE_OPTION_FORMATS = [
    'dd/mm/yyyy',
    'dd-mm-yyyy',
    'dd.mm.yyyy',
    'mm/dd/yyyy',
    'mm-dd-yyyy',
    'yyyy-mm-dd',
    'yyyy/mm/dd',
    'yyyymmdd',
    Date
];

const parseDateOption = (value, preferredFormat) => {
    if (!value) return null;

    const preferredDate = parsers.date({
        inputFormat: preferredFormat,
        outputFormat: 'Date',
        allowEmpty: false
    }).parse(value);

    if (preferredDate instanceof Date && Number.isFinite(preferredDate.getTime())) {
        return preferredDate;
    }

    for (const format of DATE_OPTION_FORMATS) {
        if (format === preferredFormat) continue;

        const parsedDate = parsers.date({
            inputFormat: format,
            outputFormat: 'Date',
            allowEmpty: false
        }).parse(value);

        if (parsedDate instanceof Date && Number.isFinite(parsedDate.getTime())) {
            return parsedDate;
        }
    }

    return null;
};

const createPickerOptions = options => {
    const pickerOptions = {
        autohide: true,
        format: normalizeDateFormat(options.format),
        container: document.body
    };
    const minDate = parseDateOption(options.minDate, options.format);
    const maxDate = parseDateOption(options.maxDate, options.format);

    if (minDate) {
        pickerOptions.minDate = minDate;
    }

    if (maxDate) {
        pickerOptions.maxDate = maxDate;
    }

    return pickerOptions;
};

    /**
     * Date editor. Saves a date string in the configured format.
     *
     * @param {object} [options] - Date editor options.
     * @param {'dd/mm/yyyy'|'dd-mm-yyyy'|'dd.mm.yyyy'|'mm/dd/yyyy'|'mm-dd-yyyy'|'yyyy-mm-dd'|'yyyy/mm/dd'|'yyyymmdd'|'it'|'iso'|'legacy'} [options.format='dd/mm/yyyy'] - Input and saved date format.
     * @param {boolean} [options.allowEmpty=true] - Save an empty string for empty input.
     * @param {'commitRaw'|'cancel'} [options.invalidBehavior='commitRaw'] - What to do when the typed value is invalid.
     * @param {string|Date} [options.minDate] - Earliest date passed to the picker when enabled.
     * @param {string|Date} [options.maxDate] - Latest date passed to the picker when enabled.
     * @param {boolean} [options.picker=false] - Open a date picker while editing.
     * @param {boolean} [options.selectOnFocus=false] - Select the full value when editing starts.
     * @returns {Function} Tabulator editor.
     */
export function date(options = {}) {
        const normalizedOptions = {
            format: 'dd/mm/yyyy',
            allowEmpty: true,
            invalidBehavior: 'commitRaw',
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
                    const result = parseDateEditorValue(input.value, normalizedOptions);

                    if (result.action === 'cancel') {
                        closeWithCancel();
                        return;
                    }

                    closeWithSuccess(result.value);
                };

                const sanitizeInput = event => {
                    const nextValue = normalizeDateInputChange({
                        value: input.value,
                        format: normalizedOptions.format,
                        selectionStart: input.selectionStart || input.value.length,
                        inputType: event && event.inputType
                    });

                    input.value = nextValue.value;
                    input.setSelectionRange(nextValue.selectionStart, nextValue.selectionStart);
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
                    datepicker = new Datepicker(input, createPickerOptions(normalizedOptions));
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

            const sanitizeInput = event => {
                const nextValue = normalizeDateInputChange({
                    value: input.value,
                    format: normalizedOptions.format,
                    selectionStart: input.selectionStart || input.value.length,
                    inputType: event && event.inputType
                });

                input.value = nextValue.value;
                input.setSelectionRange(nextValue.selectionStart, nextValue.selectionStart);
            };

            const commit = () => {
                const result = parseDateEditorValue(input.value, normalizedOptions);

                if (result.action === 'cancel') {
                    cancel();
                    return;
                }

                success(result.value);
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

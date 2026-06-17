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
     * @param {boolean} [options.picker=false] - Open a date picker while editing. Picker selection is limited by min/max, but manual input is still committed according to `invalidBehavior`.
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
            const wrapper = document.createElement('span');
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
                const pickerButton = document.createElement('button');
                const pickerInput = document.createElement('input');
                let datepicker = null;
                let closed = false;
                let blurTimeout = null;

                input.className = 'amb-date-editor';
                wrapper.className = 'amb-date-editor-wrapper';
                wrapper.style.alignItems = 'stretch';
                wrapper.style.display = 'inline-flex';
                wrapper.style.position = 'relative';
                wrapper.style.width = '100%';
                input.style.flex = '1 1 auto';
                input.style.minWidth = '0';
                pickerButton.type = 'button';
                pickerButton.className = 'amb-date-editor-picker-button';
                pickerButton.setAttribute('aria-label', 'Open date picker');
                pickerButton.textContent = '▾';
                pickerButton.style.border = '1px solid #aaa';
                pickerButton.style.borderLeft = '0';
                pickerButton.style.cursor = 'pointer';
                pickerButton.style.padding = '0 8px';
                pickerInput.type = 'text';
                pickerInput.tabIndex = -1;
                pickerInput.setAttribute('aria-hidden', 'true');
                pickerInput.style.height = '1px';
                pickerInput.style.opacity = '0';
                pickerInput.style.pointerEvents = 'none';
                pickerInput.style.position = 'absolute';
                pickerInput.style.right = '0';
                pickerInput.style.top = '100%';
                pickerInput.style.width = '1px';
                wrapper.append(input, pickerButton, pickerInput);

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

                const showPicker = () => {
                    if (!datepicker) return;

                    const parsedValue = parsers.date({
                        inputFormat: normalizedOptions.format,
                        outputFormat: 'Date',
                        allowEmpty: true
                    }).parse(input.value);

                    pickerInput.value = parsedValue instanceof Date && Number.isFinite(parsedValue.getTime())
                        ? Datepicker.formatDate(parsedValue, pickerFormat)
                        : '';
                    datepicker.show();
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
                pickerInput.addEventListener('changeDate', event => {
                    const date = event.detail && event.detail.date;

                    if (!date) return;

                    const formattedValue = Datepicker.formatDate(date, pickerFormat);

                    input.value = formattedValue;
                    closeWithSuccess(formattedValue);
                });
                pickerButton.addEventListener('mousedown', event => {
                    event.preventDefault();
                });
                pickerButton.addEventListener('click', showPicker);
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
                        const isInternalPickerControl = activeElement === pickerButton
                            || activeElement === pickerInput;

                        if (isInternalPickerControl || isPickerFocused || (datepicker && datepicker.active)) {
                            return;
                        }

                        commit();
                    }, 300);
                });

                onRendered(() => {
                    datepicker = new Datepicker(pickerInput, createPickerOptions(normalizedOptions));
                    input.focus();

                    if (normalizedOptions.selectOnFocus) {
                        input.select();
                    } else {
                        input.setSelectionRange(input.value.length, input.value.length);
                    }

                    showPicker();
                });

                return wrapper;
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

import Datepicker from 'vanillajs-datepicker/Datepicker';
import { parsers } from '../parsers.js';
import {
    formatPickerDate,
    getDateEditorBehavior,
    isAllowedDateInputKey,
    normalizeDateFormat,
    normalizeDateEditorOptions,
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
     * @param {'manual'|'manualWithPickerButton'|'pickerOnly'} [options.mode] - Editing mode. `manualWithPickerButton` opens from its side button; `pickerOnly` opens immediately on render.
     * @param {boolean} [options.picker=false] - Backward-compatible shortcut for `mode: 'manualWithPickerButton'`.
     * @param {boolean} [options.selectOnFocus=false] - Select the full value when editing starts.
     * @returns {Function} Tabulator editor.
     */
export function date(options = {}) {
        const normalizedOptions = normalizeDateEditorOptions(options);
        const editorBehavior = getDateEditorBehavior(normalizedOptions.mode);
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

            if (normalizedOptions.mode === 'manualWithPickerButton' || normalizedOptions.mode === 'pickerOnly') {
                const pickerButton = document.createElement('button');
                const pickerInput = document.createElement('input');
                let datepicker = null;
                let closed = false;
                let blurTimeout = null;
                let tabCommitInProgress = false;
                let navigationScheduled = false;

                input.className = 'amb-date-editor';
                wrapper.className = 'amb-date-editor-wrapper';
                wrapper.classList.toggle(
                    'amb-date-editor-wrapper--picker-only',
                    normalizedOptions.mode === 'pickerOnly'
                );
                pickerButton.type = 'button';
                pickerButton.tabIndex = -1;
                pickerButton.className = 'amb-date-editor-picker-button';
                pickerButton.setAttribute('aria-label', 'Open date picker');
                pickerButton.title = 'Open date picker';
                pickerButton.textContent = '\u{1F4C5}';
                pickerInput.type = 'text';
                pickerInput.tabIndex = -1;
                pickerInput.setAttribute('aria-hidden', 'true');
                pickerInput.className = 'amb-date-editor-picker-anchor';

                if (editorBehavior.hasManualInput) {
                    wrapper.append(input);
                }

                if (editorBehavior.hasPickerButton) {
                    wrapper.append(pickerButton);
                }

                wrapper.append(pickerInput);

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

                const navigateAfterClose = direction => {
                    if (navigationScheduled) return;

                    const table = cell && cell.getTable && cell.getTable();

                    navigationScheduled = true;
                    globalThis.setTimeout(() => {
                        const row = cell && cell.getRow && cell.getRow();
                        const cells = row && typeof row.getCells === 'function'
                            ? row.getCells()
                            : [];
                        const currentIndex = cells.indexOf(cell);
                        const step = direction === 'prev' ? -1 : 1;

                        if (currentIndex !== -1) {
                            for (
                                let index = currentIndex + step;
                                index >= 0 && index < cells.length;
                                index += step
                            ) {
                                const candidate = cells[index];
                                const column = candidate
                                    && candidate.getColumn
                                    && candidate.getColumn();
                                const definition = column
                                    && column.getDefinition
                                    && column.getDefinition();
                                const hasEditor = definition
                                    && definition.visible !== false
                                    && definition.editable !== false
                                    && definition.editor !== undefined
                                    && definition.editor !== null
                                    && definition.editor !== false;

                                if (!hasEditor || typeof candidate.edit !== 'function') continue;

                                if (candidate.edit() !== false) return;
                            }
                        }

                        if (direction === 'prev' && cell && typeof cell.navigatePrev === 'function') {
                            cell.navigatePrev();
                            return;
                        }

                        if (direction === 'next' && cell && typeof cell.navigateNext === 'function') {
                            cell.navigateNext();
                            return;
                        }

                        if (direction === 'prev' && table && typeof table.navigatePrev === 'function') {
                            table.navigatePrev();
                            return;
                        }

                        if (direction === 'next' && table && typeof table.navigateNext === 'function') {
                            table.navigateNext();
                        }
                    }, 0);
                };

                const commitFromTab = direction => {
                    if (closed || tabCommitInProgress) return;

                    tabCommitInProgress = true;
                    commit();
                    navigateAfterClose(direction);
                };

                const commitFocusedPickerDateFromTab = direction => {
                    if (
                        closed
                        || tabCommitInProgress
                        || !datepicker
                        || !datepicker.active
                        || typeof datepicker.getFocusedDate !== 'function'
                    ) {
                        return;
                    }

                    const focusedDate = datepicker.getFocusedDate();

                    if (!(focusedDate instanceof Date) || !Number.isFinite(focusedDate.getTime())) {
                        return;
                    }

                    tabCommitInProgress = true;
                    const formattedValue = formatPickerDate(
                        focusedDate,
                        normalizedOptions.format
                    );

                    input.value = formattedValue;
                    closeWithSuccess(formattedValue);
                    navigateAfterClose(direction);
                };

                const showPicker = () => {
                    if (!datepicker) return;

                    const parsedValue = parsers.date({
                        inputFormat: normalizedOptions.format,
                        outputFormat: 'Date',
                        allowEmpty: true
                    }).parse(input.value);

                    pickerInput.value = parsedValue instanceof Date && Number.isFinite(parsedValue.getTime())
                        ? formatPickerDate(parsedValue, normalizedOptions.format)
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

                if (editorBehavior.hasManualInput) {
                    input.addEventListener('input', sanitizeInput);
                }
                pickerInput.addEventListener('changeDate', event => {
                    const date = event.detail && event.detail.date;

                    if (!date) return;

                    const formattedValue = formatPickerDate(date, normalizedOptions.format);

                    input.value = formattedValue;
                    closeWithSuccess(formattedValue);
                });
                pickerInput.addEventListener('hide', closeWithCancel);
                pickerInput.addEventListener('keydown', event => {
                    if (
                        normalizedOptions.mode !== 'pickerOnly'
                        || event.key !== 'Tab'
                        || !datepicker
                        || !datepicker.active
                    ) {
                        return;
                    }

                    event.preventDefault();

                    if (typeof event.stopImmediatePropagation === 'function') {
                        event.stopImmediatePropagation();
                    }

                    commitFocusedPickerDateFromTab(event.shiftKey ? 'prev' : 'next');
                });

                if (editorBehavior.hasPickerButton) {
                    pickerButton.addEventListener('mousedown', event => {
                        event.preventDefault();
                    });
                    pickerButton.addEventListener('click', showPicker);
                }

                if (editorBehavior.hasManualInput) {
                    input.addEventListener('keydown', event => {
                        if (!isAllowedDateInputKey(event, normalizedOptions.format)) {
                            event.preventDefault();
                            return;
                        }

                        if (event.key === 'Tab') {
                            event.preventDefault();
                            commitFromTab(event.shiftKey ? 'prev' : 'next');
                            return;
                        }

                        if (event.key === 'Enter') {
                            commit();
                            return;
                        }

                        if (event.key === 'Escape') {
                            closeWithCancel();
                        }
                    });
                    input.addEventListener('blur', () => {
                        if (tabCommitInProgress) return;

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
                }

                onRendered(() => {
                    datepicker = new Datepicker(pickerInput, createPickerOptions(normalizedOptions));

                    if (editorBehavior.hasManualInput) {
                        input.focus();

                        if (normalizedOptions.selectOnFocus) {
                            input.select();
                        } else {
                            input.setSelectionRange(input.value.length, input.value.length);
                        }
                    }

                    if (editorBehavior.autoOpenPicker) {
                        showPicker();
                    }
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
                if (!isAllowedDateInputKey(event, normalizedOptions.format)) {
                    event.preventDefault();
                    return;
                }

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

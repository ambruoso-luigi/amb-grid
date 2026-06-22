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

const debugDateEditor = (eventName, details = {}) => {
    if (globalThis.__AMB_DEBUG_DATE_EDITOR__ !== true) return;

    console.log('[AMB date editor]', eventName, details);

    if (globalThis.__AMB_DEBUG_DATE_EDITOR_BREAK__ === true) {
        debugger;
    }
};

const getElementDebugDetails = element => ({
    tag: element && element.tagName,
    className: element && element.className
});

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
            const row = cell && cell.getRow && cell.getRow();
            const field = cell && cell.getField && cell.getField();
            const rowIndex = row && typeof row.getPosition === 'function'
                ? row.getPosition()
                : undefined;
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

            debugDateEditor('create', {
                autoOpenPicker: editorBehavior.autoOpenPicker,
                field,
                hasManualInput: editorBehavior.hasManualInput,
                hasPickerButton: editorBehavior.hasPickerButton,
                initialValue,
                mode: normalizedOptions.mode,
                rowIndex
            });

            if (normalizedOptions.mode === 'manualWithPickerButton' || normalizedOptions.mode === 'pickerOnly') {
                const pickerButton = document.createElement('button');
                const pickerInput = document.createElement('input');
                let datepicker = null;
                let closed = false;
                let blurTimeout = null;
                let tabCommitInProgress = false;
                let navigationScheduled = false;
                let pickerKeyboardListenerAttached = false;
                let handlePickerDocumentKeydown = null;
                let debugDocumentKeydownAttached = false;
                let handleDebugDocumentKeydown = null;

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

                const removePickerKeyboardListener = () => {
                    if (!pickerKeyboardListenerAttached || !handlePickerDocumentKeydown) return;

                    debugDateEditor('remove picker keyboard listener', {
                        closed,
                        field,
                        rowIndex
                    });
                    document.removeEventListener(
                        'keydown',
                        handlePickerDocumentKeydown,
                        true
                    );
                    pickerKeyboardListenerAttached = false;
                };

                const removeDebugDocumentKeydownListener = () => {
                    if (!debugDocumentKeydownAttached || !handleDebugDocumentKeydown) return;

                    debugDateEditor('remove debug document keydown listener', {
                        closed,
                        field,
                        rowIndex
                    });
                    document.removeEventListener(
                        'keydown',
                        handleDebugDocumentKeydown,
                        true
                    );
                    debugDocumentKeydownAttached = false;
                };

                const destroyDatepicker = () => {
                    debugDateEditor('destroyDatepicker', {
                        closed,
                        field,
                        hasDatepicker: Boolean(datepicker),
                        removeDebugListener: debugDocumentKeydownAttached,
                        removePickerListener: pickerKeyboardListenerAttached,
                        rowIndex
                    });
                    removePickerKeyboardListener();
                    removeDebugDocumentKeydownListener();

                    if (blurTimeout) {
                        window.clearTimeout(blurTimeout);
                        blurTimeout = null;
                    }

                    if (datepicker) {
                        debugDateEditor('datepicker destroy', {
                            active: datepicker.active,
                            field,
                            rowIndex
                        });
                        datepicker.destroy();
                        datepicker = null;
                    }
                };

                const closeWithSuccess = value => {
                    debugDateEditor('closeWithSuccess', {
                        closed,
                        field,
                        navigationScheduled,
                        rowIndex,
                        tabCommitInProgress,
                        value
                    });
                    if (closed) return;

                    closed = true;
                    destroyDatepicker();
                    success(value);
                };

                const closeWithCancel = () => {
                    debugDateEditor('closeWithCancel', {
                        closed,
                        field,
                        navigationScheduled,
                        rowIndex,
                        tabCommitInProgress
                    });
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
                    debugDateEditor('navigate scheduled', {
                        direction,
                        field,
                        navigationScheduled,
                        rowIndex
                    });
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

                        debugDateEditor('navigate start', {
                            cellCount: cells.length,
                            currentIndex,
                            direction,
                            field,
                            rowIndex
                        });

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
                                const candidateField = definition && definition.field;

                                debugDateEditor('navigate candidate', {
                                    candidateField,
                                    direction,
                                    editable: definition && definition.editable,
                                    hasEditMethod: Boolean(candidate && typeof candidate.edit === 'function'),
                                    hasEditor,
                                    index,
                                    visible: definition && definition.visible
                                });

                                if (!hasEditor || typeof candidate.edit !== 'function') continue;

                                const editResult = candidate.edit();

                                debugDateEditor('navigate candidate edit', {
                                    candidateField,
                                    editResult
                                });
                                if (editResult !== false) return;
                            }
                        }

                        if (direction === 'prev' && cell && typeof cell.navigatePrev === 'function') {
                            debugDateEditor('navigate fallback cell', {
                                direction,
                                field,
                                rowIndex
                            });
                            cell.navigatePrev();
                            return;
                        }

                        if (direction === 'next' && cell && typeof cell.navigateNext === 'function') {
                            debugDateEditor('navigate fallback cell', {
                                direction,
                                field,
                                rowIndex
                            });
                            cell.navigateNext();
                            return;
                        }

                        if (direction === 'prev' && table && typeof table.navigatePrev === 'function') {
                            debugDateEditor('navigate fallback table', {
                                direction,
                                field,
                                rowIndex
                            });
                            table.navigatePrev();
                            return;
                        }

                        if (direction === 'next' && table && typeof table.navigateNext === 'function') {
                            debugDateEditor('navigate fallback table', {
                                direction,
                                field,
                                rowIndex
                            });
                            table.navigateNext();
                            return;
                        }

                        debugDateEditor('navigate unavailable', {
                            direction,
                            field,
                            rowIndex
                        });
                    }, 0);
                };

                const commitFromTab = direction => {
                    if (closed || tabCommitInProgress) return;

                    tabCommitInProgress = true;
                    commit();
                    navigateAfterClose(direction);
                };

                const commitFocusedPickerDateFromTab = direction => {
                    debugDateEditor('commit focused picker date requested', {
                        active: Boolean(datepicker && datepicker.active),
                        closed,
                        direction,
                        field,
                        hasGetFocusedDate: Boolean(
                            datepicker && typeof datepicker.getFocusedDate === 'function'
                        ),
                        rowIndex,
                        tabCommitInProgress
                    });
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

                    debugDateEditor('getFocusedDate', {
                        field,
                        focusedDate,
                        rowIndex
                    });

                    if (!(focusedDate instanceof Date) || !Number.isFinite(focusedDate.getTime())) {
                        debugDateEditor('getFocusedDate invalid', {
                            field,
                            focusedDate,
                            rowIndex
                        });
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

                handlePickerDocumentKeydown = event => {
                    debugDateEditor('picker document keydown operational', {
                        active: Boolean(datepicker && datepicker.active),
                        closed,
                        field,
                        key: event.key,
                        navigationScheduled,
                        rowIndex,
                        shiftKey: event.shiftKey,
                        tabCommitInProgress,
                        target: getElementDebugDetails(event.target)
                    });
                    if (
                        normalizedOptions.mode !== 'pickerOnly'
                        || closed
                        || !datepicker
                        || !datepicker.active
                        || event.key !== 'Tab'
                    ) {
                        return;
                    }

                    event.preventDefault();
                    event.stopPropagation();
                    commitFocusedPickerDateFromTab(event.shiftKey ? 'prev' : 'next');
                };

                handleDebugDocumentKeydown = event => {
                    debugDateEditor('document keydown capture', {
                        activeElement: getElementDebugDetails(document.activeElement),
                        closed,
                        field,
                        key: event.key,
                        navigationScheduled,
                        pickerActive: Boolean(datepicker && datepicker.active),
                        rowIndex,
                        shiftKey: event.shiftKey,
                        tabCommitInProgress,
                        target: getElementDebugDetails(event.target)
                    });
                };

                const addPickerKeyboardListener = () => {
                    if (
                        normalizedOptions.mode !== 'pickerOnly'
                        || pickerKeyboardListenerAttached
                    ) {
                        return;
                    }

                    document.addEventListener(
                        'keydown',
                        handlePickerDocumentKeydown,
                        true
                    );
                    pickerKeyboardListenerAttached = true;
                };

                const addDebugDocumentKeydownListener = () => {
                    if (
                        globalThis.__AMB_DEBUG_DATE_EDITOR__ !== true
                        || debugDocumentKeydownAttached
                    ) {
                        return;
                    }

                    document.addEventListener(
                        'keydown',
                        handleDebugDocumentKeydown,
                        true
                    );
                    debugDocumentKeydownAttached = true;
                    debugDateEditor('add debug document keydown listener', {
                        field,
                        rowIndex
                    });
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
                    debugDateEditor('showPicker before', {
                        active: datepicker.active,
                        activeElement: getElementDebugDetails(document.activeElement),
                        field,
                        inputValue: input.value,
                        parsedValue,
                        pickerInputValue: pickerInput.value,
                        rowIndex
                    });
                    datepicker.show();
                    debugDateEditor('showPicker after', {
                        active: datepicker.active,
                        activeElement: getElementDebugDetails(document.activeElement),
                        field,
                        pickerInputValue: pickerInput.value,
                        rowIndex
                    });

                    if (datepicker.active) {
                        addPickerKeyboardListener();
                        addDebugDocumentKeydownListener();
                    }
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

                    debugDateEditor('changeDate', {
                        closed,
                        date,
                        detail: event.detail,
                        field,
                        inputValueBefore: input.value,
                        rowIndex
                    });
                    if (!date) return;

                    const formattedValue = formatPickerDate(date, normalizedOptions.format);

                    input.value = formattedValue;
                    debugDateEditor('changeDate formatted', {
                        field,
                        formattedValue,
                        inputValueAfter: input.value,
                        rowIndex
                    });
                    closeWithSuccess(formattedValue);
                });
                pickerInput.addEventListener('hide', () => {
                    debugDateEditor('hide', {
                        activeElement: getElementDebugDetails(document.activeElement),
                        closed,
                        field,
                        rowIndex,
                        tabCommitInProgress,
                        willCancel: !closed
                    });
                    closeWithCancel();
                });
                pickerInput.addEventListener('keydown', event => {
                    let focusedDate;

                    if (datepicker && typeof datepicker.getFocusedDate === 'function') {
                        try {
                            focusedDate = datepicker.getFocusedDate();
                        } catch {
                            focusedDate = undefined;
                        }
                    }

                    debugDateEditor('pickerInput keydown', {
                        activeElement: getElementDebugDetails(document.activeElement),
                        closed,
                        field,
                        focusedDate,
                        inputValue: input.value,
                        key: event.key,
                        mode: normalizedOptions.mode,
                        pickerActive: Boolean(datepicker && datepicker.active),
                        pickerInputValue: pickerInput.value,
                        rowIndex,
                        shiftKey: event.shiftKey,
                        tabCommitInProgress,
                        target: getElementDebugDetails(event.target)
                    });
                });

                if (editorBehavior.hasPickerButton) {
                    pickerButton.addEventListener('mousedown', event => {
                        event.preventDefault();
                    });
                    pickerButton.addEventListener('click', showPicker);
                }

                if (editorBehavior.hasManualInput) {
                    input.addEventListener('keydown', event => {
                        debugDateEditor('manual input keydown', {
                            activeElement: getElementDebugDetails(document.activeElement),
                            closed,
                            field,
                            inputValue: input.value,
                            key: event.key,
                            navigationScheduled,
                            pickerActive: Boolean(datepicker && datepicker.active),
                            pickerInputValue: pickerInput.value,
                            rowIndex,
                            shiftKey: event.shiftKey,
                            tabCommitInProgress,
                            target: getElementDebugDetails(event.target)
                        });
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
                    debugDateEditor('onRendered', {
                        activeElement: getElementDebugDetails(document.activeElement),
                        autoOpenPicker: editorBehavior.autoOpenPicker,
                        field,
                        mode: normalizedOptions.mode,
                        rowIndex
                    });
                    datepicker = new Datepicker(pickerInput, createPickerOptions(normalizedOptions));
                    debugDateEditor('datepicker created', {
                        active: datepicker.active,
                        field,
                        rowIndex
                    });

                    if (editorBehavior.hasManualInput) {
                        input.focus();

                        if (normalizedOptions.selectOnFocus) {
                            input.select();
                        } else {
                            input.setSelectionRange(input.value.length, input.value.length);
                        }
                    }

                    if (editorBehavior.autoOpenPicker) {
                        debugDateEditor('autoOpenPicker', {
                            field,
                            rowIndex
                        });
                        showPicker();
                    }

                    debugDateEditor('onRendered complete', {
                        activeElement: getElementDebugDetails(document.activeElement),
                        field,
                        pickerActive: Boolean(datepicker && datepicker.active),
                        rowIndex
                    });
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

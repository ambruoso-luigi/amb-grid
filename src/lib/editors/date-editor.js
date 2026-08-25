import Datepicker from 'vanillajs-datepicker/Datepicker';
import { createFocusTrap, getFocusableElements } from '../../ui/focus-trap.js';
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
     * Keyboard behavior:
     * - `Tab` and `Shift+Tab` commit and navigate whether the picker is open or
     *   closed.
     * - `Enter` opens the datepicker when a picker is configured.
     * - while the picker is open, arrow keys do not propagate to the grid,
     *   `Enter` is left to the picker when appropriate, and `Escape` preserves
     *   the configured manual or picker-only close behavior.
     * - picker selection updates the manual editor value; leaving the editor
     *   commits it, while `Tab` and `Shift+Tab` commit and navigate.
     * - manual picker editors keep the calendar button mounted after picker
     *   close so the calendar can be reopened.
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
     * @returns {Function} Grid editor function compatible with the internal table engine.
     */
export function date(options = {}) {
        const normalizedOptions = normalizeDateEditorOptions(options);
        const editorBehavior = getDateEditorBehavior(normalizedOptions.mode);
        const pickerFormat = normalizeDateFormat(normalizedOptions.format);

        const editor = (cell, onRendered, success, cancel) => {
            const input = document.createElement('input');
            let closed = false;
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
                let pickerSelectionInProgress = false;
                let tabCommitInProgress = false;
                let navigationScheduled = false;
                let pickerKeyboardListenerAttached = false;
                let pickerTabListenerAttached = false;
                let pickerTabListenerReady = false;
                let handlePickerDocumentKeydown = null;
                let handlePickerTabKeydown = null;
                let pickerFocusTrap = null;
                let pickerPointerPopup = null;

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
                pickerInput.setAttribute('aria-label', 'Date picker anchor');
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

                    document.removeEventListener(
                        'keydown',
                        handlePickerDocumentKeydown
                    );
                    pickerKeyboardListenerAttached = false;
                };

                const removePickerTabListener = () => {
                    if (!pickerTabListenerAttached || !handlePickerTabKeydown) return;

                    document.removeEventListener(
                        'keydown',
                        handlePickerTabKeydown,
                        true
                    );
                    pickerTabListenerAttached = false;
                    pickerTabListenerReady = false;
                };

                const focusManualInput = () => {
                    if (!editorBehavior.hasManualInput) return;

                    try {
                        input.focus({ preventScroll: true });
                    } catch {
                        input.focus();
                    }
                };

                const cleanupPickerSession = ({ restoreFocus = true } = {}) => {
                    removePickerKeyboardListener();
                    removePickerTabListener();
                    if (pickerPointerPopup) {
                        pickerPointerPopup.removeEventListener('mousedown', markPickerPointerDown, true);
                        pickerPointerPopup.removeEventListener('click', clearPickerPointerState, true);
                        pickerPointerPopup = null;
                    }
                    pickerFocusTrap?.deactivate({ restore: restoreFocus });
                    pickerFocusTrap = null;

                    if (blurTimeout) {
                        window.clearTimeout(blurTimeout);
                        blurTimeout = null;
                    }
                };

                const closePickerPopup = ({ restoreFocus = true } = {}) => {
                    cleanupPickerSession({ restoreFocus: false });

                    if (datepicker) {
                        if (typeof datepicker.hide === 'function' && datepicker.active) {
                            datepicker.hide();
                        } else {
                            datepicker.active = false;
                        }
                    }

                    if (restoreFocus) {
                        focusManualInput();
                    }
                };

                const destroyDatepicker = () => {
                    cleanupPickerSession({ restoreFocus: false });

                    if (datepicker) {
                        datepicker.destroy();
                        datepicker = null;
                    }
                };

                const restoreCellFocusWithoutEditing = () => {
                    const internalCell = typeof cell._getSelf === 'function'
                        ? cell._getSelf()
                        : null;
                    const editModule = internalCell?.table?.modules?.edit;

                    if (
                        internalCell
                        && typeof editModule?.focusCellNoEvent === 'function'
                    ) {
                        editModule.focusCellNoEvent(internalCell);
                    }
                };

                const closeWithSuccess = value => {
                    if (closed) return;


                    closed = true;
                    destroyDatepicker();
                    success(value);

                    if (normalizedOptions.mode === 'pickerOnly') {
                        restoreCellFocusWithoutEditing();
                    }
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
                        if (!table || !cell) return;

                        const sameRowMethod = direction === 'prev'
                            ? 'navigateLeft'
                            : 'navigateRight';
                        const wrappingMethod = direction === 'prev'
                            ? 'navigatePrev'
                            : 'navigateNext';
                        const navigationCell = typeof cell._getSelf === 'function'
                            ? cell._getSelf()
                            : cell;

                        if (typeof cell[sameRowMethod] === 'function') {
                            const moved = cell[sameRowMethod]();
                            if (moved) return;

                            if (typeof cell[wrappingMethod] === 'function') {
                                cell[wrappingMethod]();
                                return;
                            }
                        }

                        if (typeof table[sameRowMethod] === 'function'
                            && table[sameRowMethod](navigationCell)) {
                            return;
                        }

                        if (typeof table[wrappingMethod] === 'function') {
                            table[wrappingMethod](navigationCell);
                        }
                    }, 0);
                };

                const commitFromTab = direction => {
                    if (closed || tabCommitInProgress) return;

                    tabCommitInProgress = true;
                    commit();
                    navigateAfterClose(direction);
                };

                const getPickerPopup = () => {
                    if (typeof document.querySelector !== 'function') return null;

                    return document.querySelector('.datepicker.active')
                        || document.querySelector('.datepicker');
                };

                const markPickerPointerDown = event => {
                    if (isPickerFocusTarget(event.target)) {
                        event.stopPropagation();
                        pickerSelectionInProgress = true;
                    }
                };

                const clearPickerPointerState = event => {
                    if (!isPickerFocusTarget(event.target)) return;

                    event.stopPropagation();
                    globalThis.setTimeout(() => {
                        pickerSelectionInProgress = false;
                    }, 0);
                };

                const attachPickerPointerListeners = () => {
                    const popup = getPickerPopup();

                    if (!popup || typeof popup.addEventListener !== 'function') return;

                    pickerPointerPopup = popup;
                    popup.addEventListener('mousedown', markPickerPointerDown, true);
                    popup.addEventListener('click', clearPickerPointerState, true);
                };

                const isPickerFocusTarget = target => {
                    if (!target) return false;

                    const popup = getPickerPopup();

                    return target === pickerButton
                        || target === pickerInput
                        || target === wrapper
                        || (typeof wrapper.contains === 'function' && wrapper.contains(target))
                        || (typeof popup?.contains === 'function' && popup.contains(target));
                };

                const commitManualInputOnBlur = event => {
                    if (
                        closed
                        || pickerSelectionInProgress
                        || normalizedOptions.mode !== 'manualWithPickerButton'
                        || (datepicker?.active && !event.relatedTarget)
                        || isPickerFocusTarget(event.relatedTarget)
                    ) {
                        return;
                    }

                    if (blurTimeout) {
                        globalThis.clearTimeout(blurTimeout);
                    }

                    blurTimeout = globalThis.setTimeout(() => {
                        blurTimeout = null;

                        if (
                            closed
                            || document.activeElement === input
                            || isPickerFocusTarget(document.activeElement)
                        ) {
                            return;
                        }

                        commit();
                    }, 0);
                };

                const getPickerFocusableElements = () => {
                    const pickerElements = getFocusableElements(getPickerPopup());
                    const elements = [pickerInput, ...pickerElements];

                    return elements.filter((element, index) => {
                        return element && elements.indexOf(element) === index;
                    });
                };

                const ensurePickerFocusTrap = () => {
                    if (pickerFocusTrap) return pickerFocusTrap;

                    pickerFocusTrap = createFocusTrap({
                        container: () => getPickerPopup() || wrapper,
                        getElements: getPickerFocusableElements,
                        initialFocus: () => getPickerFocusableElements()[0] || pickerInput,
                        fallbackFocus: () => pickerInput
                    });

                    return pickerFocusTrap;
                };

                const keepPickerArrowInsideEditor = event => {
                    if (
                        !datepicker
                        || !datepicker.active
                        || (
                            event.key !== 'ArrowUp'
                            && event.key !== 'ArrowDown'
                            && event.key !== 'ArrowLeft'
                            && event.key !== 'ArrowRight'
                        )
                    ) {
                        return;
                    }

                    event.stopPropagation();
                };

                handlePickerTabKeydown = event => {
                    if (
                        closed
                        || !datepicker
                        || !datepicker.active
                        || !pickerTabListenerReady
                        || event.key !== 'Tab'
                    ) {
                        return;
                    }

                    event.preventDefault();
                    event.stopPropagation();
                    commitFromTab(event.shiftKey ? 'prev' : 'next');
                };

                handlePickerDocumentKeydown = event => {
                    if (
                        closed
                        || !datepicker
                        || !datepicker.active
                    ) {
                        return;
                    }

                    if (event.key === 'Escape') {
                        event.preventDefault();
                        event.stopPropagation();
                        if (editorBehavior.hasManualInput) {
                            closePickerPopup();
                            return;
                        }

                        closeWithCancel();
                        return;
                    }

                };

                const addPickerKeyboardListener = () => {
                    if (
                        pickerKeyboardListenerAttached
                    ) {
                        return;
                    }

                    document.addEventListener(
                        'keydown',
                        handlePickerDocumentKeydown
                    );
                    pickerKeyboardListenerAttached = true;

                    document.addEventListener(
                        'keydown',
                        handlePickerTabKeydown,
                        true
                    );
                    pickerTabListenerAttached = true;
                    pickerTabListenerReady = true;
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

                    if (datepicker.active) {
                        attachPickerPointerListeners();
                        addPickerKeyboardListener();
                        ensurePickerFocusTrap().activate();

                        try {
                            pickerInput.focus({ preventScroll: true });
                        } catch {
                            pickerInput.focus();
                        }
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

                    if (!date) return;

                    const formattedValue = formatPickerDate(date, normalizedOptions.format);

                    if (editorBehavior.hasManualInput) {
                        pickerSelectionInProgress = true;
                    }

                    input.value = formattedValue;

                    if (editorBehavior.hasManualInput) {
                        closePickerPopup();
                        globalThis.setTimeout(() => {
                            pickerSelectionInProgress = false;
                        }, 0);
                        return;
                    }

                    closeWithSuccess(formattedValue);
                });
                pickerInput.addEventListener('hide', () => {
                    if (closed) return;


                    if (editorBehavior.hasManualInput) {
                        cleanupPickerSession({ restoreFocus: false });
                        focusManualInput();
                        return;
                    }

                    closeWithCancel();
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
                            if (datepicker && !datepicker.active) {
                                event.preventDefault();
                                event.stopPropagation();
                                showPicker();
                                return;
                            }

                            commit();
                            return;
                        }

                        if (event.key === 'Escape') {
                            closeWithCancel();
                        }
                    });
                    input.addEventListener('blur', commitManualInputOnBlur);
                }

                onRendered(() => {
                    datepicker = new Datepicker(pickerInput, createPickerOptions(normalizedOptions));
                    pickerInput.addEventListener('keydown', keepPickerArrowInsideEditor);

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
                if (closed) return;

                const result = parseDateEditorValue(input.value, normalizedOptions);

                if (result.action === 'cancel') {
                    closed = true;
                    cancel();
                    return;
                }

                closed = true;
                success(result.value);
            };

            const navigateAfterClose = direction => {
                globalThis.setTimeout(() => {
                    const table = cell && cell.getTable && cell.getTable();
                    if (!table) return;

                    const sameRowMethod = direction === 'prev'
                        ? 'navigateLeft'
                        : 'navigateRight';
                    const wrappingMethod = direction === 'prev'
                        ? 'navigatePrev'
                        : 'navigateNext';
                    const navigationCell = typeof cell._getSelf === 'function'
                        ? cell._getSelf()
                        : cell;

                    if (typeof cell[sameRowMethod] === 'function') {
                        const moved = cell[sameRowMethod]();
                        if (moved) return;

                        if (typeof cell[wrappingMethod] === 'function') {
                            cell[wrappingMethod]();
                            return;
                        }
                    }

                    if (typeof table[sameRowMethod] === 'function'
                        && table[sameRowMethod](navigationCell)) {
                        return;
                    }

                    if (typeof table[wrappingMethod] === 'function') {
                        table[wrappingMethod](navigationCell);
                    }
                }, 0);
            };

            input.addEventListener('input', sanitizeInput);
            input.addEventListener('keydown', event => {
                if (!isAllowedDateInputKey(event, normalizedOptions.format)) {
                    event.preventDefault();
                    return;
                }

                if (event.key === 'Tab') {
                    event.preventDefault();
                    event.stopPropagation();
                    commit();
                    navigateAfterClose(event.shiftKey ? 'prev' : 'next');
                    return;
                }

                if (event.key === 'Enter') {
                    commit();
                    return;
                }

                if (event.key === 'Escape') {
                    closed = true;
                    cancel();
                }
            });
            input.addEventListener('blur', () => {
                const cellElement = cell
                    && typeof cell.getElement === 'function'
                    && cell.getElement();

                if (
                    closed
                    || input.isConnected === false
                    || !cellElement
                    || !cellElement.classList.contains('tabulator-editing')
                    || !cellElement.contains(input)
                ) {
                    return;
                }

                commit();
            });

            focusInput(input, onRendered, {
                selectOnFocus: normalizedOptions.selectOnFocus
            });
            return input;
        };

        editor._ambEditorType = 'date';

        return editor;
    }

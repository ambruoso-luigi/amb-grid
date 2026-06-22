import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { date as createDateEditor } from '../src/lib/editors/date-editor.js';
import {
    formatPickerDate,
    getDateEditorBehavior,
    isAllowedDateInputKey,
    normalizeDateEditorOptions,
    normalizeDateInputChange,
    parseDateEditorValue,
    sanitizeDateInputCharacters
} from '../src/lib/editors/date-editor-utils.js';

const datepickerState = vi.hoisted(() => ({
    focusedDate: new Date(2026, 6, 20),
    instances: []
}));

vi.mock('vanillajs-datepicker/Datepicker', () => ({
    default: class Datepicker {
        constructor(element, options) {
            this.element = element;
            this.options = options;
            this.active = false;
            this.show = vi.fn(() => {
                this.active = true;
            });
            this.getFocusedDate = vi.fn(() => new Date(datepickerState.focusedDate));
            this.destroy = vi.fn(() => {
                this.active = false;
            });
            datepickerState.instances.push(this);
        }
    }
}));

describe('date editor modes', () => {
    test('maps picker true to manualWithPickerButton', () => {
        expect(normalizeDateEditorOptions({ picker: true }).mode)
            .toBe('manualWithPickerButton');
    });

    test('preserves explicit manual and pickerOnly modes', () => {
        expect(normalizeDateEditorOptions({ mode: 'manual' }).mode).toBe('manual');
        expect(normalizeDateEditorOptions({ mode: 'pickerOnly' }).mode).toBe('pickerOnly');
    });

    test('describes controls and auto-open behavior for each mode', () => {
        expect(getDateEditorBehavior('manual')).toEqual({
            hasManualInput: true,
            hasPickerButton: false,
            autoOpenPicker: false
        });
        expect(getDateEditorBehavior('manualWithPickerButton')).toEqual({
            hasManualInput: true,
            hasPickerButton: true,
            autoOpenPicker: false
        });
        expect(getDateEditorBehavior('pickerOnly')).toEqual({
            hasManualInput: false,
            hasPickerButton: false,
            autoOpenPicker: true
        });
    });

    test('formats picker selections with the configured column format', () => {
        const selectedDate = new Date(2026, 6, 20);

        expect(formatPickerDate(selectedDate, 'dd/mm/yyyy')).toBe('20/07/2026');
        expect(formatPickerDate(selectedDate, 'yyyy-mm-dd')).toBe('2026-07-20');
        expect(formatPickerDate(selectedDate, 'dd-mm-yyyy')).toBe('20-07-2026');
    });
});

describe('date editor input normalization', () => {
    test('allows digits, the configured separator, editing keys, and shortcuts', () => {
        expect(isAllowedDateInputKey({ key: '2' }, 'dd/mm/yyyy')).toBe(true);
        expect(isAllowedDateInputKey({ key: '/' }, 'dd/mm/yyyy')).toBe(true);
        expect(isAllowedDateInputKey({ key: '-', ctrlKey: false }, 'dd/mm/yyyy'))
            .toBe(false);
        expect(isAllowedDateInputKey({ key: 'Backspace' }, 'dd/mm/yyyy')).toBe(true);
        expect(isAllowedDateInputKey({ key: 'ArrowLeft' }, 'dd/mm/yyyy')).toBe(true);
        expect(isAllowedDateInputKey({ key: 'a', ctrlKey: true }, 'dd/mm/yyyy'))
            .toBe(true);
        expect(isAllowedDateInputKey({ key: 'k', ctrlKey: true }, 'dd/mm/yyyy'))
            .toBe(false);
        expect(isAllowedDateInputKey({ key: 'k' }, 'dd/mm/yyyy')).toBe(false);
    });

    test('filters letters and unsupported paste characters predictably', () => {
        expect(sanitizeDateInputCharacters('20a07b2026', 'dd/mm/yyyy'))
            .toBe('20072026');
        expect(sanitizeDateInputCharacters('jj///kk', 'dd/mm/yyyy'))
            .toBe('///');
        expect(sanitizeDateInputCharacters('2026/06/05', 'yyyy-mm-dd'))
            .toBe('20260605');
        expect(normalizeDateInputChange({
            value: '20a/07b/2026',
            format: 'dd/mm/yyyy',
            selectionStart: 12,
            inputType: 'insertFromPaste'
        })).toEqual({
            value: '20/07/2026',
            selectionStart: 10
        });
    });

    test('auto-inserts separators only for linear digit typing', () => {
        expect(normalizeDateInputChange({
            value: '20072026',
            format: 'dd/mm/yyyy',
            selectionStart: 8,
            inputType: 'insertText'
        })).toEqual({
            value: '20/07/2026',
            selectionStart: 10
        });

        expect(normalizeDateInputChange({
            value: '20260605',
            format: 'yyyy-mm-dd',
            selectionStart: 8,
            inputType: 'insertText'
        })).toEqual({
            value: '2026-06-05',
            selectionStart: 10
        });
    });

    test('continues auto-formatting after auto-inserted separators', () => {
        expect(normalizeDateInputChange({
            value: '20/072',
            format: 'dd/mm/yyyy',
            selectionStart: 6,
            inputType: 'insertText'
        })).toEqual({
            value: '20/07/2',
            selectionStart: 7
        });

        expect(normalizeDateInputChange({
            value: '2026-060',
            format: 'yyyy-mm-dd',
            selectionStart: 8,
            inputType: 'insertText'
        })).toEqual({
            value: '2026-06-0',
            selectionStart: 9
        });
    });

    test('preserves manually typed separators', () => {
        expect(normalizeDateInputChange({
            value: '20/7/2026',
            format: 'dd/mm/yyyy',
            selectionStart: 9,
            inputType: 'insertText'
        })).toEqual({
            value: '20/7/2026',
            selectionStart: 9
        });

        expect(normalizeDateInputChange({
            value: '2026-06-5',
            format: 'yyyy-mm-dd',
            selectionStart: 9,
            inputType: 'insertText'
        })).toEqual({
            value: '2026-06-5',
            selectionStart: 9
        });
    });

    test('preserves plausible but invalid date input for validation', () => {
        expect(normalizeDateInputChange({
            value: '31/02/2026',
            format: 'dd/mm/yyyy',
            selectionStart: 10,
            inputType: 'insertText'
        })).toEqual({
            value: '31/02/2026',
            selectionStart: 10
        });

        expect(normalizeDateInputChange({
            value: '20/022',
            format: 'dd/mm/yyyy',
            selectionStart: 6,
            inputType: 'insertFromPaste'
        })).toEqual({
            value: '20/022',
            selectionStart: 6
        });
    });

    test('does not auto-format deletion or middle edits', () => {
        expect(normalizeDateInputChange({
            value: '',
            format: 'dd/mm/yyyy',
            selectionStart: 0,
            inputType: 'deleteContentBackward'
        })).toEqual({
            value: '',
            selectionStart: 0
        });

        expect(normalizeDateInputChange({
            value: '20072026',
            format: 'dd/mm/yyyy',
            selectionStart: 4,
            inputType: 'insertText'
        })).toEqual({
            value: '20072026',
            selectionStart: 4
        });
    });

    test('keeps compact dates strict and unseparated', () => {
        expect(normalizeDateInputChange({
            value: '2026720',
            format: 'yyyymmdd',
            selectionStart: 7,
            inputType: 'insertText'
        })).toEqual({
            value: '2026720',
            selectionStart: 7
        });
    });
});

describe('date editor commit behavior', () => {
    test('commits invalid raw values by default', () => {
        expect(parseDateEditorValue('31/02/2026', {
            format: 'dd/mm/yyyy'
        })).toEqual({
            action: 'success',
            value: '31/02/2026'
        });
    });

    test('can cancel invalid values', () => {
        expect(parseDateEditorValue('31/02/2026', {
            format: 'dd/mm/yyyy',
            invalidBehavior: 'cancel'
        })).toEqual({
            action: 'cancel'
        });
    });

    test('normalizes valid values on commit', () => {
        expect(parseDateEditorValue('20/7/2026', {
            format: 'dd/mm/yyyy'
        })).toEqual({
            action: 'success',
            value: '20/07/2026'
        });
    });

    test('commits manual invalid picker input as raw with commitRaw', () => {
        expect(parseDateEditorValue('31/02/2026', {
            format: 'dd/mm/yyyy',
            picker: true,
            invalidBehavior: 'commitRaw'
        })).toEqual({
            action: 'success',
            value: '31/02/2026'
        });

        expect(parseDateEditorValue('20/022', {
            format: 'dd/mm/yyyy',
            picker: true,
            invalidBehavior: 'commitRaw'
        })).toEqual({
            action: 'success',
            value: '20/022'
        });
    });

    test('manual out-of-range picker input remains committed for validation', () => {
        expect(parseDateEditorValue('01/01/2028', {
            format: 'dd/mm/yyyy',
            picker: true,
            minDate: '2025-01-01',
            maxDate: '2027-12-31'
        })).toEqual({
            action: 'success',
            value: '01/01/2028'
        });
    });
});

const createElement = tagName => {
    const listeners = new Map();

    return {
        tagName,
        children: [],
        classList: {
            toggle() {}
        },
        value: '',
        selectionStart: 0,
        selectionEnd: 0,
        append(...children) {
            this.children.push(...children);
        },
        setAttribute(name, value) {
            this[name] = value;
        },
        addEventListener(type, listener) {
            listeners.set(type, listener);
        },
        async dispatch(type, event = {}) {
            const dispatchedEvent = {
                preventDefault: vi.fn(),
                stopImmediatePropagation: vi.fn(),
                stopPropagation: vi.fn(),
                ...event
            };

            await listeners.get(type)?.(dispatchedEvent);
            return dispatchedEvent;
        },
        focus() {},
        select() {},
        setSelectionRange(start, end) {
            this.selectionStart = start;
            this.selectionEnd = end;
        },
        closest() {
            return null;
        }
    };
};

const createPickerHarness = (options = {}) => {
    const table = {
        navigateNext: vi.fn(),
        navigatePrev: vi.fn()
    };
    const createRowCell = editor => ({
        edit: vi.fn(),
        getColumn: () => ({
            getDefinition: () => ({ editor })
        })
    });
    const fuelCell = createRowCell('number');
    const hiddenCell = {
        edit: vi.fn(),
        getColumn: () => ({
            getDefinition: () => ({
                editor: 'text',
                visible: false
            })
        })
    };
    const displayCell = createRowCell(false);
    const afterDateCell = createRowCell('text');
    const notesCell = createRowCell('textarea');
    let rowCells = [];
    const row = {
        getCells: () => rowCells
    };
    const cell = {
        getValue: () => '20/07/2026',
        getTable: () => table,
        getRow: () => row,
        getColumn: () => ({
            getDefinition: () => ({ editor: 'date' })
        }),
        navigateNext: vi.fn(),
        navigatePrev: vi.fn()
    };

    rowCells = [
        fuelCell,
        cell,
        hiddenCell,
        displayCell,
        afterDateCell,
        notesCell
    ];
    const success = vi.fn();
    const cancel = vi.fn();
    const editor = createDateEditor({
        format: 'dd/mm/yyyy',
        picker: true,
        ...options
    });
    const wrapper = editor(cell, callback => callback(), success, cancel);
    const isPickerOnly = options.mode === 'pickerOnly';

    return {
        afterDateCell,
        cancel,
        cell,
        displayCell,
        fuelCell,
        hiddenCell,
        input: isPickerOnly ? null : wrapper.children[0],
        notesCell,
        pickerButton: isPickerOnly ? null : wrapper.children[1],
        pickerInput: isPickerOnly ? wrapper.children[0] : wrapper.children[2],
        success,
        table
    };
};

const flushDeferred = () => new Promise(resolve => {
    globalThis.setTimeout(resolve, 0);
});

describe('date editor picker keyboard navigation', () => {
    const originalDocument = globalThis.document;
    const originalWindow = globalThis.window;
    let documentListeners;

    beforeEach(() => {
        delete globalThis.__AMB_DEBUG_DATE_EDITOR__;
        delete globalThis.__AMB_DEBUG_DATE_EDITOR_BREAK__;
        datepickerState.focusedDate = new Date(2026, 6, 20);
        datepickerState.instances.length = 0;
        documentListeners = [];
        globalThis.document = {
            activeElement: null,
            addEventListener: vi.fn((type, listener, capture) => {
                documentListeners.push({ capture, listener, type });
            }),
            body: {},
            createElement,
            removeEventListener: vi.fn((type, listener, capture) => {
                documentListeners = documentListeners.filter(entry => {
                    return entry.type !== type
                        || entry.listener !== listener
                        || entry.capture !== capture;
                });
            }),
            async dispatch(type, event = {}) {
                const dispatchedEvent = {
                    preventDefault: vi.fn(),
                    stopPropagation: vi.fn(),
                    ...event
                };

                documentListeners
                    .filter(entry => entry.type === type)
                    .forEach(entry => entry.listener(dispatchedEvent));

                return dispatchedEvent;
            }
        };
        globalThis.window = {
            clearTimeout: globalThis.clearTimeout,
            setTimeout: globalThis.setTimeout
        };
    });

    afterEach(() => {
        delete globalThis.__AMB_DEBUG_DATE_EDITOR__;
        delete globalThis.__AMB_DEBUG_DATE_EDITOR_BREAK__;
        globalThis.document = originalDocument;
        globalThis.window = originalWindow;
        vi.restoreAllMocks();
    });

    test('Tab commits and navigates next without a duplicate blur commit', async () => {
        const harness = createPickerHarness();
        const event = await harness.input.dispatch('keydown', {
            key: 'Tab'
        });

        await harness.input.dispatch('blur');
        await flushDeferred();

        expect(event.preventDefault).toHaveBeenCalledOnce();
        expect(harness.success).toHaveBeenCalledOnce();
        expect(harness.success).toHaveBeenCalledWith('20/07/2026');
        expect(harness.afterDateCell.edit).toHaveBeenCalledOnce();
        expect(harness.hiddenCell.edit).not.toHaveBeenCalled();
        expect(harness.displayCell.edit).not.toHaveBeenCalled();
        expect(harness.notesCell.edit).not.toHaveBeenCalled();
        expect(harness.cell.navigateNext).not.toHaveBeenCalled();
        expect(harness.cell.navigatePrev).not.toHaveBeenCalled();
        expect(harness.table.navigateNext).not.toHaveBeenCalled();
        expect(harness.table.navigatePrev).not.toHaveBeenCalled();
    });

    test('Shift+Tab commits and navigates previous', async () => {
        const harness = createPickerHarness();
        const event = await harness.input.dispatch('keydown', {
            key: 'Tab',
            shiftKey: true
        });

        await flushDeferred();

        expect(event.preventDefault).toHaveBeenCalledOnce();
        expect(harness.success).toHaveBeenCalledOnce();
        expect(harness.fuelCell.edit).toHaveBeenCalledOnce();
        expect(harness.cell.navigatePrev).not.toHaveBeenCalled();
        expect(harness.cell.navigateNext).not.toHaveBeenCalled();
        expect(harness.table.navigatePrev).not.toHaveBeenCalled();
        expect(harness.table.navigateNext).not.toHaveBeenCalled();
    });

    test('Enter commits without forcing navigation', async () => {
        const harness = createPickerHarness();

        await harness.input.dispatch('keydown', {
            key: 'Enter'
        });
        await flushDeferred();

        expect(harness.success).toHaveBeenCalledOnce();
        expect(harness.cell.navigateNext).not.toHaveBeenCalled();
        expect(harness.cell.navigatePrev).not.toHaveBeenCalled();
        expect(harness.table.navigateNext).not.toHaveBeenCalled();
        expect(harness.table.navigatePrev).not.toHaveBeenCalled();
    });

    test('Escape cancels without navigating', async () => {
        const harness = createPickerHarness();

        await harness.input.dispatch('keydown', {
            key: 'Escape'
        });
        await flushDeferred();

        expect(harness.cancel).toHaveBeenCalledOnce();
        expect(harness.success).not.toHaveBeenCalled();
        expect(harness.cell.navigateNext).not.toHaveBeenCalled();
        expect(harness.cell.navigatePrev).not.toHaveBeenCalled();
    });

    test('picker button is outside the tab order and still opens the picker', async () => {
        const harness = createPickerHarness();
        const datepicker = datepickerState.instances[0];

        expect(harness.pickerButton.tabIndex).toBe(-1);

        await harness.pickerButton.dispatch('click');

        expect(datepicker.show).toHaveBeenCalledOnce();
    });

    test('pickerOnly opens the picker on render', () => {
        createPickerHarness({
            mode: 'pickerOnly',
            picker: false
        });
        const datepicker = datepickerState.instances[0];

        expect(datepicker.show).toHaveBeenCalledOnce();
        expect(datepicker.active).toBe(true);
        expect(globalThis.document.addEventListener).toHaveBeenCalledWith(
            'keydown',
            expect.any(Function),
            true
        );
    });

    test('pickerOnly document Tab commits the focused date, closes, and navigates next', async () => {
        const harness = createPickerHarness({
            mode: 'pickerOnly',
            picker: false
        });
        const datepicker = datepickerState.instances[0];
        const event = await globalThis.document.dispatch('keydown', {
            key: 'Tab'
        });

        await flushDeferred();

        expect(event.preventDefault).toHaveBeenCalledOnce();
        expect(event.stopPropagation).toHaveBeenCalledOnce();
        expect(datepicker.getFocusedDate).toHaveBeenCalledOnce();
        expect(harness.success).toHaveBeenCalledOnce();
        expect(harness.success).toHaveBeenCalledWith('20/07/2026');
        expect(datepicker.destroy).toHaveBeenCalledOnce();
        expect(datepicker.active).toBe(false);
        expect(harness.afterDateCell.edit).toHaveBeenCalledOnce();
        expect(globalThis.document.removeEventListener).toHaveBeenCalledWith(
            'keydown',
            expect.any(Function),
            true
        );
        expect(documentListeners).toHaveLength(0);
    });

    test('pickerOnly document Shift+Tab commits the focused date and navigates previous', async () => {
        const harness = createPickerHarness({
            mode: 'pickerOnly',
            picker: false
        });
        const event = await globalThis.document.dispatch('keydown', {
            key: 'Tab',
            shiftKey: true
        });

        await flushDeferred();

        expect(event.preventDefault).toHaveBeenCalledOnce();
        expect(harness.success).toHaveBeenCalledWith('20/07/2026');
        expect(harness.fuelCell.edit).toHaveBeenCalledOnce();
        expect(harness.afterDateCell.edit).not.toHaveBeenCalled();
    });

    test('pickerOnly document ArrowUp is left to the datepicker', async () => {
        const harness = createPickerHarness({
            mode: 'pickerOnly',
            picker: false
        });
        const event = await globalThis.document.dispatch('keydown', {
            key: 'ArrowUp'
        });

        await flushDeferred();

        expect(event.preventDefault).not.toHaveBeenCalled();
        expect(event.stopPropagation).not.toHaveBeenCalled();
        expect(harness.success).not.toHaveBeenCalled();
        expect(harness.cancel).not.toHaveBeenCalled();
        expect(harness.afterDateCell.edit).not.toHaveBeenCalled();
        expect(harness.fuelCell.edit).not.toHaveBeenCalled();
    });

    test('pickerOnly replaces the keyboard listener cleanly between rows', async () => {
        const firstHarness = createPickerHarness({
            mode: 'pickerOnly',
            picker: false
        });

        await firstHarness.pickerInput.dispatch('hide');

        expect(documentListeners).toHaveLength(0);

        const secondHarness = createPickerHarness({
            mode: 'pickerOnly',
            picker: false
        });
        const arrowEvent = await globalThis.document.dispatch('keydown', {
            key: 'ArrowUp'
        });
        const tabEvent = await globalThis.document.dispatch('keydown', {
            key: 'Tab'
        });

        await flushDeferred();

        expect(documentListeners).toHaveLength(0);
        expect(arrowEvent.preventDefault).not.toHaveBeenCalled();
        expect(tabEvent.preventDefault).toHaveBeenCalledOnce();
        expect(firstHarness.success).not.toHaveBeenCalled();
        expect(secondHarness.success).toHaveBeenCalledWith('20/07/2026');
        expect(secondHarness.afterDateCell.edit).toHaveBeenCalledOnce();
    });

    test('pickerOnly changeDate commits without forced navigation', async () => {
        const harness = createPickerHarness({
            mode: 'pickerOnly',
            picker: false
        });

        await harness.pickerInput.dispatch('changeDate', {
            detail: {
                date: new Date(2026, 7, 9)
            }
        });
        await flushDeferred();

        expect(harness.success).toHaveBeenCalledWith('09/08/2026');
        expect(harness.afterDateCell.edit).not.toHaveBeenCalled();
        expect(harness.fuelCell.edit).not.toHaveBeenCalled();
        expect(documentListeners).toHaveLength(0);
    });

    test('pickerOnly hide cancels without navigation', async () => {
        const harness = createPickerHarness({
            mode: 'pickerOnly',
            picker: false
        });

        await harness.pickerInput.dispatch('hide');
        await flushDeferred();

        expect(harness.cancel).toHaveBeenCalledOnce();
        expect(harness.success).not.toHaveBeenCalled();
        expect(harness.afterDateCell.edit).not.toHaveBeenCalled();
        expect(harness.fuelCell.edit).not.toHaveBeenCalled();
        expect(globalThis.document.removeEventListener).toHaveBeenCalledWith(
            'keydown',
            expect.any(Function),
            true
        );
        expect(documentListeners).toHaveLength(0);
    });

    test('date editor debug is silent by default', () => {
        const debugSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

        createPickerHarness({
            mode: 'pickerOnly',
            picker: false
        });

        expect(debugSpy).not.toHaveBeenCalled();
        expect(documentListeners).toHaveLength(1);
    });

    test('pickerOnly debug logs document capture without blocking arrow keys', async () => {
        globalThis.__AMB_DEBUG_DATE_EDITOR__ = true;
        const debugSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
        const harness = createPickerHarness({
            mode: 'pickerOnly',
            picker: false
        });
        const event = await globalThis.document.dispatch('keydown', {
            key: 'ArrowUp',
            target: {
                className: 'datepicker-cell focused',
                tagName: 'SPAN'
            }
        });

        expect(documentListeners).toHaveLength(2);
        expect(event.preventDefault).not.toHaveBeenCalled();
        expect(event.stopPropagation).not.toHaveBeenCalled();
        expect(harness.success).not.toHaveBeenCalled();
        expect(debugSpy).toHaveBeenCalledWith(
            '[AMB date editor]',
            'document keydown capture',
            expect.objectContaining({
                key: 'ArrowUp',
                pickerActive: true
            })
        );

        await harness.pickerInput.dispatch('hide');

        expect(documentListeners).toHaveLength(0);
    });

    test('pickerOnly debug listener is removed after success', async () => {
        globalThis.__AMB_DEBUG_DATE_EDITOR__ = true;
        vi.spyOn(console, 'log').mockImplementation(() => {});
        const harness = createPickerHarness({
            mode: 'pickerOnly',
            picker: false
        });

        await harness.pickerInput.dispatch('changeDate', {
            detail: {
                date: new Date(2026, 7, 9)
            }
        });

        expect(harness.success).toHaveBeenCalledWith('09/08/2026');
        expect(documentListeners).toHaveLength(0);
        expect(globalThis.document.removeEventListener).toHaveBeenCalledTimes(2);
    });

    test('pickerInput debug logs keydown without changing behavior', async () => {
        globalThis.__AMB_DEBUG_DATE_EDITOR__ = true;
        const debugSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
        const harness = createPickerHarness({
            mode: 'pickerOnly',
            picker: false
        });
        const event = await harness.pickerInput.dispatch('keydown', {
            key: 'ArrowLeft',
            target: harness.pickerInput
        });

        expect(event.preventDefault).not.toHaveBeenCalled();
        expect(harness.success).not.toHaveBeenCalled();
        expect(debugSpy).toHaveBeenCalledWith(
            '[AMB date editor]',
            'pickerInput keydown',
            expect.objectContaining({
                key: 'ArrowLeft',
                pickerActive: true
            })
        );
    });
});

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
            this.destroy = vi.fn();
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

const createPickerHarness = () => {
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
        picker: true
    });
    const wrapper = editor(cell, callback => callback(), success, cancel);

    return {
        afterDateCell,
        cancel,
        cell,
        displayCell,
        fuelCell,
        hiddenCell,
        input: wrapper.children[0],
        notesCell,
        pickerButton: wrapper.children[1],
        pickerInput: wrapper.children[2],
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

    beforeEach(() => {
        datepickerState.instances.length = 0;
        globalThis.document = {
            activeElement: null,
            body: {},
            createElement
        };
        globalThis.window = {
            clearTimeout: globalThis.clearTimeout,
            setTimeout: globalThis.setTimeout
        };
    });

    afterEach(() => {
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
});

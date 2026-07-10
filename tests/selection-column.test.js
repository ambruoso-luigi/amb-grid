import { describe, expect, test, vi } from 'vitest';
import { navigateEditableCellAfterClose } from '../src/lib/editors/shared.js';
import { createSelectionColumn } from '../src/lib/table/selection-column.js';

const createKeyboardEvent = (key, target = {}) => ({
    key,
    target,
    preventDefault: vi.fn(),
    shiftKey: false,
    stopImmediatePropagation: vi.fn(),
    stopPropagation: vi.fn()
});

const createCell = row => ({
    getRow: () => row,
    getColumn: () => ({
        getDefinition: () => ({})
    })
});

const createEditableCell = () => ({
    edit: vi.fn(),
    getColumn: () => ({
        getDefinition: () => ({ editor: 'input' })
    })
});

const flushDeferred = () => new Promise(resolve => {
    globalThis.setTimeout(resolve, 0);
});

describe('selection column keyboard access', () => {
    test('keeps the selection column as a native checkbox control', () => {
        const controller = createSelectionColumn({ enabled: true });

        expect(controller.column.formatter).toEqual(expect.any(Function));
        expect(controller.column.cssClass).toBe('amb-selection-column');
        expect(controller.column.editor).toBeUndefined();
        expect(controller.column.field).toBeUndefined();
        expect(controller.column.headerSort).toBe(false);
    });

    test('marks the selection column as an AMB interactive navigation target', () => {
        const controller = createSelectionColumn({ enabled: true });

        expect(controller.column._ambInteractive).toBe(true);
        expect(controller.column._ambFocusSelector).toBe('.amb-selection-column__input');
    });

    test('multiple mode allows multiple selected rows', () => {
        const controller = createSelectionColumn({
            enabled: true,
            mode: 'multiple'
        });

        expect(controller.selectableRows).toBe(true);
        expect(controller.column.titleFormatter).toBe('rowSelection');
    });

    test('single mode allows only one selected row', () => {
        const controller = createSelectionColumn({
            enabled: true,
            mode: 'single'
        });

        expect(controller.selectableRows).toBe(1);
        expect(controller.column.titleFormatter()).toBe('');
        expect(controller.column.titleFormatterParams).toBeUndefined();
    });

    test('single mode clears the table selection before selecting a row from the checkbox', () => {
        const controller = createSelectionColumn({
            enabled: true,
            mode: 'single'
        });
        const table = { deselectRow: vi.fn() };
        const row = {
            getTable: () => table,
            select: vi.fn()
        };
        const input = renderSelectionInput(controller, row);

        input.checked = true;
        input.dispatch('change');

        expect(table.deselectRow).toHaveBeenCalledOnce();
        expect(row.select).toHaveBeenCalledOnce();
    });

    test('Enter toggles the row selection through the Tabulator row API', () => {
        const controller = createSelectionColumn({ enabled: true });
        const row = { toggleSelect: vi.fn() };
        const event = createKeyboardEvent('Enter');

        const input = renderSelectionInput(controller, row);

        input.dispatch('keydown', event);

        expect(row.toggleSelect).toHaveBeenCalledOnce();
        expect(event.preventDefault).toHaveBeenCalledOnce();
        expect(event.stopPropagation).toHaveBeenCalledOnce();
    });

    test('1/S select and 0/N deselect using the same convention as AMB cbox editors', () => {
        const controller = createSelectionColumn({ enabled: true });
        const row = {
            select: vi.fn(),
            deselect: vi.fn()
        };
        const input = renderSelectionInput(controller, row);

        input.dispatch('keydown', createKeyboardEvent('1'));
        input.dispatch('keydown', createKeyboardEvent('S'));
        input.dispatch('keydown', createKeyboardEvent('0'));
        input.dispatch('keydown', createKeyboardEvent('N'));

        expect(row.select).toHaveBeenCalledTimes(2);
        expect(row.deselect).toHaveBeenCalledTimes(2);
    });

    test('Space toggles the row selection through the Tabulator row API', () => {
        const controller = createSelectionColumn({ enabled: true });
        const row = { toggleSelect: vi.fn() };
        const event = createKeyboardEvent(' ');
        const input = renderSelectionInput(controller, row);

        input.dispatch('keydown', event);

        expect(row.toggleSelect).toHaveBeenCalledOnce();
        expect(event.preventDefault).toHaveBeenCalledOnce();
        expect(event.stopPropagation).toHaveBeenCalledOnce();
    });

    test('Tab from the selection column navigates to the next AMB editable cell', async () => {
        const controller = createSelectionColumn({ enabled: true });
        const nextCell = createEditableCell();
        let selectionCell;
        const row = {
            getCells: () => [selectionCell, nextCell]
        };
        const input = renderSelectionInput(controller, row, renderedInput => {
            selectionCell = createSelectionCell(controller, row, renderedInput);
            return selectionCell;
        });
        const event = createKeyboardEvent('Tab');

        input.dispatch('keydown', event);

        expect(event.preventDefault).toHaveBeenCalledOnce();
        expect(event.stopPropagation).toHaveBeenCalledOnce();
        expect(event.stopImmediatePropagation).toHaveBeenCalledOnce();
        await flushDeferred();
        expect(nextCell.edit).toHaveBeenCalledOnce();
    });

    test('Shift+Tab from the selection column navigates to the previous AMB editable cell', async () => {
        const controller = createSelectionColumn({ enabled: true });
        const previousCell = createEditableCell();
        let selectionCell;
        const row = {
            getCells: () => [previousCell, selectionCell]
        };
        const input = renderSelectionInput(controller, row, renderedInput => {
            selectionCell = createSelectionCell(controller, row, renderedInput);
            return selectionCell;
        });
        const event = createKeyboardEvent('Tab');

        event.shiftKey = true;
        input.dispatch('keydown', event);

        expect(event.preventDefault).toHaveBeenCalledOnce();
        expect(event.stopPropagation).toHaveBeenCalledOnce();
        await flushDeferred();
        expect(previousCell.edit).toHaveBeenCalledOnce();
    });

    test('AMB navigation focuses the selection checkbox instead of skipping the selection column', async () => {
        const controller = createSelectionColumn({ enabled: true });
        const input = { focus: vi.fn() };
        let startCell;
        let selectionCell;
        const row = {
            getCells: () => [startCell, selectionCell]
        };

        startCell = {
            getRow: () => row
        };
        selectionCell = createSelectionCell(controller, row, input);

        navigateEditableCellAfterClose(startCell, 'next');

        await flushDeferred();
        expect(input.focus).toHaveBeenCalledOnce();
    });
});

const createSelectionCell = (controller, row, input) => ({
    getRow: () => row,
    getColumn: () => ({
        getDefinition: () => controller.column
    }),
    getElement: () => ({
        querySelector: selector => {
            return selector === '.amb-selection-column__input'
                ? input
                : null;
        }
    })
});

const renderSelectionInput = (controller, row, cellOrFactory) => {
    const originalDocument = globalThis.document;
    const input = {
        type: '',
        className: '',
        checked: false,
        attributes: {},
        listeners: {},
        addEventListener(type, handler) {
            this.listeners[type] = handler;
        },
        setAttribute(name, value) {
            this.attributes[name] = value;
        },
        closest(selector) {
            return selector === '.amb-selection-column__input' ? this : null;
        },
        dispatch(type, event) {
            this.listeners[type]?.({
                target: this,
                ...event
            });
        },
        focus: vi.fn()
    };
    const cell = typeof cellOrFactory === 'function'
        ? cellOrFactory(input)
        : cellOrFactory || createCell(row);

    globalThis.document = {
        createElement: vi.fn(() => input)
    };

    try {
        controller.column.formatter(cell);
        return input;
    } finally {
        globalThis.document = originalDocument;
    }
};

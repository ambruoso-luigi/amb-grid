import { describe, expect, test, vi } from 'vitest';
import { createSelectionColumn } from '../src/lib/table/selection-column.js';

const createKeyboardEvent = (key, target = {}) => ({
    key,
    target,
    preventDefault: vi.fn(),
    stopPropagation: vi.fn()
});

const createNativeCheckboxTarget = () => ({
    closest: selector => {
        return selector === '.amb-selection-column__input'
            ? {}
            : null;
    }
});

const createCell = row => ({
    getRow: () => row
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

    test('Space is left to the native checkbox when the real rowSelection input has focus', () => {
        const controller = createSelectionColumn({ enabled: true });
        const row = { toggleSelect: vi.fn() };
        const event = createKeyboardEvent(' ', createNativeCheckboxTarget());
        const input = renderSelectionInput(controller, row);

        input.dispatch('keydown', event);

        expect(row.toggleSelect).not.toHaveBeenCalled();
        expect(event.preventDefault).not.toHaveBeenCalled();
    });
});

const renderSelectionInput = (controller, row) => {
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
        }
    };

    globalThis.document = {
        createElement: vi.fn(() => input)
    };

    try {
        controller.column.formatter(createCell(row));
        return input;
    } finally {
        globalThis.document = originalDocument;
    }
};

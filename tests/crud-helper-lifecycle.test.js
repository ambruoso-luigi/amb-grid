import { describe, expect, test, vi } from 'vitest';
import { CrudHelper, ROW_STATE } from '../src/lib/crud-helper.js';

const createRowMock = (data = {}) => {
    const element = { dataset: {} };

    return {
        element,
        getData: () => data,
        getElement: () => element,
        update: patch => {
            Object.assign(data, patch);
        }
    };
};

const createTableMock = (rows = []) => {
    const handlers = new Map();
    const offCalls = [];

    return {
        handlers,
        offCalls,
        destroy: vi.fn(),
        getRows: vi.fn(() => rows),
        on: vi.fn((eventName, handler) => {
            handlers.set(eventName, handler);
        }),
        off: vi.fn((eventName, handler) => {
            expect(handlers.get(eventName)).toBe(handler);
            offCalls.push({ eventName, handler });
            handlers.delete(eventName);
        })
    };
};

describe('CrudHelper destroy lifecycle', () => {
    test('removes registered Tabulator handlers without destroying the table', () => {
        const table = createTableMock();
        const crud = new CrudHelper(table);

        expect(table.on).toHaveBeenCalledWith('tableBuilt', expect.any(Function));
        expect(table.on).toHaveBeenCalledWith('cellEdited', expect.any(Function));
        expect(table.on).toHaveBeenCalledWith('renderComplete', expect.any(Function));
        expect(table.handlers.size).toBe(3);

        crud.destroy();

        expect(table.off).toHaveBeenCalledTimes(3);
        expect(table.offCalls.map(call => call.eventName).sort())
            .toEqual(['cellEdited', 'renderComplete', 'tableBuilt']);
        expect(table.handlers.size).toBe(0);
        expect(table.destroy).not.toHaveBeenCalled();
    });

    test('is idempotent and clears internal tracking maps', () => {
        const table = createTableMock();
        const crud = new CrudHelper(table);

        crud.originalRows.set(1, { id: 1, name: 'Before' });
        crud.modifiedCells.set(1, new Set(['name']));
        crud.cellErrors.set(1, new Map([['name', 'Invalid']]));
        crud.cellValidators.set('name', [{ message: 'Required', validateFn: () => true }]);
        crud.rowErrors.set(1, 'Invalid row');
        crud.on('row-state-changed', () => {});

        crud.destroy();
        crud.destroy();

        expect(table.off).toHaveBeenCalledTimes(3);
        expect(crud.originalRows.size).toBe(0);
        expect(crud.modifiedCells.size).toBe(0);
        expect(crud.cellErrors.size).toBe(0);
        expect(crud.cellValidators.size).toBe(0);
        expect(crud.rowErrors.size).toBe(0);
        expect(crud.eventHandlers.size).toBe(0);
        expect(crud.tabulatorEventHandlers.size).toBe(0);
        expect(table.destroy).not.toHaveBeenCalled();
    });

    test('assigns AMB row parity from active row order after each render', () => {
        const first = createRowMock({ id: 1 });
        const second = createRowMock({ id: 2, _state: ROW_STATE.MODIFIED });
        const third = createRowMock({ id: 3, _state: ROW_STATE.DELETED });
        const rows = [first, second, third];
        const table = createTableMock(rows);
        const crud = new CrudHelper(table);

        expect(rows.map(row => row.element.dataset.ambRowParity))
            .toEqual(['odd', 'even', 'odd']);
        expect(rows.map(row => row.element.dataset.state))
            .toEqual([ROW_STATE.CLEAN, ROW_STATE.MODIFIED, ROW_STATE.DELETED]);
        expect(table.getRows).toHaveBeenCalledWith('active');

        rows.splice(0, rows.length, third, first, second);
        table.handlers.get('renderComplete')();

        expect(rows.map(row => row.element.dataset.ambRowParity))
            .toEqual(['odd', 'even', 'odd']);
        expect(third.element.dataset.ambRowParity).toBe('odd');
        expect(first.element.dataset.ambRowParity).toBe('even');
        expect(second.element.dataset.ambRowParity).toBe('odd');

        crud.destroy();
    });
});

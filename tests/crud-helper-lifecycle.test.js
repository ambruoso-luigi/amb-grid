import { describe, expect, test, vi } from 'vitest';
import { CrudHelper } from '../src/lib/crud-helper.js';

const createTableMock = () => {
    const handlers = new Map();
    const offCalls = [];

    return {
        handlers,
        offCalls,
        destroy: vi.fn(),
        getRows: vi.fn(() => []),
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
        expect(table.handlers.size).toBe(2);

        crud.destroy();

        expect(table.off).toHaveBeenCalledTimes(2);
        expect(table.offCalls.map(call => call.eventName).sort())
            .toEqual(['cellEdited', 'tableBuilt']);
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

        expect(table.off).toHaveBeenCalledTimes(2);
        expect(crud.originalRows.size).toBe(0);
        expect(crud.modifiedCells.size).toBe(0);
        expect(crud.cellErrors.size).toBe(0);
        expect(crud.cellValidators.size).toBe(0);
        expect(crud.rowErrors.size).toBe(0);
        expect(crud.eventHandlers.size).toBe(0);
        expect(crud.tabulatorEventHandlers.size).toBe(0);
        expect(table.destroy).not.toHaveBeenCalled();
    });
});

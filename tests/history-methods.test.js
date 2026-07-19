import { describe, expect, test, vi } from 'vitest';

import { createHistoryMethods } from '../src/lib/table/controller/history-methods.js';

const forbiddenMethodNames = [
    'undo',
    'redo',
    'clearHistory',
    'getData',
    'getRows',
    'getColumns',
    'setData',
    'replaceData',
    'updateData',
    'addData',
    'setFilter',
    'clearFilter',
    'refreshFilter',
    'setSort',
    'clearSort',
    'setPage',
    'setPageSize',
    'selectRow',
    'deselectRow',
    'redraw',
    'getSavePayload',
    'getStateReport',
    'validateRow',
    'validateAll',
    'updateRowFields',
    'findRowByKey',
    'addRow',
    'deleteRow',
    'rollbackRow'
];

const createForbiddenMethods = () => Object.fromEntries(
    forbiddenMethodNames.map(name => [name, vi.fn()])
);

const expectForbiddenMethodsNotCalled = target => {
    forbiddenMethodNames.forEach(name => {
        expect(target[name]).not.toHaveBeenCalled();
    });
};

describe('AMB table controller history-reading method group', () => {
    test('exposes exactly the flat history-reading controller methods', () => {
        const methods = createHistoryMethods({
            table: {}
        });

        expect(Object.keys(methods).sort()).toEqual([
            'getHistoryRedoSize',
            'getHistoryUndoSize'
        ]);
        expect(Object.values(methods).every(method => typeof method === 'function')).toBe(true);
    });

    test('returns undo history counts without calculating or mutating history', () => {
        const table = {
            ...createForbiddenMethods(),
            getHistoryUndoSize: vi.fn()
                .mockReturnValueOnce(0)
                .mockReturnValueOnce(1)
                .mockReturnValueOnce(5),
            getHistoryRedoSize: vi.fn()
        };
        const methods = createHistoryMethods({ table });

        expect(methods.getHistoryUndoSize()).toBe(0);
        expect(table.getHistoryUndoSize).toHaveBeenCalledOnce();
        expect(table.getHistoryUndoSize).toHaveBeenLastCalledWith();

        expect(methods.getHistoryUndoSize()).toBe(1);
        expect(table.getHistoryUndoSize).toHaveBeenCalledTimes(2);
        expect(table.getHistoryUndoSize).toHaveBeenLastCalledWith();

        expect(methods.getHistoryUndoSize()).toBe(5);
        expect(table.getHistoryUndoSize).toHaveBeenCalledTimes(3);
        expect(table.getHistoryUndoSize).toHaveBeenLastCalledWith();
        expect(table.getHistoryRedoSize).not.toHaveBeenCalled();
        expect(table).not.toHaveProperty('history');
        expect(table).not.toHaveProperty('modules');
        expectForbiddenMethodsNotCalled(table);
    });

    test('returns redo history counts without using undo count or history actions', () => {
        const table = {
            ...createForbiddenMethods(),
            getHistoryUndoSize: vi.fn(),
            getHistoryRedoSize: vi.fn()
                .mockReturnValueOnce(0)
                .mockReturnValueOnce(2)
        };
        const methods = createHistoryMethods({ table });

        expect(methods.getHistoryRedoSize()).toBe(0);
        expect(table.getHistoryRedoSize).toHaveBeenCalledOnce();
        expect(table.getHistoryRedoSize).toHaveBeenLastCalledWith();

        expect(methods.getHistoryRedoSize()).toBe(2);
        expect(table.getHistoryRedoSize).toHaveBeenCalledTimes(2);
        expect(table.getHistoryRedoSize).toHaveBeenLastCalledWith();
        expect(table.getHistoryUndoSize).not.toHaveBeenCalled();
        expect(table).not.toHaveProperty('history');
        expect(table).not.toHaveProperty('modules');
        expectForbiddenMethodsNotCalled(table);
    });
});

import { describe, expect, test, vi } from 'vitest';

import { createHistoryMethods } from '../src/lib/table/controller/history-methods.js';

const forbiddenMethodNames = [
    'undo',
    'redo',
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

describe('AMB table controller interaction-history method group', () => {
    test('exposes exactly the flat interaction-history controller methods', () => {
        const methods = createHistoryMethods({
            table: {}
        });

        expect(Object.keys(methods).sort()).toEqual([
            'clearHistory',
            'getHistoryRedoSize',
            'getHistoryUndoSize',
            'redo',
            'undo'
        ]);
        expect(Object.values(methods).every(method => typeof method === 'function')).toBe(true);
    });

    test('clears native interaction history without changing AMB Grid state', () => {
        const table = {
            ...createForbiddenMethods(),
            clearHistory: vi.fn(),
            getHistoryUndoSize: vi.fn(),
            getHistoryRedoSize: vi.fn()
        };
        const methods = createHistoryMethods({ table });

        expect(methods.clearHistory()).toBeUndefined();
        expect(table.clearHistory).toHaveBeenCalledOnce();
        expect(table.clearHistory).toHaveBeenCalledWith();
        expect(table.getHistoryUndoSize).not.toHaveBeenCalled();
        expect(table.getHistoryRedoSize).not.toHaveBeenCalled();
        expect(table).not.toHaveProperty('history');
        expect(table).not.toHaveProperty('modules');
        expectForbiddenMethodsNotCalled(table);
    });

    test('preserves the native clear-history result unchanged', () => {
        const sentinel = { cleared: true };
        const table = {
            ...createForbiddenMethods(),
            clearHistory: vi.fn().mockReturnValue(sentinel),
            getHistoryUndoSize: vi.fn(),
            getHistoryRedoSize: vi.fn()
        };
        const methods = createHistoryMethods({ table });

        expect(methods.clearHistory()).toBe(sentinel);
        expect(table.clearHistory).toHaveBeenCalledOnce();
        expect(table.clearHistory).toHaveBeenCalledWith();
        expect(table.getHistoryUndoSize).not.toHaveBeenCalled();
        expect(table.getHistoryRedoSize).not.toHaveBeenCalled();
        expect(table).not.toHaveProperty('history');
        expect(table).not.toHaveProperty('modules');
        expectForbiddenMethodsNotCalled(table);
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

    test.each(['undo', 'redo'])(
        'returns false immediately when %s coordination is unavailable',
        direction => {
            const table = {
                [direction]: vi.fn(),
                getHistoryUndoSize: vi.fn(() => 1),
                getHistoryRedoSize: vi.fn(() => 1)
            };
            const crud = {
                isDestroyed: false
            };
            const historyRuntime = {
                isAvailable: vi.fn(() => true),
                perform: vi.fn(() => Promise.resolve(true))
            };

            expect(createHistoryMethods({
                table,
                crud,
                historyRuntime,
                historyEnabled: false
            })[direction]()).toBe(false);

            crud.isDestroyed = true;
            expect(createHistoryMethods({
                table,
                crud,
                historyRuntime,
                historyEnabled: true
            })[direction]()).toBe(false);

            crud.isDestroyed = false;
            historyRuntime.isAvailable.mockReturnValue(false);
            expect(createHistoryMethods({
                table,
                crud,
                historyRuntime,
                historyEnabled: true
            })[direction]()).toBe(false);

            expect(table[direction]).not.toHaveBeenCalled();
            expect(historyRuntime.perform).not.toHaveBeenCalled();
        }
    );

    test.each(['undo', 'redo'])(
        'returns false immediately when %s runtime methods are missing',
        direction => {
            const countMethod = direction === 'undo'
                ? 'getHistoryUndoSize'
                : 'getHistoryRedoSize';
            const crud = {
                isDestroyed: false
            };
            const historyRuntime = {
                isAvailable: vi.fn(() => true),
                perform: vi.fn()
            };
            const missingAction = {
                [countMethod]: vi.fn(() => 1)
            };
            const missingCount = {
                [direction]: vi.fn()
            };

            expect(createHistoryMethods({
                table: missingAction,
                crud,
                historyRuntime,
                historyEnabled: true
            })[direction]()).toBe(false);
            expect(createHistoryMethods({
                table: missingCount,
                crud,
                historyRuntime,
                historyEnabled: true
            })[direction]()).toBe(false);
            expect(historyRuntime.perform).not.toHaveBeenCalled();
        }
    );

    test.each(['undo', 'redo'])(
        'returns the distinct coordinator Promise for %s',
        direction => {
            const firstPromise = Promise.resolve(true);
            const secondPromise = Promise.resolve(false);
            const table = {
                [direction]: vi.fn(),
                getHistoryUndoSize: vi.fn(() => 1),
                getHistoryRedoSize: vi.fn(() => 1)
            };
            const crud = {
                isDestroyed: false
            };
            const historyRuntime = {
                isAvailable: vi.fn(() => true),
                perform: vi.fn()
                    .mockReturnValueOnce(firstPromise)
                    .mockReturnValueOnce(secondPromise)
            };
            const methods = createHistoryMethods({
                table,
                crud,
                historyRuntime,
                historyEnabled: true
            });

            expect(methods[direction]()).toBe(firstPromise);
            expect(methods[direction]()).toBe(secondPromise);
            expect(historyRuntime.perform).toHaveBeenNthCalledWith(1, direction);
            expect(historyRuntime.perform).toHaveBeenNthCalledWith(2, direction);
            expect(table[direction]).not.toHaveBeenCalled();
        }
    );
});

import { describe, expect, test, vi } from 'vitest';

import { createHistoryMethods } from '../src/lib/table/controller/history-methods.js';

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

    test('preserves the native clear-history result unchanged', () => {
        const sentinel = { cleared: true };
        const table = {
            clearHistory: vi.fn(() => sentinel)
        };
        const methods = createHistoryMethods({ table });

        expect(methods.clearHistory()).toBe(sentinel);
        expect(table.clearHistory).toHaveBeenCalledOnce();
        expect(table.clearHistory).toHaveBeenCalledWith();
    });

    test.each([
        ['getHistoryUndoSize', 5],
        ['getHistoryRedoSize', 2]
    ])('delegates %s unchanged', (methodName, count) => {
        const table = {
            [methodName]: vi.fn(() => count)
        };
        const methods = createHistoryMethods({ table });

        expect(methods[methodName]()).toBe(count);
        expect(table[methodName]).toHaveBeenCalledOnce();
        expect(table[methodName]).toHaveBeenCalledWith();
    });

    test.each(['undo', 'redo'])(
        'checks %s availability and delegates only to the coordinator',
        direction => {
            const countMethod = direction === 'undo'
                ? 'getHistoryUndoSize'
                : 'getHistoryRedoSize';
            const operation = Promise.resolve(true);
            const table = {
                [direction]: vi.fn(),
                [countMethod]: vi.fn(() => 1)
            };
            const crud = {
                isDestroyed: false
            };
            const historyRuntime = {
                isAvailable: vi.fn(() => true),
                perform: vi.fn(() => operation)
            };
            const createMethods = overrides => createHistoryMethods({
                table,
                crud,
                historyRuntime,
                historyEnabled: true,
                ...overrides
            });

            expect(createMethods({ historyEnabled: false })[direction]()).toBe(false);
            crud.isDestroyed = true;
            expect(createMethods()[direction]()).toBe(false);
            crud.isDestroyed = false;
            historyRuntime.isAvailable.mockReturnValue(false);
            expect(createMethods()[direction]()).toBe(false);

            historyRuntime.isAvailable.mockReturnValue(true);
            expect(createMethods({ table: { [countMethod]: vi.fn() } })[direction]())
                .toBe(false);
            expect(createMethods({ table: { [direction]: vi.fn() } })[direction]())
                .toBe(false);

            expect(createMethods()[direction]()).toBe(operation);
            expect(historyRuntime.perform).toHaveBeenCalledOnce();
            expect(historyRuntime.perform).toHaveBeenCalledWith(direction);
            expect(table[direction]).not.toHaveBeenCalled();
        }
    );
});

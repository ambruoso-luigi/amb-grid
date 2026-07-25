import { describe, expect, test, vi } from 'vitest';

import { createCrudMethods } from '../src/lib/table/controller/crud-methods.js';

describe('AMB table CRUD report methods', () => {
    test('exposes the exact read methods and delegates each call in isolation', () => {
        const options = { onlyValid: false, includeInvalid: true };
        const results = {
            getChanges: { inserted: [], updated: [], deleted: [] },
            getStateReport: { rows: [], changes: {} },
            getSavePayload: { canSave: true, changes: {} },
            hasErrors: true,
            getErrors: {
                hasErrors: true,
                rows: [{ key: 'row-1', message: 'Row error' }],
                cells: [{ key: 'row-1', field: 'name', message: 'Cell error' }]
            },
            getRowErrors: [{ key: 'row-1', message: 'Row error' }],
            getCellErrors: [{ key: 'row-1', field: 'name', message: 'Cell error' }]
        };
        const crud = {
            getChanges: vi.fn(() => results.getChanges),
            getStateReport: vi.fn(() => results.getStateReport),
            getSavePayload: vi.fn(() => results.getSavePayload),
            hasErrors: vi.fn(() => results.hasErrors),
            getErrors: vi.fn(() => results.getErrors),
            getRowErrors: vi.fn(() => results.getRowErrors),
            getCellErrors: vi.fn(() => results.getCellErrors)
        };
        const methods = createCrudMethods({ crud });
        const cases = [
            { methodName: 'getChanges', args: [] },
            { methodName: 'getStateReport', args: [] },
            { methodName: 'getSavePayload', args: [options] },
            { methodName: 'hasErrors', args: [] },
            { methodName: 'getErrors', args: [] },
            { methodName: 'getRowErrors', args: [] },
            { methodName: 'getCellErrors', args: [] }
        ];

        expect(Object.keys(methods)).toEqual([
            'getChanges',
            'getStateReport',
            'getSavePayload',
            'hasErrors',
            'getErrors',
            'getRowErrors',
            'getCellErrors'
        ]);

        cases.forEach(({ methodName, args }) => {
            Object.values(crud).forEach(mock => mock.mockClear());

            const result = methods[methodName](...args);

            expect(result).toBe(results[methodName]);
            expect(crud[methodName]).toHaveBeenCalledOnce();
            expect(crud[methodName].mock.calls[0]).toEqual(args);
            args.forEach((argument, index) => {
                expect(crud[methodName].mock.calls[0][index]).toBe(argument);
            });

            Object.entries(crud)
                .filter(([name]) => name !== methodName)
                .forEach(([, mock]) => {
                    expect(mock).not.toHaveBeenCalled();
                });
        });
    });
});

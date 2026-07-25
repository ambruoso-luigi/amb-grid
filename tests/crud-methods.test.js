import { describe, expect, test, vi } from 'vitest';

import { createCrudMethods } from '../src/lib/table/controller/crud-methods.js';

describe('AMB table CRUD facade methods', () => {
    test('exposes the exact methods and delegates each call in isolation', () => {
        const options = { onlyValid: false, includeInvalid: true };
        const identifier = 'amb-temp-1';
        const field = 'name';
        const cellMessage = 'Campo non valido';
        const rowMessage = 'Riga non valida';
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
            getCellErrors: [{ key: 'row-1', field: 'name', message: 'Cell error' }],
            markCellError: true,
            clearCellError: false,
            markRowError: false,
            clearRowError: true,
            clearRowErrors: false,
            clearAllErrors: true
        };
        const crud = {
            getChanges: vi.fn(() => results.getChanges),
            getStateReport: vi.fn(() => results.getStateReport),
            getSavePayload: vi.fn(() => results.getSavePayload),
            hasErrors: vi.fn(() => results.hasErrors),
            getErrors: vi.fn(() => results.getErrors),
            getRowErrors: vi.fn(() => results.getRowErrors),
            getCellErrors: vi.fn(() => results.getCellErrors),
            markCellError: vi.fn(() => results.markCellError),
            clearCellError: vi.fn(() => results.clearCellError),
            markRowError: vi.fn(() => results.markRowError),
            clearRowError: vi.fn(() => results.clearRowError),
            clearRowErrors: vi.fn(() => results.clearRowErrors),
            clearAllErrors: vi.fn(() => results.clearAllErrors)
        };
        const methods = createCrudMethods({ crud });
        const cases = [
            { methodName: 'getChanges', args: [] },
            { methodName: 'getStateReport', args: [] },
            { methodName: 'getSavePayload', args: [options] },
            { methodName: 'hasErrors', args: [] },
            { methodName: 'getErrors', args: [] },
            { methodName: 'getRowErrors', args: [] },
            { methodName: 'getCellErrors', args: [] },
            {
                methodName: 'markCellError',
                args: [identifier, field, cellMessage]
            },
            {
                methodName: 'clearCellError',
                args: [identifier, field]
            },
            {
                methodName: 'markRowError',
                args: [identifier, rowMessage]
            },
            {
                methodName: 'clearRowError',
                args: [identifier]
            },
            {
                methodName: 'clearCellErrorsForRow',
                crudMethodName: 'clearRowErrors',
                args: [identifier]
            },
            {
                methodName: 'clearErrorsForRow',
                crudMethodName: 'clearAllErrors',
                args: [identifier]
            }
        ];

        expect(Object.keys(methods)).toEqual([
            'getChanges',
            'getStateReport',
            'getSavePayload',
            'hasErrors',
            'getErrors',
            'getRowErrors',
            'getCellErrors',
            'markCellError',
            'clearCellError',
            'markRowError',
            'clearRowError',
            'clearCellErrorsForRow',
            'clearErrorsForRow'
        ]);

        cases.forEach(testCase => {
            const { methodName, args } = testCase;
            const crudMethodName = testCase.crudMethodName || methodName;

            Object.values(crud).forEach(mock => mock.mockClear());

            const result = methods[methodName](...args);

            expect(result).toBe(results[crudMethodName]);
            expect(crud[crudMethodName]).toHaveBeenCalledOnce();
            expect(crud[crudMethodName].mock.calls[0]).toEqual(args);
            args.forEach((argument, index) => {
                expect(crud[crudMethodName].mock.calls[0][index]).toBe(argument);
            });

            Object.entries(crud)
                .filter(([name]) => name !== crudMethodName)
                .forEach(([, mock]) => {
                    expect(mock).not.toHaveBeenCalled();
                });
        });
    });
});

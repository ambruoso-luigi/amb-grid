import { describe, expect, test, vi } from 'vitest';

import { createCellStateMethods } from '../src/lib/table/controller/cell-state-methods.js';

const forbiddenMethodNames = [
    'clearCellEdited',
    'clearCellValidation',
    'validate',
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
    'recalc',
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

describe('AMB table controller cell-state reading method group', () => {
    test('exposes exactly the flat cell-state controller methods', () => {
        const methods = createCellStateMethods({
            table: {}
        });

        expect(Object.keys(methods).sort()).toEqual([
            'getEditedCells',
            'getInvalidCells'
        ]);
        expect(Object.values(methods).every(method => typeof method === 'function')).toBe(true);
    });

    test('returns edited cell components without cloning or reading cell data', () => {
        const editedCellA = {
            type: 'edited-cell-a',
            getValue: vi.fn(),
            getData: vi.fn(),
            getRow: vi.fn()
        };
        const editedCellB = {
            type: 'edited-cell-b',
            getValue: vi.fn(),
            getData: vi.fn(),
            getRow: vi.fn()
        };
        const editedCells = [editedCellA, editedCellB];
        const emptyEditedCells = [];
        const table = {
            ...createForbiddenMethods(),
            getEditedCells: vi.fn()
                .mockReturnValueOnce(editedCells)
                .mockReturnValueOnce(emptyEditedCells),
            getInvalidCells: vi.fn()
        };
        const methods = createCellStateMethods({ table });

        const returned = methods.getEditedCells();

        expect(returned).toBe(editedCells);
        expect(returned[0]).toBe(editedCellA);
        expect(returned[1]).toBe(editedCellB);
        expect(table.getEditedCells).toHaveBeenCalledOnce();
        expect(table.getEditedCells).toHaveBeenCalledWith();
        expect(editedCellA.getValue).not.toHaveBeenCalled();
        expect(editedCellA.getData).not.toHaveBeenCalled();
        expect(editedCellA.getRow).not.toHaveBeenCalled();
        expect(editedCellB.getValue).not.toHaveBeenCalled();
        expect(editedCellB.getData).not.toHaveBeenCalled();
        expect(editedCellB.getRow).not.toHaveBeenCalled();

        expect(methods.getEditedCells()).toBe(emptyEditedCells);
        expect(table.getEditedCells).toHaveBeenCalledTimes(2);
        expect(table.getInvalidCells).not.toHaveBeenCalled();
        expectForbiddenMethodsNotCalled(table);
    });

    test('returns invalid cell components without triggering validation or UI state changes', () => {
        const invalidCellA = {
            type: 'invalid-cell-a',
            validate: vi.fn(),
            clearValidation: vi.fn(),
            getElement: vi.fn()
        };
        const invalidCellB = {
            type: 'invalid-cell-b',
            validate: vi.fn(),
            clearValidation: vi.fn(),
            getElement: vi.fn()
        };
        const invalidCells = [invalidCellA, invalidCellB];
        const emptyInvalidCells = [];
        const rowData = {
            _errors: {
                name: ['Required']
            }
        };
        const table = {
            ...createForbiddenMethods(),
            getEditedCells: vi.fn(),
            getInvalidCells: vi.fn()
                .mockReturnValueOnce(invalidCells)
                .mockReturnValueOnce(emptyInvalidCells)
        };
        const methods = createCellStateMethods({ table });

        const returned = methods.getInvalidCells();

        expect(returned).toBe(invalidCells);
        expect(returned[0]).toBe(invalidCellA);
        expect(returned[1]).toBe(invalidCellB);
        expect(table.getInvalidCells).toHaveBeenCalledOnce();
        expect(table.getInvalidCells).toHaveBeenCalledWith();
        expect(invalidCellA.validate).not.toHaveBeenCalled();
        expect(invalidCellA.clearValidation).not.toHaveBeenCalled();
        expect(invalidCellA.getElement).not.toHaveBeenCalled();
        expect(invalidCellB.validate).not.toHaveBeenCalled();
        expect(invalidCellB.clearValidation).not.toHaveBeenCalled();
        expect(invalidCellB.getElement).not.toHaveBeenCalled();

        expect(methods.getInvalidCells()).toBe(emptyInvalidCells);
        expect(table.getInvalidCells).toHaveBeenCalledTimes(2);
        expect(table.getEditedCells).not.toHaveBeenCalled();
        expect(rowData._errors).toEqual({
            name: ['Required']
        });
        expectForbiddenMethodsNotCalled(table);
    });
});

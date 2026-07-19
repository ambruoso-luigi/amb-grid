import { describe, expect, test, vi } from 'vitest';

import { createCellStateMethods } from '../src/lib/table/controller/cell-state-methods.js';

const forbiddenMethodNames = [
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
            'clearCellEdited',
            'clearCellValidation',
            'getEditedCells',
            'getInvalidCells'
        ]);
        expect(Object.values(methods).every(method => typeof method === 'function')).toBe(true);
    });

    test('clearCellEdited delegates native edited marker cleanup without reading or mutating cells', () => {
        const cellA = {
            type: 'cell-a',
            clearEdited: vi.fn(),
            clearValidation: vi.fn(),
            validate: vi.fn(),
            getElement: vi.fn()
        };
        const cellB = {
            type: 'cell-b',
            clearEdited: vi.fn(),
            clearValidation: vi.fn(),
            validate: vi.fn(),
            getElement: vi.fn()
        };
        const cells = [cellA, cellB];
        const sentinelResult = { type: 'sentinel-result' };
        const crud = createForbiddenMethods();
        const table = {
            ...createForbiddenMethods(),
            clearCellEdited: vi.fn()
                .mockReturnValueOnce(undefined)
                .mockReturnValueOnce(sentinelResult)
                .mockReturnValueOnce(false)
                .mockReturnValueOnce(null)
                .mockReturnValueOnce('null-result'),
            clearCellValidation: vi.fn(),
            getEditedCells: vi.fn(),
            getInvalidCells: vi.fn()
        };
        const methods = createCellStateMethods({ table });

        expect(methods.clearCellEdited()).toBeUndefined();
        expect(methods.clearCellEdited(cellA)).toBe(sentinelResult);
        expect(methods.clearCellEdited(cells)).toBe(false);
        expect(methods.clearCellEdited(undefined)).toBeNull();
        expect(methods.clearCellEdited(null)).toBe('null-result');

        expect(table.clearCellEdited).toHaveBeenCalledTimes(5);
        expect(table.clearCellEdited.mock.calls[0]).toEqual([]);
        expect(table.clearCellEdited.mock.calls[1][0]).toBe(cellA);
        expect(table.clearCellEdited.mock.calls[2][0]).toBe(cells);
        expect(table.clearCellEdited.mock.calls[2][0][0]).toBe(cellA);
        expect(table.clearCellEdited.mock.calls[2][0][1]).toBe(cellB);
        expect(table.clearCellEdited.mock.calls[3]).toEqual([undefined]);
        expect(table.clearCellEdited.mock.calls[4]).toEqual([null]);
        expect(table.getEditedCells).not.toHaveBeenCalled();
        expect(table.getInvalidCells).not.toHaveBeenCalled();
        expect(table.clearCellValidation).not.toHaveBeenCalled();

        [
            cellA,
            cellB
        ].forEach(cell => {
            expect(cell.clearEdited).not.toHaveBeenCalled();
            expect(cell.clearValidation).not.toHaveBeenCalled();
            expect(cell.validate).not.toHaveBeenCalled();
            expect(cell.getElement).not.toHaveBeenCalled();
        });

        expectForbiddenMethodsNotCalled(table);
        expectForbiddenMethodsNotCalled(crud);
    });

    test('clearCellValidation delegates native validation marker cleanup without validating or changing AMB errors', () => {
        const cellA = {
            type: 'cell-a',
            clearEdited: vi.fn(),
            clearValidation: vi.fn(),
            validate: vi.fn(),
            getElement: vi.fn()
        };
        const cellB = {
            type: 'cell-b',
            clearEdited: vi.fn(),
            clearValidation: vi.fn(),
            validate: vi.fn(),
            getElement: vi.fn()
        };
        const cells = [cellA, cellB];
        const rowData = {
            _errors: {
                name: ['Required']
            }
        };
        const sentinelResult = { type: 'validation-result' };
        const crud = createForbiddenMethods();
        const table = {
            ...createForbiddenMethods(),
            clearCellEdited: vi.fn(),
            clearCellValidation: vi.fn()
                .mockReturnValueOnce(undefined)
                .mockReturnValueOnce(sentinelResult)
                .mockReturnValueOnce(false)
                .mockReturnValueOnce(null)
                .mockReturnValueOnce('null-result'),
            getEditedCells: vi.fn(),
            getInvalidCells: vi.fn()
        };
        const methods = createCellStateMethods({ table });

        expect(methods.clearCellValidation()).toBeUndefined();
        expect(methods.clearCellValidation(cellA)).toBe(sentinelResult);
        expect(methods.clearCellValidation(cells)).toBe(false);
        expect(methods.clearCellValidation(undefined)).toBeNull();
        expect(methods.clearCellValidation(null)).toBe('null-result');

        expect(table.clearCellValidation).toHaveBeenCalledTimes(5);
        expect(table.clearCellValidation.mock.calls[0]).toEqual([]);
        expect(table.clearCellValidation.mock.calls[1][0]).toBe(cellA);
        expect(table.clearCellValidation.mock.calls[2][0]).toBe(cells);
        expect(table.clearCellValidation.mock.calls[2][0][0]).toBe(cellA);
        expect(table.clearCellValidation.mock.calls[2][0][1]).toBe(cellB);
        expect(table.clearCellValidation.mock.calls[3]).toEqual([undefined]);
        expect(table.clearCellValidation.mock.calls[4]).toEqual([null]);
        expect(table.getEditedCells).not.toHaveBeenCalled();
        expect(table.getInvalidCells).not.toHaveBeenCalled();
        expect(table.clearCellEdited).not.toHaveBeenCalled();
        expect(rowData._errors).toEqual({
            name: ['Required']
        });

        [
            cellA,
            cellB
        ].forEach(cell => {
            expect(cell.clearEdited).not.toHaveBeenCalled();
            expect(cell.clearValidation).not.toHaveBeenCalled();
            expect(cell.validate).not.toHaveBeenCalled();
            expect(cell.getElement).not.toHaveBeenCalled();
        });

        expectForbiddenMethodsNotCalled(table);
        expectForbiddenMethodsNotCalled(crud);
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
            clearCellEdited: vi.fn(),
            clearCellValidation: vi.fn(),
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
        expect(table.clearCellEdited).not.toHaveBeenCalled();
        expect(table.clearCellValidation).not.toHaveBeenCalled();
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
            clearCellEdited: vi.fn(),
            clearCellValidation: vi.fn(),
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
        expect(table.clearCellEdited).not.toHaveBeenCalled();
        expect(table.clearCellValidation).not.toHaveBeenCalled();
        expect(rowData._errors).toEqual({
            name: ['Required']
        });
        expectForbiddenMethodsNotCalled(table);
    });
});

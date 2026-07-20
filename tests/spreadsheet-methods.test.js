import { describe, expect, test, vi } from 'vitest';

import { createSpreadsheetMethods } from '../src/lib/table/controller/spreadsheet-methods.js';

const spreadsheetMethodNames = [
    'getSheetDefinitions',
    'getSheets',
    'getSheet',
    'getSheetData'
];

const forbiddenTableMethodNames = [
    'setSheets',
    'addSheet',
    'setSheetData',
    'clearSheet',
    'removeSheet',
    'activeSheet',
    'getData',
    'getRows',
    'getColumns',
    'redraw',
    'recalc',
    'setFilter',
    'setSort',
    'setPage',
    'selectRow',
    'setData',
    'replaceData',
    'updateData',
    'addData',
    'clearData',
    'validate'
];

const forbiddenCrudMethodNames = [
    'updateRowFields',
    'validateRow',
    'validateAll',
    'rollbackRow',
    'getSavePayload',
    'getStateReport',
    'findRowByKey',
    'addRow',
    'deleteRow'
];

const createForbiddenMethods = methodNames => Object.fromEntries(
    methodNames.map(name => [name, vi.fn()])
);

const createTable = () => ({
    ...createForbiddenMethods(forbiddenTableMethodNames),
    getSheetDefinitions: vi.fn(),
    getSheets: vi.fn(),
    getSheet: vi.fn(),
    getSheetData: vi.fn()
});

const expectSpreadsheetCalls = (table, activeName, count) => {
    spreadsheetMethodNames.forEach(name => {
        if (name === activeName) {
            expect(table[name]).toHaveBeenCalledTimes(count);
            return;
        }

        expect(table[name]).not.toHaveBeenCalled();
    });
};

const expectForbiddenMethodsNotCalled = (target, methodNames) => {
    methodNames.forEach(name => {
        expect(target[name]).not.toHaveBeenCalled();
    });
};

describe('AMB table controller spreadsheet reading method group', () => {
    test('exposes exactly the flat spreadsheet reading controller methods', () => {
        const methods = createSpreadsheetMethods({
            table: createTable()
        });

        expect(Object.keys(methods).sort()).toEqual([
            'getSheet',
            'getSheetData',
            'getSheetDefinitions',
            'getSheets'
        ]);
        expect(Object.values(methods).every(method => typeof method === 'function')).toBe(true);
    });

    test('getSheetDefinitions returns runtime definitions without cloning or rebuilding', () => {
        const firstRow = ['Mario', 42];
        const definition = {
            title: 'Sales',
            key: 'sales',
            rows: 2,
            columns: 2,
            data: [firstRow]
        };
        const definitions = [definition];
        const emptyDefinitions = [];
        const crud = createForbiddenMethods(forbiddenCrudMethodNames);
        const table = createTable();
        const methods = createSpreadsheetMethods({ table });

        table.getSheetDefinitions
            .mockReturnValueOnce(definitions)
            .mockReturnValueOnce(emptyDefinitions);

        const returned = methods.getSheetDefinitions();

        expect(returned).toBe(definitions);
        expect(returned[0]).toBe(definition);
        expect(returned[0].data).toBe(definition.data);
        expect(returned[0].data[0]).toBe(firstRow);
        expect(table.getSheetDefinitions).toHaveBeenCalledOnce();
        expect(table.getSheetDefinitions).toHaveBeenCalledWith();
        expectSpreadsheetCalls(table, 'getSheetDefinitions', 1);
        expectForbiddenMethodsNotCalled(table, forbiddenTableMethodNames);
        expectForbiddenMethodsNotCalled(crud, forbiddenCrudMethodNames);

        expect(methods.getSheetDefinitions()).toBe(emptyDefinitions);
        expect(table.getSheetDefinitions).toHaveBeenCalledTimes(2);
        expect(table.getSheetDefinitions.mock.calls[1]).toEqual([]);
        expectSpreadsheetCalls(table, 'getSheetDefinitions', 2);
        expectForbiddenMethodsNotCalled(table, forbiddenTableMethodNames);
        expectForbiddenMethodsNotCalled(crud, forbiddenCrudMethodNames);
    });

    test('getSheets returns Sheet Components without reading or modifying them', () => {
        const sheetA = {
            getDefinition: vi.fn(),
            getData: vi.fn(),
            setData: vi.fn(),
            clear: vi.fn(),
            remove: vi.fn(),
            active: vi.fn()
        };
        const sheetB = {
            getDefinition: vi.fn(),
            getData: vi.fn(),
            setData: vi.fn(),
            clear: vi.fn(),
            remove: vi.fn(),
            active: vi.fn()
        };
        const sheets = [sheetA, sheetB];
        const emptySheets = [];
        const crud = createForbiddenMethods(forbiddenCrudMethodNames);
        const table = createTable();
        const methods = createSpreadsheetMethods({ table });

        table.getSheets
            .mockReturnValueOnce(sheets)
            .mockReturnValueOnce(emptySheets);

        const returned = methods.getSheets();

        expect(returned).toBe(sheets);
        expect(returned[0]).toBe(sheetA);
        expect(returned[1]).toBe(sheetB);
        expect(table.getSheets).toHaveBeenCalledOnce();
        expect(table.getSheets).toHaveBeenCalledWith();
        expectSpreadsheetCalls(table, 'getSheets', 1);

        [sheetA, sheetB].forEach(sheet => {
            expect(sheet.getDefinition).not.toHaveBeenCalled();
            expect(sheet.getData).not.toHaveBeenCalled();
            expect(sheet.setData).not.toHaveBeenCalled();
            expect(sheet.clear).not.toHaveBeenCalled();
            expect(sheet.remove).not.toHaveBeenCalled();
            expect(sheet.active).not.toHaveBeenCalled();
        });

        expectForbiddenMethodsNotCalled(table, forbiddenTableMethodNames);
        expectForbiddenMethodsNotCalled(crud, forbiddenCrudMethodNames);

        expect(methods.getSheets()).toBe(emptySheets);
        expect(table.getSheets).toHaveBeenCalledTimes(2);
        expect(table.getSheets.mock.calls[1]).toEqual([]);
        expectSpreadsheetCalls(table, 'getSheets', 2);
        expect(table.getSheetDefinitions).not.toHaveBeenCalled();
        expectForbiddenMethodsNotCalled(table, forbiddenTableMethodNames);
        expectForbiddenMethodsNotCalled(crud, forbiddenCrudMethodNames);
    });

    test('getSheet forwards lookups exactly and preserves missing-sheet false', () => {
        const sheetComponent = {
            type: 'sheet-component'
        };
        const lookupComponent = {
            type: 'lookup-component'
        };
        const crud = createForbiddenMethods(forbiddenCrudMethodNames);
        const table = createTable();
        const methods = createSpreadsheetMethods({ table });

        table.getSheet
            .mockReturnValueOnce(sheetComponent)
            .mockReturnValueOnce(sheetComponent)
            .mockReturnValueOnce(sheetComponent)
            .mockReturnValueOnce(false)
            .mockReturnValueOnce(false)
            .mockReturnValueOnce(false);

        expect(methods.getSheet()).toBe(sheetComponent);
        expect(table.getSheet.mock.calls[0]).toEqual([]);

        expect(methods.getSheet('sales')).toBe(sheetComponent);
        expect(table.getSheet.mock.calls[1]).toEqual(['sales']);

        expect(methods.getSheet(lookupComponent)).toBe(sheetComponent);
        expect(table.getSheet.mock.calls[2][0]).toBe(lookupComponent);

        expect(methods.getSheet(undefined)).toBe(false);
        expect(table.getSheet.mock.calls[3]).toEqual([undefined]);

        expect(methods.getSheet(null)).toBe(false);
        expect(table.getSheet.mock.calls[4]).toEqual([null]);

        expect(methods.getSheet('')).toBe(false);
        expect(table.getSheet.mock.calls[5]).toEqual(['']);

        expect(table.getSheet).toHaveBeenCalledTimes(6);
        expectSpreadsheetCalls(table, 'getSheet', 6);
        expect(table.getSheets).not.toHaveBeenCalled();
        expectForbiddenMethodsNotCalled(table, forbiddenTableMethodNames);
        expectForbiddenMethodsNotCalled(crud, forbiddenCrudMethodNames);
    });

    test('getSheetData preserves matrix data and missing-sheet false', () => {
        const firstRow = ['Mario', 42, false, 0, ''];
        const secondRow = ['Anna', 35, true, undefined, null];
        const sheetData = [firstRow, secondRow];
        const lookupComponent = {
            type: 'lookup-component'
        };
        const crud = createForbiddenMethods(forbiddenCrudMethodNames);
        const table = createTable();
        const methods = createSpreadsheetMethods({ table });

        table.getSheetData
            .mockReturnValueOnce(sheetData)
            .mockReturnValueOnce(sheetData)
            .mockReturnValueOnce(sheetData)
            .mockReturnValueOnce(false);

        const activeData = methods.getSheetData();

        expect(activeData).toBe(sheetData);
        expect(activeData[0]).toBe(firstRow);
        expect(activeData[1]).toBe(secondRow);
        expect(activeData[0]).toEqual(['Mario', 42, false, 0, '']);
        expect(activeData[1]).toEqual(['Anna', 35, true, undefined, null]);
        expect(activeData[0][2]).toBe(false);
        expect(activeData[0][3]).toBe(0);
        expect(activeData[0][4]).toBe('');
        expect(activeData[1][3]).toBeUndefined();
        expect(activeData[1][4]).toBeNull();
        expect(table.getSheetData.mock.calls[0]).toEqual([]);

        expect(methods.getSheetData('sales')).toBe(sheetData);
        expect(table.getSheetData.mock.calls[1]).toEqual(['sales']);

        expect(methods.getSheetData(lookupComponent)).toBe(sheetData);
        expect(table.getSheetData.mock.calls[2][0]).toBe(lookupComponent);

        expect(methods.getSheetData('missing')).toBe(false);
        expect(table.getSheetData.mock.calls[3]).toEqual(['missing']);

        expect(table.getSheetData).toHaveBeenCalledTimes(4);
        expectSpreadsheetCalls(table, 'getSheetData', 4);
        expect(table.getData).not.toHaveBeenCalled();
        expect(Array.isArray(activeData[0])).toBe(true);
        expect(Object.prototype.hasOwnProperty.call(activeData[0], 'name')).toBe(false);
        expect(Object.prototype.hasOwnProperty.call(activeData[0], '_state')).toBe(false);
        expect(Object.prototype.hasOwnProperty.call(activeData[0], '_errors')).toBe(false);
        expect(Object.prototype.hasOwnProperty.call(activeData[0], '_ambTempId')).toBe(false);
        expectForbiddenMethodsNotCalled(table, forbiddenTableMethodNames);
        expectForbiddenMethodsNotCalled(crud, forbiddenCrudMethodNames);
    });
});

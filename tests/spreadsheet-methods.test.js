import { describe, expect, test, vi } from 'vitest';

import { createSpreadsheetMethods } from '../src/lib/table/controller/spreadsheet-methods.js';

const spreadsheetMethodNames = [
    'activeSheet',
    'addSheet',
    'clearSheet',
    'getSheetDefinitions',
    'getSheets',
    'getSheet',
    'getSheetData',
    'removeSheet',
    'setSheetData',
    'setSheets'
];

const forbiddenTableMethodNames = [
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
    getSheetData: vi.fn(),
    setSheetData: vi.fn(),
    clearSheet: vi.fn(),
    setSheets: vi.fn(),
    addSheet: vi.fn(),
    activeSheet: vi.fn(),
    removeSheet: vi.fn()
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

describe('AMB table controller spreadsheet method group', () => {
    test('exposes exactly the flat spreadsheet controller methods', () => {
        const methods = createSpreadsheetMethods({
            table: createTable()
        });

        expect(Object.keys(methods).sort()).toEqual([
            'activeSheet',
            'addSheet',
            'clearSheet',
            'getSheet',
            'getSheetData',
            'getSheetDefinition',
            'getSheetDefinitions',
            'getSheetKey',
            'getSheetTitle',
            'getSheets',
            'removeSheet',
            'setSheetData',
            'setSheetTitle',
            'setSheets'
        ]);
        expect(Object.values(methods).every(method => typeof method === 'function')).toBe(true);
    });

    test('sheet metadata reads delegate without arguments and preserve runtime results', () => {
        const definition = {
            key: 'sales',
            title: 'Sales'
        };
        const cases = [
            ['getSheetTitle', 'getTitle', ''],
            ['getSheetKey', 'getKey', 0],
            ['getSheetDefinition', 'getDefinition', definition]
        ];
        const methods = createSpreadsheetMethods({
            table: createTable()
        });

        cases.forEach(([ambMethodName, sheetMethodName, result]) => {
            const sheetMethod = vi.fn(() => result);
            const sheet = {
                [sheetMethodName]: sheetMethod
            };

            expect(methods[ambMethodName](sheet)).toBe(result);
            expect(sheetMethod).toHaveBeenCalledOnce();
            expect(sheetMethod).toHaveBeenCalledWith();
            expect(methods[ambMethodName]()).toBe(false);
            expect(methods[ambMethodName]({})).toBe(false);
        });
    });

    test('sets one Sheet Component title without transforming the value', () => {
        const result = {
            updated: true
        };
        const setTitle = vi.fn()
            .mockReturnValueOnce(result)
            .mockReturnValueOnce(undefined);
        const sheet = {
            setTitle
        };
        const methods = createSpreadsheetMethods({
            table: createTable()
        });

        expect(methods.setSheetTitle(sheet, 'Vendite')).toBe(result);
        expect(setTitle.mock.calls[0][0]).toBe('Vendite');

        expect(methods.setSheetTitle(sheet, '')).toBeUndefined();
        expect(setTitle.mock.calls[1][0]).toBe('');

        expect(methods.setSheetTitle()).toBe(false);
        expect(methods.setSheetTitle({})).toBe(false);
        expect(setTitle).toHaveBeenCalledTimes(2);
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

    test('setSheetData forwards matrix data and all lookup forms unchanged', () => {
        const firstRow = ['Mario', 42, false, 0, ''];
        const secondRow = ['Anna', 35, true, null, undefined];
        const matrix = [firstRow, secondRow];
        const lookupComponent = {
            key: 'component-lookup'
        };
        const sentinelResult = {
            status: 'sentinel'
        };
        const crud = createForbiddenMethods(forbiddenCrudMethodNames);
        const table = createTable();
        const methods = createSpreadsheetMethods({ table });

        table.setSheetData
            .mockReturnValueOnce(undefined)
            .mockReturnValueOnce(undefined)
            .mockReturnValueOnce(sentinelResult)
            .mockReturnValueOnce(false)
            .mockReturnValueOnce(undefined);

        expect(methods.setSheetData(matrix)).toBeUndefined();
        expect(table.setSheetData.mock.calls[0][0]).toBe(matrix);
        expect(table.setSheetData.mock.calls[0]).toEqual([matrix]);

        expect(methods.setSheetData('sales', matrix)).toBeUndefined();
        expect(table.setSheetData.mock.calls[1][0]).toBe('sales');
        expect(table.setSheetData.mock.calls[1][1]).toBe(matrix);

        expect(methods.setSheetData(lookupComponent, matrix)).toBe(sentinelResult);
        expect(table.setSheetData.mock.calls[2][0]).toBe(lookupComponent);
        expect(table.setSheetData.mock.calls[2][1]).toBe(matrix);

        expect(methods.setSheetData('missing', matrix)).toBe(false);
        expect(table.setSheetData.mock.calls[3][0]).toBe('missing');
        expect(table.setSheetData.mock.calls[3][1]).toBe(matrix);

        expect(methods.setSheetData('sales', null)).toBeUndefined();
        expect(table.setSheetData.mock.calls[4]).toEqual(['sales', null]);

        expect(matrix[0]).toBe(firstRow);
        expect(matrix[1]).toBe(secondRow);
        expect(matrix[0]).toEqual(['Mario', 42, false, 0, '']);
        expect(matrix[1]).toEqual(['Anna', 35, true, null, undefined]);
        expect(matrix[0][2]).toBe(false);
        expect(matrix[0][3]).toBe(0);
        expect(matrix[0][4]).toBe('');
        expect(matrix[1][3]).toBeNull();
        expect(matrix[1][4]).toBeUndefined();
        expect(Array.isArray(matrix[0])).toBe(true);
        expect(Object.prototype.hasOwnProperty.call(matrix[0], 'name')).toBe(false);
        expect(table.setSheetData).toHaveBeenCalledTimes(5);
        expectSpreadsheetCalls(table, 'setSheetData', 5);
        expect(table.getSheet).not.toHaveBeenCalled();
        expect(table.getSheets).not.toHaveBeenCalled();
        expect(table.setData).not.toHaveBeenCalled();
        expectForbiddenMethodsNotCalled(table, forbiddenTableMethodNames);
        expectForbiddenMethodsNotCalled(crud, forbiddenCrudMethodNames);
    });

    test('clearSheet forwards lookups unchanged and preserves runtime results', () => {
        const lookupComponent = {
            key: 'component-lookup'
        };
        const sentinelResult = {
            status: 'cleared'
        };
        const crud = createForbiddenMethods(forbiddenCrudMethodNames);
        const table = createTable();
        const methods = createSpreadsheetMethods({ table });

        table.clearSheet
            .mockReturnValueOnce(undefined)
            .mockReturnValueOnce(undefined)
            .mockReturnValueOnce(sentinelResult)
            .mockReturnValueOnce(false)
            .mockReturnValueOnce(false)
            .mockReturnValueOnce(false);

        expect(methods.clearSheet()).toBeUndefined();
        expect(table.clearSheet.mock.calls[0]).toEqual([]);

        expect(methods.clearSheet('sales')).toBeUndefined();
        expect(table.clearSheet.mock.calls[1]).toEqual(['sales']);

        expect(methods.clearSheet(lookupComponent)).toBe(sentinelResult);
        expect(table.clearSheet.mock.calls[2][0]).toBe(lookupComponent);

        expect(methods.clearSheet(undefined)).toBe(false);
        expect(table.clearSheet.mock.calls[3]).toEqual([undefined]);

        expect(methods.clearSheet(null)).toBe(false);
        expect(table.clearSheet.mock.calls[4]).toEqual([null]);

        expect(methods.clearSheet('')).toBe(false);
        expect(table.clearSheet.mock.calls[5]).toEqual(['']);

        expect(table.clearSheet).toHaveBeenCalledTimes(6);
        expectSpreadsheetCalls(table, 'clearSheet', 6);
        expect(table.setSheetData).not.toHaveBeenCalled();
        expect(table.getSheet).not.toHaveBeenCalled();
        expect(table.getSheets).not.toHaveBeenCalled();
        expectForbiddenMethodsNotCalled(table, forbiddenTableMethodNames);
        expectForbiddenMethodsNotCalled(crud, forbiddenCrudMethodNames);
    });

    test('setSheets forwards definitions and matrix data unchanged', () => {
        const firstRow = ['Mario', 42];
        const secondRow = ['Anna', 35];
        const sheetDefinition = {
            key: 'sales',
            title: 'Sales',
            rows: 2,
            columns: 2,
            data: [firstRow, secondRow]
        };
        const definitions = [sheetDefinition];
        const componentA = { type: 'sheet-a' };
        const componentB = { type: 'sheet-b' };
        const components = [componentA, componentB];
        const crud = createForbiddenMethods(forbiddenCrudMethodNames);
        const table = createTable();
        const methods = createSpreadsheetMethods({ table });

        table.setSheets.mockReturnValueOnce(components);

        const returned = methods.setSheets(definitions);

        expect(returned).toBe(components);
        expect(returned[0]).toBe(componentA);
        expect(returned[1]).toBe(componentB);
        expect(table.setSheets).toHaveBeenCalledOnce();
        expect(table.setSheets.mock.calls[0][0]).toBe(definitions);
        expect(table.setSheets.mock.calls[0]).toEqual([definitions]);
        expect(definitions[0]).toBe(sheetDefinition);
        expect(definitions[0].data).toBe(sheetDefinition.data);
        expect(definitions[0].data[0]).toBe(firstRow);
        expect(definitions[0].data[1]).toBe(secondRow);
        expect(Array.isArray(definitions[0].data[0])).toBe(true);
        expect(Object.prototype.hasOwnProperty.call(definitions[0].data[0], 'name')).toBe(false);
        expectSpreadsheetCalls(table, 'setSheets', 1);
        expectForbiddenMethodsNotCalled(table, forbiddenTableMethodNames);
        expectForbiddenMethodsNotCalled(crud, forbiddenCrudMethodNames);
    });

    test('addSheet forwards one definition unchanged and returns the Sheet Component', () => {
        const matrixRow = ['Mario', 42, false];
        const sheetDefinition = {
            key: 'new-sheet',
            title: 'New Sheet',
            data: [matrixRow]
        };
        const sheetComponent = {
            key: 'new-sheet-component'
        };
        const crud = createForbiddenMethods(forbiddenCrudMethodNames);
        const table = createTable();
        const methods = createSpreadsheetMethods({ table });

        table.addSheet.mockReturnValueOnce(sheetComponent);

        const returned = methods.addSheet(sheetDefinition);

        expect(returned).toBe(sheetComponent);
        expect(table.addSheet).toHaveBeenCalledOnce();
        expect(table.addSheet.mock.calls[0][0]).toBe(sheetDefinition);
        expect(table.addSheet.mock.calls[0]).toEqual([sheetDefinition]);
        expect(sheetDefinition.data[0]).toBe(matrixRow);
        expect(Object.prototype.hasOwnProperty.call(sheetDefinition, 'rows')).toBe(false);
        expect(Object.prototype.hasOwnProperty.call(sheetDefinition, 'columns')).toBe(false);
        expectSpreadsheetCalls(table, 'addSheet', 1);
        expectForbiddenMethodsNotCalled(table, forbiddenTableMethodNames);
        expectForbiddenMethodsNotCalled(crud, forbiddenCrudMethodNames);
    });

    test('activeSheet forwards lookups exactly and preserves undefined and false', () => {
        const lookupComponent = {
            key: 'component-lookup'
        };
        const crud = createForbiddenMethods(forbiddenCrudMethodNames);
        const table = createTable();
        const methods = createSpreadsheetMethods({ table });

        table.activeSheet
            .mockReturnValueOnce(undefined)
            .mockReturnValueOnce(undefined)
            .mockReturnValueOnce(undefined)
            .mockReturnValueOnce(false)
            .mockReturnValueOnce(false)
            .mockReturnValueOnce(false);

        expect(methods.activeSheet()).toBeUndefined();
        expect(table.activeSheet.mock.calls[0]).toEqual([]);

        expect(methods.activeSheet('sales')).toBeUndefined();
        expect(table.activeSheet.mock.calls[1]).toEqual(['sales']);

        expect(methods.activeSheet(lookupComponent)).toBeUndefined();
        expect(table.activeSheet.mock.calls[2][0]).toBe(lookupComponent);

        expect(methods.activeSheet(undefined)).toBe(false);
        expect(table.activeSheet.mock.calls[3]).toEqual([undefined]);

        expect(methods.activeSheet(null)).toBe(false);
        expect(table.activeSheet.mock.calls[4]).toEqual([null]);

        expect(methods.activeSheet('')).toBe(false);
        expect(table.activeSheet.mock.calls[5]).toEqual(['']);

        expect(table.activeSheet).toHaveBeenCalledTimes(6);
        expectSpreadsheetCalls(table, 'activeSheet', 6);
        expect(table.getSheets).not.toHaveBeenCalled();
        expectForbiddenMethodsNotCalled(table, forbiddenTableMethodNames);
        expectForbiddenMethodsNotCalled(crud, forbiddenCrudMethodNames);
    });

    test('removeSheet forwards the lookup unchanged and returns the runtime result', () => {
        const lookupComponent = {
            key: 'component-lookup'
        };
        const crud = createForbiddenMethods(forbiddenCrudMethodNames);
        const table = createTable();
        const methods = createSpreadsheetMethods({ table });

        table.removeSheet
            .mockReturnValueOnce(undefined)
            .mockReturnValueOnce(undefined)
            .mockReturnValueOnce(undefined)
            .mockReturnValueOnce(undefined);

        expect(methods.removeSheet('sales')).toBeUndefined();
        expect(table.removeSheet.mock.calls[0]).toEqual(['sales']);

        expect(methods.removeSheet(lookupComponent)).toBeUndefined();
        expect(table.removeSheet.mock.calls[1][0]).toBe(lookupComponent);

        expect(methods.removeSheet(undefined)).toBeUndefined();
        expect(table.removeSheet.mock.calls[2]).toEqual([undefined]);

        expect(methods.removeSheet()).toBeUndefined();
        expect(table.removeSheet.mock.calls[3]).toEqual([]);

        expect(table.removeSheet).toHaveBeenCalledTimes(4);
        expectSpreadsheetCalls(table, 'removeSheet', 4);
        expect(table.getSheets).not.toHaveBeenCalled();
        expectForbiddenMethodsNotCalled(table, forbiddenTableMethodNames);
        expectForbiddenMethodsNotCalled(crud, forbiddenCrudMethodNames);
    });
});

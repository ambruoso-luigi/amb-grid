import { describe, expect, test, vi } from 'vitest';

const tabulatorMock = vi.hoisted(() => ({
    instances: []
}));

const crudMock = vi.hoisted(() => ({
    instances: []
}));

vi.mock('tabulator-tables', () => ({
    TabulatorFull: class TabulatorMock {
        constructor(selector, options) {
            this.selector = selector;
            this.options = options;
            this.getSheetDefinitions = vi.fn(() => []);
            this.getSheets = vi.fn(() => []);
            this.getSheet = vi.fn(() => false);
            this.getSheetData = vi.fn(() => false);
            this.setSheets = vi.fn();
            this.addSheet = vi.fn();
            this.setSheetData = vi.fn();
            this.clearSheet = vi.fn();
            this.removeSheet = vi.fn();
            this.activeSheet = vi.fn();
            this.navigatePrev = vi.fn();
            this.navigateNext = vi.fn();
            this.navigateLeft = vi.fn();
            this.navigateRight = vi.fn();
            this.navigateUp = vi.fn();
            this.navigateDown = vi.fn();
            this.getEditedCells = vi.fn(() => []);
            this.getInvalidCells = vi.fn(() => []);
            this.getColumnDefinitions = vi.fn(() => []);
            this.getColumns = vi.fn(() => []);
            this.getColumn = vi.fn(() => false);
            this.showColumn = vi.fn();
            this.hideColumn = vi.fn();
            this.toggleColumn = vi.fn();
            this.scrollToColumn = vi.fn(() => Promise.resolve());
            this.moveColumn = vi.fn();
            this.getSorters = vi.fn(() => []);
            this.setSort = vi.fn();
            this.clearSort = vi.fn();
            this.getFilters = vi.fn(() => []);
            this.addFilter = vi.fn();
            this.setFilter = vi.fn();
            this.removeFilter = vi.fn();
            this.clearFilter = vi.fn();
            this.refreshFilter = vi.fn();
            this.getHeaderFilters = vi.fn(() => []);
            this.getHeaderFilterValue = vi.fn(() => undefined);
            this.setHeaderFilterValue = vi.fn();
            this.setHeaderFilterFocus = vi.fn();
            this.clearHeaderFilter = vi.fn();
            this.getSelectedData = vi.fn(() => []);
            this.getSelectedRows = vi.fn(() => []);
            this.selectRow = vi.fn();
            this.deselectRow = vi.fn();
            this.getData = vi.fn(() => []);
            this.getDataCount = vi.fn(() => 0);
            this.searchData = vi.fn(() => []);
            this.getRows = vi.fn(() => []);
            this.getRow = vi.fn(() => false);
            this.getRowPosition = vi.fn(() => false);
            this.getRowFromPosition = vi.fn(() => false);
            this.scrollToRow = vi.fn(() => Promise.resolve());
            this.searchRows = vi.fn(() => []);
            this.getPage = vi.fn(() => 1);
            this.getPageMax = vi.fn(() => 5);
            this.getPageSize = vi.fn(() => 25);
            this.setPage = vi.fn();
            this.nextPage = vi.fn();
            this.previousPage = vi.fn();
            this.setPageSize = vi.fn();
            this.setPageToRow = vi.fn();
            this.getHtml = vi.fn(() => '<table></table>');
            this.copyToClipboard = vi.fn();
            this.download = vi.fn();
            this.downloadToTab = vi.fn();
            this.print = vi.fn();
            this.getGroups = vi.fn(() => []);
            this.setGroupBy = vi.fn();
            this.setGroupValues = vi.fn();
            this.setGroupStartOpen = vi.fn();
            this.setGroupHeader = vi.fn();
            this.getHistoryUndoSize = vi.fn(() => 0);
            this.getHistoryRedoSize = vi.fn(() => 0);
            this.getColumnLayout = vi.fn(() => []);
            this.setColumnLayout = vi.fn();
            this.setLocale = vi.fn();
            this.getLocale = vi.fn(() => 'en');
            this.getLang = vi.fn(() => ({}));
            this.setHeight = vi.fn();
            this.setMinHeight = vi.fn();
            this.setMaxHeight = vi.fn();
            this.getCalcResults = vi.fn(() => ({ top: {}, bottom: {} }));
            this.recalc = vi.fn();
            this.redraw = vi.fn(() => 'redraw-result');
            this.blockRedraw = vi.fn(() => 'block-result');
            this.restoreRedraw = vi.fn(() => 'restore-result');
            tabulatorMock.instances.push(this);
        }
    }
}));

vi.mock('../src/lib/crud-helper.js', () => ({
    ROW_STATE: {
        CLEAN: 'clean',
        DELETED: 'deleted'
    },
    CrudHelper: class CrudHelperMock {
        constructor(table, options) {
            this.table = table;
            this.options = options;
            this.on = vi.fn(() => vi.fn());
            this.addCellValidator = vi.fn();
            this.findRowByKey = vi.fn();
            this.getSavePayload = vi.fn();
            this.getStateReport = vi.fn();
            this.validateRow = vi.fn();
            this.validateAll = vi.fn();
            this.updateRowFields = vi.fn();
            this.addRow = vi.fn();
            this.deleteRow = vi.fn();
            this.rollbackRow = vi.fn();
            this.destroy = vi.fn();
            crudMock.instances.push(this);
        }
    }
}));

const { createTable } = await import('../src/lib/table/table-factory.js');

class ElementMock {
    constructor() {
        this.children = [];
        this.parentNode = null;
        this.className = '';
        this.hidden = false;
        this.value = '';
        this.listeners = {};
        this.classList = {
            toggle: vi.fn()
        };
    }

    append(...children) {
        children.forEach(child => this.appendChild(child));
    }

    appendChild(child) {
        child.parentNode = this;
        this.children.push(child);
        return child;
    }

    insertBefore(child, reference) {
        child.parentNode = this;
        const index = this.children.indexOf(reference);

        if (index === -1) {
            this.children.push(child);
        } else {
            this.children.splice(index, 0, child);
        }

        return child;
    }

    setAttribute(name, value) {
        this[name] = value;
    }

    addEventListener(type, handler) {
        this.listeners[type] = handler;
    }

    removeEventListener(type) {
        delete this.listeners[type];
    }

    remove() {
        if (this.parentNode) {
            this.parentNode.children = this.parentNode.children.filter(child => child !== this);
        }
        this.parentNode = null;
    }
}

const createDocumentHarness = () => {
    const originalDocument = globalThis.document;
    const parent = new ElementMock();
    const mount = new ElementMock();

    parent.appendChild(mount);

    globalThis.document = {
        createElement: () => new ElementMock(),
        querySelector: () => mount
    };
    tabulatorMock.instances.length = 0;
    crudMock.instances.length = 0;

    return {
        mount,
        restore() {
            globalThis.document = originalDocument;
        }
    };
};

const clearTableSideEffects = table => {
    [
        'setSheets',
        'addSheet',
        'setSheetData',
        'clearSheet',
        'removeSheet',
        'activeSheet',
        'getData',
        'getRows',
        'getColumns',
        'getFilters',
        'getSorters',
        'getSelectedData',
        'getSelectedRows',
        'setFilter',
        'clearFilter',
        'refreshFilter',
        'setSort',
        'clearSort',
        'setPage',
        'nextPage',
        'previousPage',
        'setPageSize',
        'setPageToRow',
        'selectRow',
        'deselectRow',
        'redraw',
        'recalc'
    ].forEach(name => table[name].mockClear());
};

const clearCrudSetupCalls = crud => {
    [
        'on',
        'addCellValidator',
        'findRowByKey',
        'getSavePayload',
        'getStateReport',
        'validateRow',
        'validateAll',
        'updateRowFields',
        'addRow',
        'deleteRow',
        'rollbackRow',
        'destroy'
    ].forEach(name => crud[name].mockClear());
};

const expectNoSpreadsheetReadSideEffects = (table, crud) => {
    expect(table.setSheets).not.toHaveBeenCalled();
    expect(table.addSheet).not.toHaveBeenCalled();
    expect(table.setSheetData).not.toHaveBeenCalled();
    expect(table.clearSheet).not.toHaveBeenCalled();
    expect(table.removeSheet).not.toHaveBeenCalled();
    expect(table.activeSheet).not.toHaveBeenCalled();
    expect(table.getData).not.toHaveBeenCalled();
    expect(table.getRows).not.toHaveBeenCalled();
    expect(table.getColumns).not.toHaveBeenCalled();
    expect(table.getFilters).not.toHaveBeenCalled();
    expect(table.getSorters).not.toHaveBeenCalled();
    expect(table.getSelectedData).not.toHaveBeenCalled();
    expect(table.getSelectedRows).not.toHaveBeenCalled();
    expect(table.setFilter).not.toHaveBeenCalled();
    expect(table.clearFilter).not.toHaveBeenCalled();
    expect(table.refreshFilter).not.toHaveBeenCalled();
    expect(table.setSort).not.toHaveBeenCalled();
    expect(table.clearSort).not.toHaveBeenCalled();
    expect(table.setPage).not.toHaveBeenCalled();
    expect(table.nextPage).not.toHaveBeenCalled();
    expect(table.previousPage).not.toHaveBeenCalled();
    expect(table.setPageSize).not.toHaveBeenCalled();
    expect(table.setPageToRow).not.toHaveBeenCalled();
    expect(table.selectRow).not.toHaveBeenCalled();
    expect(table.deselectRow).not.toHaveBeenCalled();
    expect(table.redraw).not.toHaveBeenCalled();
    expect(table.recalc).not.toHaveBeenCalled();
    expect(crud.findRowByKey).not.toHaveBeenCalled();
    expect(crud.getSavePayload).not.toHaveBeenCalled();
    expect(crud.getStateReport).not.toHaveBeenCalled();
    expect(crud.validateRow).not.toHaveBeenCalled();
    expect(crud.validateAll).not.toHaveBeenCalled();
    expect(crud.updateRowFields).not.toHaveBeenCalled();
    expect(crud.addRow).not.toHaveBeenCalled();
    expect(crud.deleteRow).not.toHaveBeenCalled();
    expect(crud.rollbackRow).not.toHaveBeenCalled();
    expect(crud.destroy).not.toHaveBeenCalled();
};

const expectNoSpreadsheetWriteSideEffects = (table, crud, activeName, count) => {
    [
        'getSheetDefinitions',
        'getSheets',
        'getSheet',
        'getSheetData',
        'setSheets',
        'addSheet',
        'removeSheet',
        'activeSheet'
    ].forEach(name => {
        if (name === activeName) {
            expect(table[name]).toHaveBeenCalledTimes(count);
            return;
        }

        expect(table[name]).not.toHaveBeenCalled();
    });
    expect(table.setSheetData).not.toHaveBeenCalled();
    expect(table.clearSheet).not.toHaveBeenCalled();
    expect(table.getData).not.toHaveBeenCalled();
    expect(table.getRows).not.toHaveBeenCalled();
    expect(table.getColumns).not.toHaveBeenCalled();
    expect(table.getFilters).not.toHaveBeenCalled();
    expect(table.getSorters).not.toHaveBeenCalled();
    expect(table.getSelectedData).not.toHaveBeenCalled();
    expect(table.getSelectedRows).not.toHaveBeenCalled();
    expect(table.setFilter).not.toHaveBeenCalled();
    expect(table.clearFilter).not.toHaveBeenCalled();
    expect(table.refreshFilter).not.toHaveBeenCalled();
    expect(table.setSort).not.toHaveBeenCalled();
    expect(table.clearSort).not.toHaveBeenCalled();
    expect(table.setPage).not.toHaveBeenCalled();
    expect(table.nextPage).not.toHaveBeenCalled();
    expect(table.previousPage).not.toHaveBeenCalled();
    expect(table.setPageSize).not.toHaveBeenCalled();
    expect(table.setPageToRow).not.toHaveBeenCalled();
    expect(table.selectRow).not.toHaveBeenCalled();
    expect(table.deselectRow).not.toHaveBeenCalled();
    expect(table.redraw).not.toHaveBeenCalled();
    expect(table.recalc).not.toHaveBeenCalled();
    expect(crud.findRowByKey).not.toHaveBeenCalled();
    expect(crud.getSavePayload).not.toHaveBeenCalled();
    expect(crud.getStateReport).not.toHaveBeenCalled();
    expect(crud.validateRow).not.toHaveBeenCalled();
    expect(crud.validateAll).not.toHaveBeenCalled();
    expect(crud.updateRowFields).not.toHaveBeenCalled();
    expect(crud.addRow).not.toHaveBeenCalled();
    expect(crud.deleteRow).not.toHaveBeenCalled();
    expect(crud.rollbackRow).not.toHaveBeenCalled();
    expect(crud.destroy).not.toHaveBeenCalled();
};

describe('AMB table controller spreadsheet API', () => {
    test('exposes flat spreadsheet methods and preserves runtime sheet results', () => {
        const harness = createDocumentHarness();

        try {
            const controller = createTable({
                selector: harness.mount,
                columns: [
                    { title: 'Name', field: 'name' },
                    { title: 'Age', field: 'age' }
                ],
                data: [
                    {
                        id: 1,
                        name: 'Mario',
                        age: 42,
                        _state: 'clean',
                        _errors: {},
                        _ambTempId: 'amb-1'
                    }
                ],
                search: {
                    enabled: true
                },
                toolbar: false
            });
            const table = tabulatorMock.instances[0];
            const crud = crudMock.instances[0];
            const firstRow = ['Mario', 42, false, 0, ''];
            const secondRow = ['Anna', 35, true, undefined, null];
            const sheetData = [firstRow, secondRow];
            const definition = {
                title: 'Sales',
                key: 'sales',
                rows: 2,
                columns: 5,
                data: sheetData
            };
            const definitions = [definition];
            const activeSheet = { key: 'active' };
            const specificSheet = { key: 'sales' };
            const lookupSheet = { key: 'lookup' };
            const sheets = [activeSheet, specificSheet];
            const rowData = table.options.data[0];
            const originalState = rowData._state;
            const originalErrors = rowData._errors;
            const originalTempId = rowData._ambTempId;
            const filters = [{ field: 'age', type: '>', value: 18 }];
            const sorters = [{ field: 'name', dir: 'asc' }];
            const selectedData = [{ id: 1, name: 'Mario' }];
            const selectedRows = [{ type: 'selected-row' }];

            expect(controller.table).toBe(table);
            expect(typeof controller.getSheetDefinitions).toBe('function');
            expect(typeof controller.getSheets).toBe('function');
            expect(typeof controller.getSheet).toBe('function');
            expect(typeof controller.getSheetData).toBe('function');
            expect(typeof controller.setSheets).toBe('function');
            expect(typeof controller.addSheet).toBe('function');
            expect(typeof controller.activeSheet).toBe('function');
            expect(typeof controller.removeSheet).toBe('function');
            expect(controller.spreadsheet).toBeUndefined();
            expect(controller.spreadsheetMethods).toBeUndefined();
            expect(controller.sheets).toBeUndefined();
            expect(controller.controllerMethods).toBeUndefined();
            expect(controller.setSheetData).toBeUndefined();
            expect(controller.clearSheet).toBeUndefined();

            expect(controller.setSearchQuery('Mario')).toBe(true);
            const searchState = controller.getSearchState();

            table.getFilters.mockReturnValue(filters);
            table.getSorters.mockReturnValue(sorters);
            table.getSelectedData.mockReturnValue(selectedData);
            table.getSelectedRows.mockReturnValue(selectedRows);
            expect(controller.getFilters()).toEqual(filters);
            expect(controller.getSorters()).toBe(sorters);
            expect(controller.getSelectedData()).toBe(selectedData);
            expect(controller.getSelectedRowComponents()).toBe(selectedRows);
            expect(controller.getPage()).toBe(1);

            clearTableSideEffects(table);
            clearCrudSetupCalls(crud);

            table.getSheetDefinitions.mockReturnValueOnce(definitions);
            expect(controller.getSheetDefinitions()).toBe(definitions);
            expect(table.getSheetDefinitions).toHaveBeenCalledOnce();
            expect(table.getSheetDefinitions).toHaveBeenCalledWith();
            expect(definitions[0]).toBe(definition);
            expect(definitions[0].data).toBe(sheetData);
            expectNoSpreadsheetReadSideEffects(table, crud);

            table.getSheetDefinitions.mockClear();
            clearTableSideEffects(table);
            clearCrudSetupCalls(crud);

            table.getSheets.mockReturnValueOnce(sheets);
            expect(controller.getSheets()).toBe(sheets);
            expect(table.getSheets).toHaveBeenCalledOnce();
            expect(table.getSheets).toHaveBeenCalledWith();
            expect(sheets[0]).toBe(activeSheet);
            expect(sheets[1]).toBe(specificSheet);
            expectNoSpreadsheetReadSideEffects(table, crud);

            table.getSheets.mockClear();
            clearTableSideEffects(table);
            clearCrudSetupCalls(crud);

            table.getSheet
                .mockReturnValueOnce(activeSheet)
                .mockReturnValueOnce(specificSheet)
                .mockReturnValueOnce(lookupSheet)
                .mockReturnValueOnce(false);

            expect(controller.getSheet()).toBe(activeSheet);
            expect(table.getSheet.mock.calls[0]).toEqual([]);
            expect(controller.getSheet('sales')).toBe(specificSheet);
            expect(table.getSheet.mock.calls[1]).toEqual(['sales']);
            expect(controller.getSheet(lookupSheet)).toBe(lookupSheet);
            expect(table.getSheet.mock.calls[2][0]).toBe(lookupSheet);
            expect(controller.getSheet('missing')).toBe(false);
            expect(table.getSheet.mock.calls[3]).toEqual(['missing']);
            expectNoSpreadsheetReadSideEffects(table, crud);

            table.getSheet.mockClear();
            clearTableSideEffects(table);
            clearCrudSetupCalls(crud);

            table.getSheetData
                .mockReturnValueOnce(sheetData)
                .mockReturnValueOnce(sheetData)
                .mockReturnValueOnce(sheetData)
                .mockReturnValueOnce(false);

            const activeData = controller.getSheetData();

            expect(activeData).toBe(sheetData);
            expect(activeData[0]).toBe(firstRow);
            expect(activeData[1]).toBe(secondRow);
            expect(activeData[0]).toEqual(['Mario', 42, false, 0, '']);
            expect(activeData[1]).toEqual(['Anna', 35, true, undefined, null]);
            expect(table.getSheetData.mock.calls[0]).toEqual([]);
            expect(controller.getSheetData('sales')).toBe(sheetData);
            expect(table.getSheetData.mock.calls[1]).toEqual(['sales']);
            expect(controller.getSheetData(lookupSheet)).toBe(sheetData);
            expect(table.getSheetData.mock.calls[2][0]).toBe(lookupSheet);
            expect(controller.getSheetData('missing')).toBe(false);
            expect(table.getSheetData.mock.calls[3]).toEqual(['missing']);
            expect(table.getData).not.toHaveBeenCalled();
            expect(Array.isArray(activeData[0])).toBe(true);
            expect(Object.prototype.hasOwnProperty.call(activeData[0], 'name')).toBe(false);
            expectNoSpreadsheetReadSideEffects(table, crud);

            table.getSheetData.mockClear();
            clearTableSideEffects(table);
            clearCrudSetupCalls(crud);

            const replacedSheet = { key: 'replaced-sheet' };
            const replacedSheets = [replacedSheet];

            table.setSheets.mockReturnValueOnce(replacedSheets);
            expect(controller.setSheets(definitions)).toBe(replacedSheets);
            expect(table.setSheets).toHaveBeenCalledOnce();
            expect(table.setSheets.mock.calls[0][0]).toBe(definitions);
            expect(definitions[0]).toBe(definition);
            expect(definitions[0].data).toBe(sheetData);
            expect(definitions[0].data[0]).toBe(firstRow);
            expect(Array.isArray(definitions[0].data[0])).toBe(true);
            expect(Object.prototype.hasOwnProperty.call(definitions[0].data[0], 'name')).toBe(false);
            expectNoSpreadsheetWriteSideEffects(table, crud, 'setSheets', 1);

            table.setSheets.mockClear();
            clearTableSideEffects(table);
            clearCrudSetupCalls(crud);

            const addedSheet = { key: 'added-sheet' };

            table.addSheet.mockReturnValueOnce(addedSheet);
            expect(controller.addSheet(definition)).toBe(addedSheet);
            expect(table.addSheet).toHaveBeenCalledOnce();
            expect(table.addSheet.mock.calls[0][0]).toBe(definition);
            expect(definition.data).toBe(sheetData);
            expectNoSpreadsheetWriteSideEffects(table, crud, 'addSheet', 1);

            table.addSheet.mockClear();
            clearTableSideEffects(table);
            clearCrudSetupCalls(crud);

            table.activeSheet
                .mockReturnValueOnce(undefined)
                .mockReturnValueOnce(undefined)
                .mockReturnValueOnce(undefined)
                .mockReturnValueOnce(false)
                .mockReturnValueOnce(false);

            expect(controller.activeSheet('sales')).toBeUndefined();
            expect(table.activeSheet.mock.calls[0]).toEqual(['sales']);
            expect(controller.activeSheet(lookupSheet)).toBeUndefined();
            expect(table.activeSheet.mock.calls[1][0]).toBe(lookupSheet);
            expect(controller.activeSheet()).toBeUndefined();
            expect(table.activeSheet.mock.calls[2]).toEqual([]);
            expect(controller.activeSheet(null)).toBe(false);
            expect(table.activeSheet.mock.calls[3]).toEqual([null]);
            expect(controller.activeSheet('')).toBe(false);
            expect(table.activeSheet.mock.calls[4]).toEqual(['']);
            expectNoSpreadsheetWriteSideEffects(table, crud, 'activeSheet', 5);

            table.activeSheet.mockClear();
            clearTableSideEffects(table);
            clearCrudSetupCalls(crud);

            table.removeSheet.mockReturnValueOnce(undefined);
            expect(controller.removeSheet(lookupSheet)).toBeUndefined();
            expect(table.removeSheet).toHaveBeenCalledOnce();
            expect(table.removeSheet.mock.calls[0][0]).toBe(lookupSheet);
            expectNoSpreadsheetWriteSideEffects(table, crud, 'removeSheet', 1);

            expect(controller.getSearchState()).toEqual(searchState);
            expect(controller.getFilters()).toEqual(filters);
            expect(controller.getSorters()).toBe(sorters);
            expect(controller.getPage()).toBe(1);
            expect(controller.getSelectedData()).toBe(selectedData);
            expect(controller.getSelectedRowComponents()).toBe(selectedRows);
            expect(rowData._state).toBe(originalState);
            expect(rowData._errors).toBe(originalErrors);
            expect(rowData._ambTempId).toBe(originalTempId);
        } finally {
            harness.restore();
        }
    });
});

import { describe, expect, test, vi } from 'vitest';

const tabulatorMock = vi.hoisted(() => ({
    instances: []
}));

const crudMock = vi.hoisted(() => ({
    instances: []
}));

const navigationMethodNames = [
    'navigatePrev',
    'navigateNext',
    'navigateLeft',
    'navigateRight',
    'navigateUp',
    'navigateDown'
];

vi.mock('tabulator-tables', () => ({
    TabulatorFull: class TabulatorMock {
        constructor(selector, options) {
            this.selector = selector;
            this.options = options;
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
        'getRows',
        'getColumns',
        'getEditedCells',
        'getSelectedData',
        'getSelectedRows',
        'selectRow',
        'deselectRow',
        'scrollToRow',
        'scrollToColumn',
        'setFilter',
        'clearFilter',
        'refreshFilter',
        'setSort',
        'clearSort',
        'setPage',
        'nextPage',
        'previousPage',
        'setPageSize',
        'setPageToRow'
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

const expectNoControllerSideEffects = (table, crud) => {
    expect(table.getRows).not.toHaveBeenCalled();
    expect(table.getColumns).not.toHaveBeenCalled();
    expect(table.getEditedCells).not.toHaveBeenCalled();
    expect(table.getSelectedData).not.toHaveBeenCalled();
    expect(table.getSelectedRows).not.toHaveBeenCalled();
    expect(table.selectRow).not.toHaveBeenCalled();
    expect(table.deselectRow).not.toHaveBeenCalled();
    expect(table.scrollToRow).not.toHaveBeenCalled();
    expect(table.scrollToColumn).not.toHaveBeenCalled();
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

const expectOnlyNavigationCalled = (table, activeName, count) => {
    navigationMethodNames.forEach(name => {
        if (name === activeName) {
            expect(table[name]).toHaveBeenCalledTimes(count);
            return;
        }

        expect(table[name]).not.toHaveBeenCalled();
    });
};

describe('AMB table controller editable-cell navigation API', () => {
    test('exposes flat navigation methods and delegates without public arguments', () => {
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
            const rowData = table.options.data[0];
            const originalState = rowData._state;
            const originalErrors = rowData._errors;
            const originalTempId = rowData._ambTempId;
            const filters = [{ field: 'age', type: '>', value: 18 }];
            const sorters = [{ field: 'name', dir: 'asc' }];
            const selectedData = [{ id: 1, name: 'Mario' }];
            const selectedRows = [{ type: 'selected-row' }];

            expect(controller.table).toBe(table);
            expect(typeof controller.navigatePrev).toBe('function');
            expect(typeof controller.navigateNext).toBe('function');
            expect(typeof controller.navigateLeft).toBe('function');
            expect(typeof controller.navigateRight).toBe('function');
            expect(typeof controller.navigateUp).toBe('function');
            expect(typeof controller.navigateDown).toBe('function');
            expect(controller.navigation).toBeUndefined();
            expect(controller.navigationMethods).toBeUndefined();
            expect(controller.editorNavigation).toBeUndefined();
            expect(controller.controllerMethods).toBeUndefined();

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

            navigationMethodNames.forEach(methodName => {
                const sentinelResult = { moved: true, methodName };

                table[methodName]
                    .mockReturnValueOnce(true)
                    .mockReturnValueOnce(false)
                    .mockReturnValueOnce(sentinelResult);

                expect(controller[methodName]('ignored', { key: 'Tab' })).toBe(true);
                expect(table[methodName]).toHaveBeenCalledOnce();
                expect(table[methodName]).toHaveBeenCalledWith();
                expectOnlyNavigationCalled(table, methodName, 1);
                expectNoControllerSideEffects(table, crud);

                expect(controller[methodName]()).toBe(false);
                expect(table[methodName]).toHaveBeenCalledTimes(2);
                expect(table[methodName].mock.calls[1]).toEqual([]);
                expectOnlyNavigationCalled(table, methodName, 2);
                expectNoControllerSideEffects(table, crud);

                expect(controller[methodName]()).toBe(sentinelResult);
                expect(table[methodName]).toHaveBeenCalledTimes(3);
                expect(table[methodName].mock.calls[2]).toEqual([]);
                expectOnlyNavigationCalled(table, methodName, 3);
                expectNoControllerSideEffects(table, crud);

                table[methodName].mockClear();
            });

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

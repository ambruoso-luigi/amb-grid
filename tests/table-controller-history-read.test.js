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
            this.alert = vi.fn();
            this.clearAlert = vi.fn();
            this.getGroups = vi.fn(() => []);
            this.setGroupBy = vi.fn();
            this.setGroupValues = vi.fn();
            this.setGroupStartOpen = vi.fn();
            this.setGroupHeader = vi.fn();
            this.historyUndoSize = 0;
            this.historyRedoSize = 0;
            this.getHistoryUndoSize = vi.fn(() => this.historyUndoSize);
            this.getHistoryRedoSize = vi.fn(() => this.historyRedoSize);
            this.undo = vi.fn();
            this.redo = vi.fn();
            this.clearHistory = vi.fn(() => {
                this.historyUndoSize = 0;
                this.historyRedoSize = 0;
            });
            this.setHeight = vi.fn();
            this.setMinHeight = vi.fn();
            this.setMaxHeight = vi.fn();
            this.getCalcResults = vi.fn(() => ({ top: {}, bottom: {} }));
            this.recalc = vi.fn();
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
            this.setData = vi.fn();
            this.replaceData = vi.fn();
            this.updateData = vi.fn();
            this.addData = vi.fn();
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
            this.setLocale = vi.fn();
            this.getLocale = vi.fn(() => 'en');
            this.getLang = vi.fn(() => ({}));
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
    table.undo.mockClear();
    table.redo.mockClear();
    table.clearHistory.mockClear();
    table.setData.mockClear();
    table.replaceData.mockClear();
    table.updateData.mockClear();
    table.addData.mockClear();
    table.addFilter.mockClear();
    table.setFilter.mockClear();
    table.removeFilter.mockClear();
    table.clearFilter.mockClear();
    table.refreshFilter.mockClear();
    table.setHeaderFilterValue.mockClear();
    table.clearHeaderFilter.mockClear();
    table.setSort.mockClear();
    table.clearSort.mockClear();
    table.setPage.mockClear();
    table.nextPage.mockClear();
    table.previousPage.mockClear();
    table.setPageSize.mockClear();
    table.setPageToRow.mockClear();
    table.selectRow.mockClear();
    table.deselectRow.mockClear();
    table.recalc.mockClear();
    table.redraw.mockClear();
    table.getData.mockClear();
    table.getRows.mockClear();
    table.getColumns.mockClear();
};

const clearCrudSetupCalls = crud => {
    crud.on.mockClear();
    crud.addCellValidator.mockClear();
    crud.findRowByKey.mockClear();
    crud.getSavePayload.mockClear();
    crud.getStateReport.mockClear();
    crud.validateRow.mockClear();
    crud.validateAll.mockClear();
    crud.updateRowFields.mockClear();
    crud.addRow.mockClear();
    crud.deleteRow.mockClear();
    crud.rollbackRow.mockClear();
    crud.destroy.mockClear();
};

describe('AMB table controller history API', () => {
    test('exposes flat history count and cleanup methods without exposing undo or redo', () => {
        const harness = createDocumentHarness();

        try {
            const controller = createTable({
                selector: harness.mount,
                columns: [
                    { title: 'Name', field: 'name' },
                    { title: 'Department', field: 'department' }
                ],
                search: {
                    enabled: true
                },
                toolbar: false
            });
            const table = tabulatorMock.instances[0];
            const crud = crudMock.instances[0];
            const rowData = [{
                id: 1,
                name: 'Ada',
                department: 'Sales',
                _state: 'updated',
                _errors: {
                    name: 'Required'
                },
                _ambTempId: 'tmp-1'
            }];
            const rowComponents = [{ id: 'row-component-1' }];
            const selectedRows = [{ id: 1 }];
            const filters = [{ field: 'department', type: '=', value: 'Sales' }];
            const sorters = [{ field: 'name', dir: 'asc' }];

            expect(controller.table).toBe(table);
            expect(typeof controller.getHistoryUndoSize).toBe('function');
            expect(typeof controller.getHistoryRedoSize).toBe('function');
            expect(controller.history).toBeUndefined();
            expect(controller.historyMethods).toBeUndefined();
            expect(controller.controllerMethods).toBeUndefined();
            expect(controller.undo).toBeUndefined();
            expect(controller.redo).toBeUndefined();
            expect(typeof controller.clearHistory).toBe('function');

            expect(controller.setSearchQuery('department')).toBe(true);
            const searchState = controller.getSearchState();

            table.historyUndoSize = 4;
            table.historyRedoSize = 3;
            table.getData.mockReturnValue(rowData);
            table.getRows.mockReturnValue(rowComponents);
            table.getSelectedData.mockReturnValue(selectedRows);
            table.getSelectedRows.mockReturnValue(rowComponents);
            table.getFilters.mockReturnValue(filters);
            table.getSorters.mockReturnValue(sorters);
            expect(controller.getHistoryUndoSize()).toBe(4);
            expect(controller.getHistoryRedoSize()).toBe(3);
            expect(controller.getData()).toBe(rowData);
            expect(controller.getRows()).toBe(rowComponents);
            expect(controller.getSelectedData()).toBe(selectedRows);
            expect(controller.getSelectedRows()).toBe(selectedRows);
            expect(controller.getSelectedRowComponents()).toBe(rowComponents);
            expect(controller.getFilters()).toEqual(filters);
            expect(controller.getSorters()).toBe(sorters);
            expect(controller.getPage()).toBe(1);

            clearTableSideEffects(table);
            table.getHistoryUndoSize.mockClear();
            table.getHistoryRedoSize.mockClear();
            clearCrudSetupCalls(crud);

            expect(controller.clearHistory()).toBeUndefined();
            expect(table.clearHistory).toHaveBeenCalledOnce();
            expect(table.clearHistory).toHaveBeenCalledWith();
            expect(table.historyUndoSize).toBe(0);
            expect(table.historyRedoSize).toBe(0);

            expect(controller.getHistoryUndoSize()).toBe(0);
            expect(table.getHistoryUndoSize).toHaveBeenCalledOnce();
            expect(table.getHistoryUndoSize).toHaveBeenCalledWith();
            expect(controller.getHistoryRedoSize()).toBe(0);
            expect(table.getHistoryRedoSize).toHaveBeenCalledOnce();
            expect(table.getHistoryRedoSize).toHaveBeenCalledWith();

            expect(rowData).toEqual([{
                id: 1,
                name: 'Ada',
                department: 'Sales',
                _state: 'updated',
                _errors: {
                    name: 'Required'
                },
                _ambTempId: 'tmp-1'
            }]);
            expect(rowComponents).toEqual([{ id: 'row-component-1' }]);
            expect(selectedRows).toEqual([{ id: 1 }]);
            expect(filters).toEqual([{ field: 'department', type: '=', value: 'Sales' }]);
            expect(sorters).toEqual([{ field: 'name', dir: 'asc' }]);
            expect(controller.getSearchState()).toEqual(searchState);
            expect(table.undo).not.toHaveBeenCalled();
            expect(table.redo).not.toHaveBeenCalled();
            expect(table.setData).not.toHaveBeenCalled();
            expect(table.replaceData).not.toHaveBeenCalled();
            expect(table.updateData).not.toHaveBeenCalled();
            expect(table.addData).not.toHaveBeenCalled();
            expect(table.setFilter).not.toHaveBeenCalled();
            expect(table.addFilter).not.toHaveBeenCalled();
            expect(table.removeFilter).not.toHaveBeenCalled();
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
            expect(table.recalc).not.toHaveBeenCalled();
            expect(table.redraw).not.toHaveBeenCalled();
            expect(table.getData).not.toHaveBeenCalled();
            expect(table.getRows).not.toHaveBeenCalled();
            expect(table.getColumns).not.toHaveBeenCalled();
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
        } finally {
            harness.restore();
        }
    });
});

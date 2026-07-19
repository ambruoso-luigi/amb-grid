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
            this.getElement = vi.fn(() => ({ style: {} }));
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
    table.blockRedraw.mockClear();
    table.restoreRedraw.mockClear();
    table.getData.mockClear();
    table.getRows.mockClear();
    table.getColumns.mockClear();
    table.getElement.mockClear();
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

describe('AMB table controller layout API', () => {
    test('exposes flat layout methods and preserves delegation contracts', () => {
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
            const heightResult = { height: 500 };
            const minHeightResult = { minHeight: 250 };
            const maxHeightResult = { maxHeight: '80vh' };
            const selectedRows = [{ id: 1 }];
            const filters = [{ field: 'department', type: '=', value: 'Sales' }];
            const sorters = [{ field: 'name', dir: 'asc' }];

            expect(controller.table).toBe(table);
            expect(typeof controller.setHeight).toBe('function');
            expect(typeof controller.setMinHeight).toBe('function');
            expect(typeof controller.setMaxHeight).toBe('function');
            expect(controller.layout).toBeUndefined();
            expect(controller.layoutMethods).toBeUndefined();
            expect(controller.sizing).toBeUndefined();
            expect(controller.controllerMethods).toBeUndefined();

            expect(controller.setSearchQuery('department')).toBe(true);
            const searchState = controller.getSearchState();

            table.getSelectedData.mockReturnValue(selectedRows);
            table.getFilters.mockReturnValue(filters);
            table.getSorters.mockReturnValue(sorters);
            expect(controller.getSelectedData()).toBe(selectedRows);
            expect(controller.getFilters()).toEqual(filters);
            expect(controller.getSorters()).toBe(sorters);
            expect(controller.getPage()).toBe(1);

            clearTableSideEffects(table);
            clearCrudSetupCalls(crud);

            table.setHeight.mockReturnValueOnce(heightResult);
            expect(controller.setHeight(500)).toBe(heightResult);
            expect(table.setHeight).toHaveBeenCalledOnce();
            expect(table.setHeight).toHaveBeenCalledWith(500);

            table.setMinHeight.mockReturnValueOnce(minHeightResult);
            expect(controller.setMinHeight(250)).toBe(minHeightResult);
            expect(table.setMinHeight).toHaveBeenCalledOnce();
            expect(table.setMinHeight).toHaveBeenCalledWith(250);

            table.setMaxHeight.mockReturnValueOnce(maxHeightResult);
            expect(controller.setMaxHeight('80vh')).toBe(maxHeightResult);
            expect(table.setMaxHeight).toHaveBeenCalledOnce();
            expect(table.setMaxHeight).toHaveBeenCalledWith('80vh');

            expect(controller.getSearchState()).toEqual(searchState);
            expect(controller.getSelectedData()).toBe(selectedRows);
            expect(controller.getFilters()).toEqual(filters);
            expect(controller.getSorters()).toBe(sorters);
            expect(controller.getPage()).toBe(1);
            expect(table.getElement).not.toHaveBeenCalled();
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
            expect(table.blockRedraw).not.toHaveBeenCalled();
            expect(table.restoreRedraw).not.toHaveBeenCalled();
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

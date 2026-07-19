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
            this.filters = [];
            this.selectedRows = [];
            this.selectedData = [];
            this.getFilters = vi.fn(() => this.filters);
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
            this.getSelectedData = vi.fn(() => this.selectedData);
            this.getSelectedRows = vi.fn(() => this.selectedRows);
            this.selectRow = vi.fn();
            this.deselectRow = vi.fn();
            this.getData = vi.fn(() => []);
            this.setData = vi.fn();
            this.replaceData = vi.fn();
            this.updateData = vi.fn();
            this.getDataCount = vi.fn(() => 0);
            this.searchData = vi.fn(() => []);
            this.getRows = vi.fn(() => []);
            this.getRow = vi.fn(() => false);
            this.getRowPosition = vi.fn(() => false);
            this.getRowFromPosition = vi.fn(() => false);
            this.scrollToRow = vi.fn(() => Promise.resolve());
            this.searchRows = vi.fn(() => []);
            this.getGroups = vi.fn(() => []);
            this.setGroupBy = vi.fn();
            this.setGroupValues = vi.fn();
            this.setGroupStartOpen = vi.fn();
            this.setGroupHeader = vi.fn();
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
            this.getCalcResults = vi.fn(() => ({}));
            this.recalc = vi.fn();
            this.setLocale = vi.fn();
            this.getLocale = vi.fn(() => 'en');
            this.getLang = vi.fn(() => ({}));
            this.redraw = vi.fn();
            this.blockRedraw = vi.fn();
            this.restoreRedraw = vi.fn();
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
            this.updateRowFields = vi.fn();
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
            add: vi.fn(),
            remove: vi.fn(),
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
    const body = new ElementMock();
    const createElement = vi.fn(() => new ElementMock());
    const querySelector = vi.fn(() => mount);

    parent.appendChild(mount);

    globalThis.document = {
        body,
        createElement,
        querySelector,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        activeElement: null
    };
    tabulatorMock.instances.length = 0;
    crudMock.instances.length = 0;

    return {
        mount,
        createElement,
        querySelector,
        restore() {
            globalThis.document = originalDocument;
        }
    };
};

const clearTableSideEffects = table => {
    table.getColumns.mockClear();
    table.getData.mockClear();
    table.getRows.mockClear();
    table.setData.mockClear?.();
    table.replaceData?.mockClear?.();
    table.updateData?.mockClear?.();
    table.addFilter.mockClear();
    table.setFilter.mockClear();
    table.removeFilter.mockClear();
    table.clearFilter.mockClear();
    table.refreshFilter.mockClear();
    table.setSort.mockClear();
    table.clearSort.mockClear();
    table.selectRow.mockClear();
    table.deselectRow.mockClear();
    table.setPage.mockClear();
    table.setPageSize.mockClear();
    table.nextPage.mockClear();
    table.previousPage.mockClear();
    table.redraw.mockClear();
};

const clearCrudSetupCalls = crud => {
    crud.on.mockClear();
    crud.addCellValidator.mockClear();
    crud.findRowByKey.mockClear();
    crud.getSavePayload.mockClear();
    crud.getStateReport.mockClear();
    crud.validateRow.mockClear();
    crud.updateRowFields.mockClear();
    crud.deleteRow.mockClear();
    crud.rollbackRow.mockClear();
    crud.destroy.mockClear();
};

describe('AMB table controller alert API', () => {
    test('exposes flat alert methods and keeps AMB UI tools separate', () => {
        const harness = createDocumentHarness();

        try {
            const controller = createTable({
                selector: harness.mount,
                columns: [
                    { title: 'Name', field: 'name' },
                    { title: 'Status', field: 'status' }
                ],
                search: {
                    enabled: true
                },
                toolbar: false
            });
            const table = tabulatorMock.instances[0];
            const crud = crudMock.instances[0];
            const loadingResult = { alert: 'loading' };
            const errorResult = { alert: 'error' };
            const clearResult = { clear: true };
            const feedback = controller.feedback;
            const floatingMessage = controller._floatingMessage;
            const confirmDialog = controller._confirmDialog;
            const cellMessageBinder = controller._cellMessageBinder;

            vi.spyOn(feedback, 'clear');
            vi.spyOn(feedback, 'destroy');
            vi.spyOn(floatingMessage, 'hide');
            vi.spyOn(floatingMessage, 'destroy');
            vi.spyOn(confirmDialog, '_close');
            vi.spyOn(confirmDialog, 'destroy');
            vi.spyOn(cellMessageBinder, 'destroy');

            expect(controller.table).toBe(table);
            expect(typeof controller.alert).toBe('function');
            expect(typeof controller.clearAlert).toBe('function');
            expect(controller.alerts).toBeUndefined();
            expect(controller.alertMethods).toBeUndefined();
            expect(controller.messages).toBeUndefined();
            expect(controller.ui).toBeUndefined();
            expect(controller.controllerMethods).toBeUndefined();

            expect(controller.setSearchQuery('Mario')).toBe(true);
            const searchState = controller.getSearchState();
            const filters = table.getFilters();
            const selectedRows = table.getSelectedRows();
            const page = table.getPage();
            const pageSize = table.getPageSize();

            clearTableSideEffects(table);
            clearCrudSetupCalls(crud);
            harness.createElement.mockClear();
            harness.querySelector.mockClear();

            table.alert
                .mockReturnValueOnce(loadingResult)
                .mockReturnValueOnce(errorResult);
            table.clearAlert.mockReturnValueOnce(clearResult);

            expect(controller.alert('Caricamento...')).toBe(loadingResult);
            expect(table.alert).toHaveBeenCalledOnce();
            expect(table.alert).toHaveBeenLastCalledWith('Caricamento...');

            expect(controller.alert('Errore', 'error')).toBe(errorResult);
            expect(table.alert).toHaveBeenCalledTimes(2);
            expect(table.alert).toHaveBeenLastCalledWith('Errore', 'error');

            expect(controller.clearAlert()).toBe(clearResult);
            expect(table.clearAlert).toHaveBeenCalledOnce();
            expect(table.clearAlert).toHaveBeenLastCalledWith();
            expect(table.alert).toHaveBeenCalledTimes(2);
            expect(controller.getSearchState()).toEqual(searchState);
            expect(table.getFilters()).toBe(filters);
            expect(table.getSelectedRows()).toBe(selectedRows);
            expect(table.getPage()).toBe(page);
            expect(table.getPageSize()).toBe(pageSize);
            expect(table.getColumns).not.toHaveBeenCalled();
            expect(table.getData).not.toHaveBeenCalled();
            expect(table.getRows).not.toHaveBeenCalled();
            expect(table.setData).not.toHaveBeenCalled();
            expect(table.replaceData).not.toHaveBeenCalled();
            expect(table.updateData).not.toHaveBeenCalled();
            expect(table.addFilter).not.toHaveBeenCalled();
            expect(table.setFilter).not.toHaveBeenCalled();
            expect(table.removeFilter).not.toHaveBeenCalled();
            expect(table.clearFilter).not.toHaveBeenCalled();
            expect(table.refreshFilter).not.toHaveBeenCalled();
            expect(table.setSort).not.toHaveBeenCalled();
            expect(table.clearSort).not.toHaveBeenCalled();
            expect(table.selectRow).not.toHaveBeenCalled();
            expect(table.deselectRow).not.toHaveBeenCalled();
            expect(table.setPage).not.toHaveBeenCalled();
            expect(table.setPageSize).not.toHaveBeenCalled();
            expect(table.nextPage).not.toHaveBeenCalled();
            expect(table.previousPage).not.toHaveBeenCalled();
            expect(table.redraw).not.toHaveBeenCalled();
            expect(crud.on).not.toHaveBeenCalled();
            expect(crud.addCellValidator).not.toHaveBeenCalled();
            expect(crud.findRowByKey).not.toHaveBeenCalled();
            expect(crud.getSavePayload).not.toHaveBeenCalled();
            expect(crud.getStateReport).not.toHaveBeenCalled();
            expect(crud.validateRow).not.toHaveBeenCalled();
            expect(crud.updateRowFields).not.toHaveBeenCalled();
            expect(crud.deleteRow).not.toHaveBeenCalled();
            expect(crud.rollbackRow).not.toHaveBeenCalled();
            expect(crud.destroy).not.toHaveBeenCalled();
            expect(controller.feedback).toBe(feedback);
            expect(controller._floatingMessage).toBe(floatingMessage);
            expect(controller._confirmDialog).toBe(confirmDialog);
            expect(feedback.clear).not.toHaveBeenCalled();
            expect(feedback.destroy).not.toHaveBeenCalled();
            expect(floatingMessage.hide).not.toHaveBeenCalled();
            expect(floatingMessage.destroy).not.toHaveBeenCalled();
            expect(confirmDialog._close).not.toHaveBeenCalled();
            expect(confirmDialog.destroy).not.toHaveBeenCalled();
            expect(cellMessageBinder.destroy).not.toHaveBeenCalled();
            expect(harness.createElement).not.toHaveBeenCalled();
            expect(harness.querySelector).not.toHaveBeenCalled();
        } finally {
            harness.restore();
        }
    });
});

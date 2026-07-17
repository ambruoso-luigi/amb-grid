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
            this.getRows = vi.fn(() => []);
            this.getRow = vi.fn(() => false);
            this.getRowPosition = vi.fn(() => false);
            this.getRowFromPosition = vi.fn(() => false);
            this.getPage = vi.fn(() => 1);
            this.getPageMax = vi.fn(() => 5);
            this.getPageSize = vi.fn(() => 25);
            this.setPage = vi.fn();
            this.nextPage = vi.fn();
            this.previousPage = vi.fn();
            this.setPageSize = vi.fn();
            this.setPageToRow = vi.fn();
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

const expectNoCrudMutation = crud => {
    expect(crud.findRowByKey).not.toHaveBeenCalled();
    expect(crud.getSavePayload).not.toHaveBeenCalled();
    expect(crud.getStateReport).not.toHaveBeenCalled();
    expect(crud.validateRow).not.toHaveBeenCalled();
    expect(crud.updateRowFields).not.toHaveBeenCalled();
    expect(crud.deleteRow).not.toHaveBeenCalled();
    expect(crud.rollbackRow).not.toHaveBeenCalled();
    expect(crud.destroy).not.toHaveBeenCalled();
};

describe('AMB table controller programmatic filter action API', () => {
    test('delegates set/remove/clear filters normally when global search is disabled', () => {
        const harness = createDocumentHarness();

        try {
            const controller = createTable({
                selector: harness.mount,
                columns: [
                    { title: 'Status', field: 'status' }
                ],
                toolbar: false
            });
            const table = tabulatorMock.instances[0];
            const crud = crudMock.instances[0];
            const setResult = { set: true };
            const removeResult = { removed: true };
            const clearResult = { cleared: true };

            expect(typeof controller.setFilter).toBe('function');
            expect(typeof controller.removeFilter).toBe('function');
            expect(typeof controller.clearFilter).toBe('function');
            expect(controller.filterMethods).toBeUndefined();
            expect(controller.filters).toBeUndefined();
            expect(controller.controllerMethods).toBeUndefined();

            clearCrudSetupCalls(crud);
            table.setFilter.mockReturnValueOnce(setResult);
            table.removeFilter.mockReturnValueOnce(removeResult);
            table.clearFilter.mockReturnValueOnce(clearResult);

            expect(controller.setFilter('status', '=', 'active')).toBe(setResult);
            expect(table.setFilter).toHaveBeenCalledOnce();
            expect(table.setFilter).toHaveBeenCalledWith('status', '=', 'active');
            expect(table.addFilter).not.toHaveBeenCalled();
            expect(table.removeFilter).not.toHaveBeenCalled();

            expect(controller.removeFilter('status', '=', 'active')).toBe(removeResult);
            expect(table.removeFilter).toHaveBeenCalledOnce();
            expect(table.removeFilter).toHaveBeenCalledWith('status', '=', 'active');

            expect(controller.clearFilter(true)).toBe(clearResult);
            expect(table.clearFilter).toHaveBeenCalledOnce();
            expect(table.clearFilter).toHaveBeenCalledWith(true);
            expect(table.addFilter).not.toHaveBeenCalled();
            expectNoCrudMutation(crud);
        } finally {
            harness.restore();
        }
    });

    test('preserves global search while replacing and clearing developer filters', () => {
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
            const setResult = { set: true };
            const removeResult = { removed: true };
            const clearResult = { cleared: true };
            const clearWithHeadersResult = { cleared: 'headers-too' };

            clearCrudSetupCalls(crud);
            expect(controller.setSearchQuery('Mario')).toBe(true);
            expect(controller.setSearchFields(['name'])).toBe(true);
            expect(controller.setSearchOptions({ wholeWord: true })).toBe(true);
            const searchState = controller.getSearchState();

            table.addFilter.mockClear();
            table.removeFilter.mockClear();
            table.setFilter.mockReturnValueOnce(setResult);

            expect(controller.setFilter('status', '=', 'active')).toBe(setResult);
            expect(table.setFilter).toHaveBeenCalledOnce();
            expect(table.setFilter).toHaveBeenCalledWith('status', '=', 'active');
            expect(table.removeFilter).toHaveBeenCalledOnce();
            expect(table.addFilter).toHaveBeenCalledOnce();
            expect(controller.getSearchState()).toEqual(searchState);

            table.addFilter.mockClear();
            table.removeFilter.mockClear();
            table.removeFilter.mockReturnValueOnce(removeResult);

            expect(controller.removeFilter('status', '=', 'active')).toBe(removeResult);
            expect(table.removeFilter).toHaveBeenCalledOnce();
            expect(table.removeFilter).toHaveBeenCalledWith('status', '=', 'active');
            expect(table.addFilter).not.toHaveBeenCalled();
            expect(controller.getSearchState()).toEqual(searchState);

            table.addFilter.mockClear();
            table.removeFilter.mockClear();
            table.clearFilter.mockReturnValueOnce(clearResult);

            expect(controller.clearFilter()).toBe(clearResult);
            expect(table.clearFilter).toHaveBeenCalledOnce();
            expect(table.clearFilter).toHaveBeenLastCalledWith();
            expect(table.removeFilter).toHaveBeenCalledOnce();
            expect(table.addFilter).toHaveBeenCalledOnce();
            expect(controller.getSearchState()).toEqual(searchState);

            table.addFilter.mockClear();
            table.removeFilter.mockClear();
            table.clearFilter.mockReturnValueOnce(clearWithHeadersResult);

            expect(controller.clearFilter(true)).toBe(clearWithHeadersResult);
            expect(table.clearFilter).toHaveBeenCalledTimes(2);
            expect(table.clearFilter).toHaveBeenLastCalledWith(true);
            expect(table.removeFilter).toHaveBeenCalledOnce();
            expect(table.addFilter).toHaveBeenCalledOnce();
            expect(table.clearHeaderFilter).not.toHaveBeenCalled();
            expect(controller.getSearchState()).toEqual(searchState);
            expectNoCrudMutation(crud);
        } finally {
            harness.restore();
        }
    });
});

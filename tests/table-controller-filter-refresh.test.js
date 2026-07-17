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
            this.setFilter = vi.fn();
            this.addFilter = vi.fn();
            this.removeFilter = vi.fn();
            this.clearFilter = vi.fn();
            this.refreshFilter = vi.fn();
            this.getHeaderFilters = vi.fn(() => []);
            this.getHeaderFilterValue = vi.fn(() => undefined);
            this.setHeaderFilterValue = vi.fn();
            this.setHeaderFilterFocus = vi.fn();
            this.clearHeaderFilter = vi.fn();
            this.setPage = vi.fn();
            this.selectRow = vi.fn();
            this.deselectRow = vi.fn();
            this.getSelectedData = vi.fn(() => []);
            this.getSelectedRows = vi.fn(() => []);
            this.getData = vi.fn(() => []);
            this.getDataCount = vi.fn(() => 0);
            this.getRows = vi.fn(() => []);
            this.getRow = vi.fn(() => false);
            this.getRowPosition = vi.fn(() => false);
            this.getRowFromPosition = vi.fn(() => false);
            this.getPage = vi.fn(() => 1);
            this.getPageMax = vi.fn(() => 5);
            this.getPageSize = vi.fn(() => 25);
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

const expectNoRefreshFilterSideEffects = (table, crud) => {
    expect(table.getFilters).not.toHaveBeenCalled();
    expect(table.setFilter).not.toHaveBeenCalled();
    expect(table.addFilter).not.toHaveBeenCalled();
    expect(table.removeFilter).not.toHaveBeenCalled();
    expect(table.clearFilter).not.toHaveBeenCalled();
    expect(table.getHeaderFilters).not.toHaveBeenCalled();
    expect(table.getHeaderFilterValue).not.toHaveBeenCalled();
    expect(table.setHeaderFilterValue).not.toHaveBeenCalled();
    expect(table.setHeaderFilterFocus).not.toHaveBeenCalled();
    expect(table.clearHeaderFilter).not.toHaveBeenCalled();
    expect(table.setPage).not.toHaveBeenCalled();
    expect(table.selectRow).not.toHaveBeenCalled();
    expect(table.deselectRow).not.toHaveBeenCalled();
    expect(crud.findRowByKey).not.toHaveBeenCalled();
    expect(crud.getSavePayload).not.toHaveBeenCalled();
    expect(crud.getStateReport).not.toHaveBeenCalled();
    expect(crud.validateRow).not.toHaveBeenCalled();
    expect(crud.updateRowFields).not.toHaveBeenCalled();
    expect(crud.deleteRow).not.toHaveBeenCalled();
    expect(crud.rollbackRow).not.toHaveBeenCalled();
    expect(crud.destroy).not.toHaveBeenCalled();
};

describe('AMB table controller filter refresh API', () => {
    test('exposes refreshFilter and keeps the cumulative controller API available', () => {
        const harness = createDocumentHarness();

        try {
            const controller = createTable({
                selector: harness.mount,
                columns: [],
                toolbar: false
            });

            expect(controller.table).toBe(tabulatorMock.instances[0]);
            expect(typeof controller.refreshFilter).toBe('function');
            expect(typeof controller.getHeaderFilters).toBe('function');
            expect(typeof controller.getHeaderFilterValue).toBe('function');
            expect(typeof controller.setHeaderFilterValue).toBe('function');
            expect(typeof controller.setHeaderFilterFocus).toBe('function');
            expect(typeof controller.clearHeaderFilter).toBe('function');
            expect(typeof controller.getSelectedRows).toBe('function');
            expect(typeof controller.getSelectedData).toBe('function');
            expect(typeof controller.getSelectedRowComponents).toBe('function');
            expect(typeof controller.clearSelection).toBe('function');
            expect(typeof controller.selectRow).toBe('function');
            expect(typeof controller.deselectRow).toBe('function');
            expect(typeof controller.setPageToRow).toBe('function');
            expect(typeof controller.setPageSize).toBe('function');
            expect(typeof controller.setPage).toBe('function');
            expect(typeof controller.nextPage).toBe('function');
            expect(typeof controller.previousPage).toBe('function');
            expect(typeof controller.getPage).toBe('function');
            expect(typeof controller.getPageMax).toBe('function');
            expect(typeof controller.getPageSize).toBe('function');
            expect(typeof controller.getRow).toBe('function');
            expect(typeof controller.getRows).toBe('function');
            expect(typeof controller.getRowPosition).toBe('function');
            expect(typeof controller.getRowFromPosition).toBe('function');
            expect(typeof controller.getData).toBe('function');
            expect(typeof controller.getDataCount).toBe('function');
            expect(typeof controller.redraw).toBe('function');
            expect(typeof controller.blockRedraw).toBe('function');
            expect(typeof controller.restoreRedraw).toBe('function');
            expect(controller.filterMethods).toBeUndefined();
            expect(controller.filters).toBeUndefined();
            expect(controller.controllerMethods).toBeUndefined();
        } finally {
            harness.restore();
        }
    });

    test('refreshFilter delegates once without arguments and returns the original result', () => {
        const harness = createDocumentHarness();

        try {
            const controller = createTable({
                selector: harness.mount,
                columns: [],
                toolbar: false
            });
            const table = tabulatorMock.instances[0];
            const crud = crudMock.instances[0];
            const result = { refreshed: true };

            clearCrudSetupCalls(crud);
            table.refreshFilter.mockReturnValueOnce(result);

            const returned = controller.refreshFilter();

            expect(returned).toBe(result);
            expect(returned).not.toBeInstanceOf(Promise);
            expect(table.refreshFilter).toHaveBeenCalledOnce();
            expect(table.refreshFilter).toHaveBeenCalledWith();
            expectNoRefreshFilterSideEffects(table, crud);
        } finally {
            harness.restore();
        }
    });

    test('refreshFilter preserves undefined from the table method', () => {
        const harness = createDocumentHarness();

        try {
            const controller = createTable({
                selector: harness.mount,
                columns: [],
                toolbar: false
            });
            const table = tabulatorMock.instances[0];
            const crud = crudMock.instances[0];

            clearCrudSetupCalls(crud);
            table.refreshFilter.mockReturnValueOnce(undefined);

            expect(controller.refreshFilter()).toBeUndefined();
            expect(table.refreshFilter).toHaveBeenCalledOnce();
            expect(table.refreshFilter).toHaveBeenCalledWith();
            expectNoRefreshFilterSideEffects(table, crud);
        } finally {
            harness.restore();
        }
    });

    test('refreshFilter keeps AMB Grid global search state unchanged', () => {
        const harness = createDocumentHarness();

        try {
            const controller = createTable({
                selector: harness.mount,
                columns: [
                    { title: 'Name', field: 'name' }
                ],
                search: {
                    enabled: true
                },
                toolbar: false
            });
            const table = tabulatorMock.instances[0];
            const crud = crudMock.instances[0];

            clearCrudSetupCalls(crud);
            expect(controller.setSearchQuery('Mario')).toBe(true);
            const searchState = controller.getSearchState();

            table.addFilter.mockClear();
            table.removeFilter.mockClear();
            table.refreshFilter.mockClear();

            expect(controller.refreshFilter()).toBeUndefined();

            expect(table.refreshFilter).toHaveBeenCalledOnce();
            expect(table.refreshFilter).toHaveBeenCalledWith();
            expect(controller.getSearchState()).toEqual(searchState);
            expectNoRefreshFilterSideEffects(table, crud);
        } finally {
            harness.restore();
        }
    });
});

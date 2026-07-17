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

describe('AMB table controller programmatic filter read/add API', () => {
    test('passes through developer filters when global search is disabled', () => {
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
            const developerFilter = { field: 'status', type: '=', value: 'active' };
            const filters = [developerFilter];
            const addResult = { added: true };

            expect(typeof controller.getFilters).toBe('function');
            expect(typeof controller.addFilter).toBe('function');
            expect(controller.filterMethods).toBeUndefined();
            expect(controller.filters).toBeUndefined();
            expect(controller.searchController).toBeUndefined();
            expect(controller.controllerMethods).toBeUndefined();

            table.getFilters.mockReturnValueOnce(filters);
            expect(controller.getFilters()).toBe(filters);
            expect(table.getFilters).toHaveBeenCalledOnce();
            expect(table.getFilters).toHaveBeenCalledWith();

            table.getFilters.mockReturnValueOnce(filters);
            expect(controller.getFilters(true)).toBe(filters);
            expect(table.getFilters).toHaveBeenCalledTimes(2);
            expect(table.getFilters).toHaveBeenLastCalledWith(true);

            table.addFilter.mockReturnValueOnce(addResult);
            expect(controller.addFilter('status', '=', 'active')).toBe(addResult);
            expect(table.addFilter).toHaveBeenCalledOnce();
            expect(table.addFilter).toHaveBeenCalledWith('status', '=', 'active');
            expect(table.setFilter).not.toHaveBeenCalled();
            expect(table.removeFilter).not.toHaveBeenCalled();
            expect(table.clearFilter).not.toHaveBeenCalled();
            expect(table.refreshFilter).not.toHaveBeenCalled();
            expect(table.clearHeaderFilter).not.toHaveBeenCalled();
        } finally {
            harness.restore();
        }
    });

    test('hides the private global-search filter while preserving developer filters', () => {
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
            const developerFilter = { field: 'status', type: '=', value: 'active' };
            const headerFilter = { field: 'name', type: 'like', value: 'Mario' };
            const developerFunction = vi.fn();
            const functionFilter = { field: developerFunction, type: 'function' };
            const nestedOrFilters = [
                { field: 'status', type: '=', value: 'pending' },
                { field: 'status', type: '=', value: 'active' }
            ];
            const addResult = { added: 'developer-filter' };

            expect(controller.setSearchQuery('Mario')).toBe(true);
            const searchState = controller.getSearchState();
            const searchFilter = table.addFilter.mock.calls[0][0];

            expect(typeof searchFilter).toBe('function');

            table.getFilters.mockReturnValueOnce([
                searchFilter,
                developerFilter,
                functionFilter,
                nestedOrFilters
            ]);
            const visibleFilters = controller.getFilters();

            expect(table.getFilters).toHaveBeenCalledOnce();
            expect(table.getFilters).toHaveBeenCalledWith();
            expect(visibleFilters).toEqual([
                developerFilter,
                functionFilter,
                nestedOrFilters
            ]);
            expect(visibleFilters).not.toContain(searchFilter);
            expect(visibleFilters[0]).toBe(developerFilter);
            expect(visibleFilters[1]).toBe(functionFilter);
            expect(visibleFilters[2]).toBe(nestedOrFilters);

            table.getFilters.mockReturnValueOnce([
                searchFilter,
                developerFilter,
                headerFilter
            ]);
            const filtersWithHeaders = controller.getFilters(true);

            expect(table.getFilters).toHaveBeenCalledTimes(2);
            expect(table.getFilters).toHaveBeenLastCalledWith(true);
            expect(filtersWithHeaders).toEqual([
                developerFilter,
                headerFilter
            ]);
            expect(filtersWithHeaders).not.toContain(searchFilter);
            expect(filtersWithHeaders[1]).toBe(headerFilter);
            expect(controller.getSearchState()).toEqual(searchState);

            table.addFilter.mockClear();
            table.removeFilter.mockClear();
            table.setFilter.mockClear();
            table.clearFilter.mockClear();
            table.refreshFilter.mockClear();
            table.clearHeaderFilter.mockClear();

            table.addFilter.mockReturnValueOnce(addResult);
            expect(controller.addFilter('status', '=', 'active')).toBe(addResult);
            expect(table.addFilter).toHaveBeenCalledOnce();
            expect(table.addFilter).toHaveBeenCalledWith('status', '=', 'active');
            expect(table.removeFilter).not.toHaveBeenCalled();
            expect(table.setFilter).not.toHaveBeenCalled();
            expect(table.clearFilter).not.toHaveBeenCalled();
            expect(table.refreshFilter).not.toHaveBeenCalled();
            expect(table.clearHeaderFilter).not.toHaveBeenCalled();
            expect(controller.getSearchState()).toEqual(searchState);
        } finally {
            harness.restore();
        }
    });
});

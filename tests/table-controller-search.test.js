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
            this.addFilter = vi.fn();
            this.removeFilter = vi.fn();
            this.getFilters = vi.fn(() => []);
            this.getHeaderFilters = vi.fn(() => []);
            this.getHeaderFilterValue = vi.fn(() => undefined);
            this.setHeaderFilterValue = vi.fn();
            this.setHeaderFilterFocus = vi.fn();
            this.clearHeaderFilter = vi.fn();
            this.refreshFilter = vi.fn();
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

describe('AMB table controller search API', () => {
    test('keeps flat search methods safe when global search is not configured', () => {
        const harness = createDocumentHarness();

        try {
            const controller = createTable({
                selector: harness.mount,
                columns: [
                    { title: 'Name', field: 'name' }
                ],
                toolbar: false
            });

            expect(typeof controller.setSearchQuery).toBe('function');
            expect(typeof controller.clearSearch).toBe('function');
            expect(typeof controller.getSearchState).toBe('function');
            expect(typeof controller.setSearchFields).toBe('function');
            expect(typeof controller.setSearchOptions).toBe('function');
            expect(controller.searchMethods).toBeUndefined();
            expect(controller.searchController).toBeUndefined();
            expect(controller.search).toBeUndefined();
            expect(controller.controllerMethods).toBeUndefined();
            expect(controller.isSearchFilter).toBeUndefined();
            expect(controller.excludeSearchFilter).toBeUndefined();
            expect(controller.reapplySearchFilter).toBeUndefined();
            expect(controller.destroySearch).toBeUndefined();

            expect(controller.setSearchQuery('Mario')).toBe(false);
            expect(controller.clearSearch()).toBe(false);
            expect(controller.setSearchFields(['name'])).toBe(false);
            expect(controller.setSearchOptions({ wholeWord: true })).toBe(false);

            const first = controller.getSearchState();
            const second = controller.getSearchState();

            expect(first).toEqual({
                query: '',
                selectedFields: [],
                caseSensitive: false,
                wholeWord: false
            });
            expect(second).toEqual(first);
            expect(first).not.toBe(second);
            expect(first.selectedFields).not.toBe(second.selectedFields);
        } finally {
            harness.restore();
        }
    });

    test('delegates flat search methods to the configured search controller behavior', () => {
        const harness = createDocumentHarness();

        try {
            const controller = createTable({
                selector: harness.mount,
                columns: [
                    { title: 'Name', field: 'name' },
                    { title: 'City', field: 'city' },
                    { title: 'State', field: '_state' }
                ],
                search: {
                    enabled: true,
                    caseSensitive: false,
                    wholeWord: false
                },
                toolbar: false
            });
            const table = tabulatorMock.instances[0];
            const fields = ['name'];
            const options = { wholeWord: true, caseSensitive: true };

            expect(controller.searchMethods).toBeUndefined();
            expect(controller.searchController).toBeUndefined();
            expect(controller.search).toBeUndefined();
            expect(controller.controllerMethods).toBeUndefined();
            expect(controller.isSearchFilter).toBeUndefined();
            expect(controller.excludeSearchFilter).toBeUndefined();
            expect(controller.reapplySearchFilter).toBeUndefined();

            expect(controller.getSearchState()).toEqual({
                query: '',
                selectedFields: ['name', 'city'],
                caseSensitive: false,
                wholeWord: false
            });

            expect(controller.setSearchQuery('Mario')).toBe(true);
            expect(controller.getSearchState().query).toBe('Mario');
            expect(table.addFilter).toHaveBeenCalledOnce();

            expect(controller.setSearchFields(fields)).toBe(true);
            expect(controller.getSearchState().selectedFields).toEqual(fields);

            expect(controller.setSearchOptions(options)).toBe(true);
            expect(controller.getSearchState()).toEqual({
                query: 'Mario',
                selectedFields: ['name'],
                caseSensitive: true,
                wholeWord: true
            });

            expect(controller.clearSearch()).toBe(true);
            expect(controller.getSearchState().query).toBe('');
            expect(table.removeFilter).toHaveBeenCalled();
            expect(table.setFilter).toBeUndefined();
            expect(table.clearFilter).toBeUndefined();
        } finally {
            harness.restore();
        }
    });
});

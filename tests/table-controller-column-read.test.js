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
            this.getColumnDefinitions = vi.fn(() => []);
            this.getColumns = vi.fn(() => []);
            this.getColumn = vi.fn(() => false);
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

describe('AMB table controller column-reading API', () => {
    test('exposes flat column-reading methods and preserves delegation contracts', () => {
        const harness = createDocumentHarness();

        try {
            const controller = createTable({
                selector: harness.mount,
                columns: [
                    { title: 'Name', field: 'name' },
                    { title: 'Age', field: 'age' }
                ],
                search: {
                    enabled: true
                },
                toolbar: false
            });
            const table = tabulatorMock.instances[0];
            const crud = crudMock.instances[0];
            const ambDefinition = { title: '', field: '_amb_select' };
            const dataDefinition = { title: 'Name', field: 'name' };
            const definitions = [ambDefinition, dataDefinition];
            const ambComponent = { field: '_amb_actions' };
            const nameComponent = { field: 'name' };
            const flatColumns = [ambComponent, nameComponent];
            const groupComponent = { title: 'Person', columns: [nameComponent] };
            const groupedColumns = [ambComponent, groupComponent];

            expect(controller.table).toBe(table);
            expect(typeof controller.getColumnDefinitions).toBe('function');
            expect(typeof controller.getColumns).toBe('function');
            expect(typeof controller.getColumn).toBe('function');
            expect(controller.columnMethods).toBeUndefined();
            expect(controller.columns).toBeUndefined();
            expect(controller.controllerMethods).toBeUndefined();

            clearCrudSetupCalls(crud);
            const searchState = controller.getSearchState();

            table.getColumnDefinitions.mockReturnValueOnce(definitions);
            expect(controller.getColumnDefinitions()).toBe(definitions);
            expect(table.getColumnDefinitions).toHaveBeenCalledOnce();
            expect(table.getColumnDefinitions).toHaveBeenCalledWith();
            expect(definitions[0]).toBe(ambDefinition);
            expect(definitions[1]).toBe(dataDefinition);

            table.getColumns
                .mockReturnValueOnce(flatColumns)
                .mockReturnValueOnce(groupedColumns);
            expect(controller.getColumns()).toBe(flatColumns);
            expect(table.getColumns).toHaveBeenCalledOnce();
            expect(table.getColumns).toHaveBeenLastCalledWith();
            expect(flatColumns[0]).toBe(ambComponent);
            expect(flatColumns[1]).toBe(nameComponent);

            expect(controller.getColumns(true)).toBe(groupedColumns);
            expect(table.getColumns).toHaveBeenCalledTimes(2);
            expect(table.getColumns).toHaveBeenLastCalledWith(true);
            expect(groupedColumns[1]).toBe(groupComponent);
            expect(groupedColumns[1].columns[0]).toBe(nameComponent);

            table.getColumn
                .mockReturnValueOnce(nameComponent)
                .mockReturnValueOnce(false);
            expect(controller.getColumn('name')).toBe(nameComponent);
            expect(table.getColumn).toHaveBeenCalledOnce();
            expect(table.getColumn).toHaveBeenLastCalledWith('name');
            expect(controller.getColumn('missing')).toBe(false);
            expect(table.getColumn).toHaveBeenCalledTimes(2);
            expect(table.getColumn).toHaveBeenLastCalledWith('missing');

            expect(controller.getSearchState()).toEqual(searchState);
            expect(table.setFilter).not.toHaveBeenCalled();
            expect(table.clearFilter).not.toHaveBeenCalled();
            expect(table.addFilter).not.toHaveBeenCalled();
            expect(table.removeFilter).not.toHaveBeenCalled();
            expect(table.refreshFilter).not.toHaveBeenCalled();
            expect(table.setSort).not.toHaveBeenCalled();
            expect(table.clearSort).not.toHaveBeenCalled();
            expect(table.selectRow).not.toHaveBeenCalled();
            expect(table.deselectRow).not.toHaveBeenCalled();
            expect(table.setPage).not.toHaveBeenCalled();
            expect(table.nextPage).not.toHaveBeenCalled();
            expect(table.previousPage).not.toHaveBeenCalled();
            expect(crud.findRowByKey).not.toHaveBeenCalled();
            expect(crud.getSavePayload).not.toHaveBeenCalled();
            expect(crud.getStateReport).not.toHaveBeenCalled();
            expect(crud.validateRow).not.toHaveBeenCalled();
            expect(crud.updateRowFields).not.toHaveBeenCalled();
            expect(crud.deleteRow).not.toHaveBeenCalled();
            expect(crud.rollbackRow).not.toHaveBeenCalled();
            expect(crud.destroy).not.toHaveBeenCalled();
        } finally {
            harness.restore();
        }
    });
});

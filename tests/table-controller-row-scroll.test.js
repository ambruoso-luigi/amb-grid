import { describe, expect, test, vi } from 'vitest';

const tabulatorMock = vi.hoisted(() => ({
    instances: []
}));

const crudMock = vi.hoisted(() => ({
    instances: []
}));

const rowScrollMock = vi.hoisted(() => {
    const createRowComponent = name => ({
        name,
        select: vi.fn(),
        deselect: vi.fn(),
        scrollTo: vi.fn(),
        pageTo: vi.fn(),
        update: vi.fn(),
        delete: vi.fn()
    });
    const savedRow = createRowComponent('saved-row');
    const tempRow = createRowComponent('temp-row');
    const componentRow = createRowComponent('component-row');

    return {
        savedRow,
        tempRow,
        componentRow
    };
});

vi.mock('tabulator-tables', () => ({
    TabulatorFull: class TabulatorMock {
        constructor(selector, options) {
            this.selector = selector;
            this.options = options;
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
            this.getRows = vi.fn(() => []);
            this.getRow = vi.fn(() => false);
            this.getRowPosition = vi.fn(() => false);
            this.getRowFromPosition = vi.fn(() => false);
            this.scrollToRow = vi.fn(() => Promise.resolve());
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
            this.findRowByKey = vi.fn(identifier => {
                if (identifier === 15) return rowScrollMock.savedRow;
                if (identifier === 'amb-temp-1') return rowScrollMock.tempRow;

                return null;
            });
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

    [
        rowScrollMock.savedRow,
        rowScrollMock.tempRow,
        rowScrollMock.componentRow
    ].forEach(row => {
        row.select.mockClear();
        row.deselect.mockClear();
        row.scrollTo.mockClear();
        row.pageTo.mockClear();
        row.update.mockClear();
        row.delete.mockClear();
    });

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

const expectRowsUntouched = () => {
    [
        rowScrollMock.savedRow,
        rowScrollMock.tempRow,
        rowScrollMock.componentRow
    ].forEach(row => {
        expect(row.select).not.toHaveBeenCalled();
        expect(row.deselect).not.toHaveBeenCalled();
        expect(row.scrollTo).not.toHaveBeenCalled();
        expect(row.pageTo).not.toHaveBeenCalled();
        expect(row.update).not.toHaveBeenCalled();
        expect(row.delete).not.toHaveBeenCalled();
    });
};

describe('AMB table controller row scroll API', () => {
    test('exposes flat row scrolling and preserves AMB-aware delegation', () => {
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
            const backendPromise = Promise.resolve();
            const tempPromise = Promise.resolve('temp');
            const componentPromise = Promise.resolve();

            expect(controller.table).toBe(table);
            expect(typeof controller.scrollToRow).toBe('function');
            expect(controller.rowMethods).toBeUndefined();
            expect(controller.rows).toBeUndefined();
            expect(controller.navigation).toBeUndefined();
            expect(controller.controllerMethods).toBeUndefined();

            clearCrudSetupCalls(crud);
            const searchState = controller.getSearchState();

            table.scrollToRow
                .mockReturnValueOnce(backendPromise)
                .mockReturnValueOnce(tempPromise)
                .mockReturnValueOnce(componentPromise);

            expect(controller.scrollToRow(15)).toBe(backendPromise);
            expect(crud.findRowByKey).toHaveBeenCalledOnce();
            expect(crud.findRowByKey).toHaveBeenLastCalledWith(15);
            expect(table.scrollToRow).toHaveBeenCalledOnce();
            expect(table.scrollToRow).toHaveBeenLastCalledWith(rowScrollMock.savedRow);

            expect(controller.scrollToRow('amb-temp-1', 'center', false)).toBe(tempPromise);
            expect(crud.findRowByKey).toHaveBeenCalledTimes(2);
            expect(crud.findRowByKey).toHaveBeenLastCalledWith('amb-temp-1');
            expect(table.scrollToRow).toHaveBeenCalledTimes(2);
            expect(table.scrollToRow).toHaveBeenLastCalledWith(rowScrollMock.tempRow, 'center', false);
            expect(table.scrollToRow.mock.calls[1][0]).toBe(rowScrollMock.tempRow);
            expect(table.scrollToRow.mock.calls[1][2]).toBe(false);

            expect(controller.scrollToRow(rowScrollMock.componentRow, 'nearest', true)).toBe(componentPromise);
            expect(crud.findRowByKey).toHaveBeenCalledTimes(3);
            expect(crud.findRowByKey).toHaveBeenLastCalledWith(rowScrollMock.componentRow);
            expect(table.scrollToRow).toHaveBeenCalledTimes(3);
            expect(table.scrollToRow).toHaveBeenLastCalledWith(rowScrollMock.componentRow, 'nearest', true);
            expect(table.scrollToRow.mock.calls[2][0]).toBe(rowScrollMock.componentRow);
            expect(table.scrollToRow.mock.calls[2][2]).toBe(true);

            expect(controller.getSearchState()).toEqual(searchState);
            expect(table.setPageToRow).not.toHaveBeenCalled();
            expect(table.setPage).not.toHaveBeenCalled();
            expect(table.nextPage).not.toHaveBeenCalled();
            expect(table.previousPage).not.toHaveBeenCalled();
            expect(table.selectRow).not.toHaveBeenCalled();
            expect(table.deselectRow).not.toHaveBeenCalled();
            expect(table.setFilter).not.toHaveBeenCalled();
            expect(table.clearFilter).not.toHaveBeenCalled();
            expect(table.addFilter).not.toHaveBeenCalled();
            expect(table.removeFilter).not.toHaveBeenCalled();
            expect(table.refreshFilter).not.toHaveBeenCalled();
            expect(table.setSort).not.toHaveBeenCalled();
            expect(table.clearSort).not.toHaveBeenCalled();
            expect(crud.getSavePayload).not.toHaveBeenCalled();
            expect(crud.getStateReport).not.toHaveBeenCalled();
            expect(crud.validateRow).not.toHaveBeenCalled();
            expect(crud.updateRowFields).not.toHaveBeenCalled();
            expect(crud.deleteRow).not.toHaveBeenCalled();
            expect(crud.rollbackRow).not.toHaveBeenCalled();
            expect(crud.destroy).not.toHaveBeenCalled();
            expectRowsUntouched();
        } finally {
            harness.restore();
        }
    });
});

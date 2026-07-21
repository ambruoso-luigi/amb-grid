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
            this.setMaxPage = vi.fn();
            this.setPageToRow = vi.fn();
            this.getFilters = vi.fn(() => []);
            this.getSorters = vi.fn(() => []);
            this.setFilter = vi.fn();
            this.clearFilter = vi.fn();
            this.selectRow = vi.fn();
            this.deselectRow = vi.fn();
            this.redraw = vi.fn(() => 'redraw-result');
            this.blockRedraw = vi.fn(() => 'block-result');
            this.restoreRedraw = vi.fn(() => 'restore-result');
            this.getSelectedData = vi.fn(() => []);
            this.getSelectedRows = vi.fn(() => []);
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
    crud.validateAll.mockClear();
    crud.updateRowFields.mockClear();
    crud.deleteRow.mockClear();
    crud.rollbackRow.mockClear();
    crud.destroy.mockClear();
};

const expectNoPageSizeSideEffects = (table, crud) => {
    expect(table.setPage).not.toHaveBeenCalled();
    expect(table.nextPage).not.toHaveBeenCalled();
    expect(table.previousPage).not.toHaveBeenCalled();
    expect(table.setPageToRow).not.toHaveBeenCalled();
    expect(table.setMaxPage).not.toHaveBeenCalled();
    expect(table.getPage).not.toHaveBeenCalled();
    expect(table.getPageMax).not.toHaveBeenCalled();
    expect(table.getPageSize).not.toHaveBeenCalled();
    expect(table.setFilter).not.toHaveBeenCalled();
    expect(table.clearFilter).not.toHaveBeenCalled();
    expect(table.selectRow).not.toHaveBeenCalled();
    expect(table.deselectRow).not.toHaveBeenCalled();
    expect(crud.getSavePayload).not.toHaveBeenCalled();
    expect(crud.getStateReport).not.toHaveBeenCalled();
    expect(crud.validateRow).not.toHaveBeenCalled();
    expect(crud.validateAll).not.toHaveBeenCalled();
    expect(crud.updateRowFields).not.toHaveBeenCalled();
    expect(crud.deleteRow).not.toHaveBeenCalled();
    expect(crud.rollbackRow).not.toHaveBeenCalled();
    expect(crud.findRowByKey).not.toHaveBeenCalled();
    expect(crud.destroy).not.toHaveBeenCalled();
};

const expectNoSetMaxPageSideEffects = (table, crud) => {
    expect(table.setPage).not.toHaveBeenCalled();
    expect(table.nextPage).not.toHaveBeenCalled();
    expect(table.previousPage).not.toHaveBeenCalled();
    expect(table.setPageSize).not.toHaveBeenCalled();
    expect(table.setPageToRow).not.toHaveBeenCalled();
    expect(table.getPage).not.toHaveBeenCalled();
    expect(table.getPageMax).not.toHaveBeenCalled();
    expect(table.redraw).not.toHaveBeenCalled();
    expect(table.setFilter).not.toHaveBeenCalled();
    expect(table.clearFilter).not.toHaveBeenCalled();
    expect(table.selectRow).not.toHaveBeenCalled();
    expect(table.deselectRow).not.toHaveBeenCalled();
    expect(crud.getSavePayload).not.toHaveBeenCalled();
    expect(crud.getStateReport).not.toHaveBeenCalled();
    expect(crud.validateRow).not.toHaveBeenCalled();
    expect(crud.validateAll).not.toHaveBeenCalled();
    expect(crud.updateRowFields).not.toHaveBeenCalled();
    expect(crud.deleteRow).not.toHaveBeenCalled();
    expect(crud.rollbackRow).not.toHaveBeenCalled();
    expect(crud.findRowByKey).not.toHaveBeenCalled();
    expect(crud.destroy).not.toHaveBeenCalled();
};

describe('AMB table controller pagination page size API', () => {
    test('exposes setPageSize and keeps existing pagination API available', () => {
        const harness = createDocumentHarness();

        try {
            const controller = createTable({
                selector: harness.mount,
                columns: [],
                toolbar: false
            });
            const table = tabulatorMock.instances[0];
            const crud = crudMock.instances[0];

            expect(controller.table).toBe(table);
            expect(typeof controller.setPageSize).toBe('function');
            expect(typeof controller.setMaxPage).toBe('function');
            expect(typeof controller.setPageToRow).toBe('function');
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
            expect(controller.paginationMethods).toBeUndefined();
            expect(controller.pagination).toBeUndefined();
            expect(controller.controllerMethods).toBeUndefined();

            clearCrudSetupCalls(crud);
            expectNoPageSizeSideEffects(table, crud);
        } finally {
            harness.restore();
        }
    });

    test('forwards maximum page values unchanged and preserves runtime results', () => {
        const harness = createDocumentHarness();

        try {
            const controller = createTable({
                selector: harness.mount,
                columns: [],
                data: [
                    {
                        id: 1,
                        name: 'Mario',
                        _state: 'modified',
                        _errors: { name: ['Required'] },
                        _ambTempId: 'amb-1'
                    }
                ],
                toolbar: false
            });
            const table = tabulatorMock.instances[0];
            const crud = crudMock.instances[0];
            const rowData = table.options.data[0];
            const originalState = rowData._state;
            const originalErrors = rowData._errors;
            const originalTempId = rowData._ambTempId;
            const filters = [{ field: 'name', type: 'like', value: 'm' }];
            const sorters = [{ field: 'name', dir: 'asc' }];
            const selectedData = [{ id: 1, name: 'Mario' }];
            const selectedRows = [{ type: 'selected-row' }];
            const sentinel = { pageLimit: 'sentinel' };

            clearCrudSetupCalls(crud);

            table.getFilters.mockReturnValue(filters);
            table.getSorters.mockReturnValue(sorters);
            table.getSelectedData.mockReturnValue(selectedData);
            table.getSelectedRows.mockReturnValue(selectedRows);
            const searchState = controller.getSearchState();

            table.setMaxPage
                .mockReturnValueOnce(undefined)
                .mockReturnValueOnce(sentinel)
                .mockReturnValueOnce(undefined)
                .mockReturnValueOnce('empty-limit-result');

            expect(controller.setMaxPage(12)).toBeUndefined();
            expect(table.setMaxPage).toHaveBeenCalledOnce();
            expect(table.setMaxPage).toHaveBeenLastCalledWith(12);
            expectNoSetMaxPageSideEffects(table, crud);

            expect(controller.setMaxPage('8')).toBe(sentinel);
            expect(table.setMaxPage).toHaveBeenCalledTimes(2);
            expect(table.setMaxPage).toHaveBeenLastCalledWith('8');
            expectNoSetMaxPageSideEffects(table, crud);

            expect(controller.setMaxPage(0)).toBeUndefined();
            expect(table.setMaxPage).toHaveBeenCalledTimes(3);
            expect(table.setMaxPage).toHaveBeenLastCalledWith(0);
            expectNoSetMaxPageSideEffects(table, crud);

            expect(controller.setMaxPage('')).toBe('empty-limit-result');
            expect(table.setMaxPage).toHaveBeenCalledTimes(4);
            expect(table.setMaxPage).toHaveBeenLastCalledWith('');
            expectNoSetMaxPageSideEffects(table, crud);

            expect(controller.getSearchState()).toEqual(searchState);
            expect(controller.getFilters()).toBe(filters);
            expect(controller.getSorters()).toBe(sorters);
            expect(controller.getSelectedData()).toBe(selectedData);
            expect(controller.getSelectedRowComponents()).toBe(selectedRows);
            expect(rowData._state).toBe(originalState);
            expect(rowData._errors).toBe(originalErrors);
            expect(rowData._ambTempId).toBe(originalTempId);
        } finally {
            harness.restore();
        }
    });

    test('forwards page size values unchanged and returns the original result', () => {
        const harness = createDocumentHarness();

        try {
            const controller = createTable({
                selector: harness.mount,
                columns: [],
                toolbar: false
            });
            const table = tabulatorMock.instances[0];
            const crud = crudMock.instances[0];
            const result = { changed: true };

            clearCrudSetupCalls(crud);

            table.setPageSize.mockReturnValueOnce(result);
            expect(controller.setPageSize(25)).toBe(result);
            expect(table.setPageSize).toHaveBeenCalledOnce();
            expect(table.setPageSize).toHaveBeenLastCalledWith(25);
            expectNoPageSizeSideEffects(table, crud);

            table.setPageSize.mockReturnValueOnce('size-50-result');
            expect(controller.setPageSize(50)).toBe('size-50-result');
            expect(table.setPageSize).toHaveBeenCalledTimes(2);
            expect(table.setPageSize).toHaveBeenLastCalledWith(50);
            expectNoPageSizeSideEffects(table, crud);
        } finally {
            harness.restore();
        }
    });

    test('preserves undefined and does not normalize sentinel values', () => {
        const harness = createDocumentHarness();

        try {
            const controller = createTable({
                selector: harness.mount,
                columns: [],
                toolbar: false
            });
            const table = tabulatorMock.instances[0];
            const crud = crudMock.instances[0];
            const size = '25';

            clearCrudSetupCalls(crud);

            table.setPageSize.mockReturnValueOnce(undefined);
            expect(controller.setPageSize(25)).toBeUndefined();
            expect(table.setPageSize).toHaveBeenCalledOnce();
            expect(table.setPageSize).toHaveBeenLastCalledWith(25);
            expectNoPageSizeSideEffects(table, crud);

            table.setPageSize.mockReturnValueOnce('sentinel-result');
            expect(controller.setPageSize(size)).toBe('sentinel-result');
            expect(table.setPageSize).toHaveBeenCalledTimes(2);
            expect(table.setPageSize).toHaveBeenLastCalledWith(size);
            expectNoPageSizeSideEffects(table, crud);
        } finally {
            harness.restore();
        }
    });
});

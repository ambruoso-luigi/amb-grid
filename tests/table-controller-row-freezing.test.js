import { describe, expect, test, vi } from 'vitest';

const tabulatorMock = vi.hoisted(() => ({
    instances: []
}));

const crudMock = vi.hoisted(() => ({
    instances: []
}));

const rowFreezingMock = vi.hoisted(() => {
    const createRow = (name, data) => {
        let frozen = false;

        return {
            name,
            data,
            freeze: vi.fn(() => {
                frozen = true;
            }),
            unfreeze: vi.fn(() => {
                frozen = false;
            }),
            isFrozen: vi.fn(() => frozen),
            getData: vi.fn(() => data),
            select: vi.fn(),
            deselect: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
            scrollTo: vi.fn(),
            pageTo: vi.fn(),
            show: vi.fn(),
            edit: vi.fn()
        };
    };
    const savedData = {
        id: 15,
        name: 'Saved',
        status: 'active',
        _state: 'clean',
        _errors: {},
        _ambTempId: 'amb-saved'
    };
    const tempData = {
        id: null,
        name: 'Temporary',
        status: 'draft',
        _state: 'created',
        _errors: { name: ['Required'] },
        _ambTempId: 'amb-temp-1'
    };
    const fallbackData = {
        id: 30,
        name: 'Fallback',
        status: 'external',
        _state: 'modified',
        _errors: {},
        _ambTempId: 'amb-fallback'
    };

    return {
        savedData,
        tempData,
        fallbackData,
        savedRow: createRow('saved-row', savedData),
        tempRow: createRow('temp-row', tempData),
        fallbackRow: createRow('fallback-row', fallbackData)
    };
});

vi.mock('tabulator-tables', () => ({
    TabulatorFull: class TabulatorMock {
        constructor(selector, options) {
            this.selector = selector;
            this.options = options;
            this.filters = [{ field: 'status', type: '=', value: 'active' }];
            this.sorters = [{ field: 'name', dir: 'asc' }];
            this.selectedData = [{ id: 15 }];
            this.selectedRows = [rowFreezingMock.savedRow];
            this.getData = vi.fn(() => options.data || []);
            this.getDataCount = vi.fn(() => (options.data || []).length);
            this.getRows = vi.fn(() => [
                rowFreezingMock.savedRow,
                rowFreezingMock.tempRow,
                rowFreezingMock.fallbackRow
            ]);
            this.getRow = vi.fn(identifier => (
                identifier && identifier.lookup === 'engine-row'
                    ? rowFreezingMock.fallbackRow
                    : false
            ));
            this.getRowPosition = vi.fn(() => false);
            this.getRowFromPosition = vi.fn(() => false);
            this.getFilters = vi.fn(() => this.filters);
            this.addFilter = vi.fn();
            this.removeFilter = vi.fn();
            this.setFilter = vi.fn();
            this.clearFilter = vi.fn();
            this.refreshFilter = vi.fn();
            this.getHeaderFilters = vi.fn(() => []);
            this.setSort = vi.fn();
            this.getSorters = vi.fn(() => this.sorters);
            this.clearSort = vi.fn();
            this.getPage = vi.fn(() => 2);
            this.getPageMax = vi.fn(() => 4);
            this.getPageSize = vi.fn(() => 25);
            this.setPage = vi.fn();
            this.nextPage = vi.fn();
            this.previousPage = vi.fn();
            this.setPageSize = vi.fn();
            this.setPageToRow = vi.fn();
            this.getSelectedData = vi.fn(() => this.selectedData);
            this.getSelectedRows = vi.fn(() => this.selectedRows);
            this.selectRow = vi.fn();
            this.deselectRow = vi.fn();
            this.redraw = vi.fn();
            this.blockRedraw = vi.fn();
            this.restoreRedraw = vi.fn();
            this.destroy = vi.fn();
            tabulatorMock.instances.push(this);
        }
    }
}));

vi.mock('../src/lib/crud-helper.js', () => ({
    ROW_STATE: {
        CLEAN: 'clean',
        CREATED: 'created',
        MODIFIED: 'modified',
        DELETED: 'deleted'
    },
    CrudHelper: class CrudHelperMock {
        constructor(table, options) {
            this.table = table;
            this.options = {
                idField: 'id',
                stateField: '_state',
                tempIdField: '_ambTempId',
                ...options
            };
            this.on = vi.fn(() => vi.fn());
            this.addCellValidator = vi.fn();
            this.findRowByKey = vi.fn(identifier => {
                if (identifier === 15) return rowFreezingMock.savedRow;
                if (identifier === 'amb-temp-1') return rowFreezingMock.tempRow;

                return null;
            });
            this.getSavePayload = vi.fn(() => ({
                rows: (table.options.data || []).map(row => ({
                    id: row.id,
                    tempId: row._ambTempId,
                    state: row._state,
                    name: row.name,
                    status: row.status
                }))
            }));
            this.getStateReport = vi.fn(() => ({
                rows: (table.options.data || []).map(row => ({
                    id: row.id,
                    tempId: row._ambTempId,
                    state: row._state,
                    errors: row._errors
                }))
            }));
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

    [
        rowFreezingMock.savedRow,
        rowFreezingMock.tempRow,
        rowFreezingMock.fallbackRow
    ].forEach(row => {
        row.freeze.mockClear();
        row.unfreeze.mockClear();
        row.isFrozen.mockClear();
        row.getData.mockClear();
        row.select.mockClear();
        row.deselect.mockClear();
        row.update.mockClear();
        row.delete.mockClear();
        row.scrollTo.mockClear();
        row.pageTo.mockClear();
        row.show.mockClear();
        row.edit.mockClear();
    });

    return {
        mount,
        restore() {
            globalThis.document = originalDocument;
        }
    };
};

const clearSetupCalls = (table, crud) => {
    table.getRows.mockClear();
    table.addFilter.mockClear();
    table.removeFilter.mockClear();
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

const expectNoRuntimeSideEffects = (table, crud) => {
    expect(crud.updateRowFields).not.toHaveBeenCalled();
    expect(crud.addRow).not.toHaveBeenCalled();
    expect(crud.deleteRow).not.toHaveBeenCalled();
    expect(crud.rollbackRow).not.toHaveBeenCalled();
    expect(crud.validateRow).not.toHaveBeenCalled();
    expect(crud.validateAll).not.toHaveBeenCalled();
    expect(table.setFilter).not.toHaveBeenCalled();
    expect(table.clearFilter).not.toHaveBeenCalled();
    expect(table.refreshFilter).not.toHaveBeenCalled();
    expect(table.setSort).not.toHaveBeenCalled();
    expect(table.clearSort).not.toHaveBeenCalled();
    expect(table.setPage).not.toHaveBeenCalled();
    expect(table.nextPage).not.toHaveBeenCalled();
    expect(table.previousPage).not.toHaveBeenCalled();
    expect(table.selectRow).not.toHaveBeenCalled();
    expect(table.deselectRow).not.toHaveBeenCalled();
    expect(table.redraw).not.toHaveBeenCalled();
};

describe('AMB table controller row freezing API', () => {
    test('exposes row freezing directly on the main grid controller', () => {
        const harness = createDocumentHarness();

        try {
            const controller = createTable({
                selector: harness.mount,
                columns: [],
                data: [],
                toolbar: false
            });

            expect(controller.table).toBe(tabulatorMock.instances[0]);
            expect(typeof controller.freezeRow).toBe('function');
            expect(typeof controller.unfreezeRow).toBe('function');
            expect(typeof controller.isRowFrozen).toBe('function');
            expect(typeof controller.getRow).toBe('function');
            expect(typeof controller.getRows).toBe('function');
            expect(controller.rows).toBeUndefined();
            expect(controller.frozenRows).toBeUndefined();
            expect(controller.rowFreezing).toBeUndefined();
            expect(controller.controllerMethods).toBeUndefined();
        } finally {
            harness.restore();
        }
    });

    test('freezes rows by AMB identifiers or engine fallback without changing grid state', () => {
        const harness = createDocumentHarness();

        try {
            const data = [
                rowFreezingMock.savedData,
                rowFreezingMock.tempData,
                rowFreezingMock.fallbackData
            ];
            const originalData = structuredClone(data);
            const controller = createTable({
                selector: harness.mount,
                columns: [
                    { title: 'Name', field: 'name' },
                    { title: 'Status', field: 'status' }
                ],
                data,
                search: {
                    enabled: true
                },
                toolbar: false
            });
            const table = tabulatorMock.instances[0];
            const crud = crudMock.instances[0];
            const lookup = { lookup: 'engine-row' };

            controller.setSearchQuery('Saved');
            const searchStateBefore = controller.getSearchState();
            const filtersBefore = controller.getFilters();
            const sortersBefore = controller.getSorters();
            const selectedDataBefore = controller.getSelectedData();
            const selectedRowsBefore = controller.getSelectedRowComponents();
            const pageBefore = controller.getPage();
            const payloadBefore = controller.crud.getSavePayload();
            const stateBefore = controller.crud.getStateReport();

            clearSetupCalls(table, crud);

            expect(controller.freezeRow(15)).toBe(true);
            expect(crud.findRowByKey).toHaveBeenLastCalledWith(15);
            expect(table.getRow).not.toHaveBeenCalled();
            expect(rowFreezingMock.savedRow.freeze).toHaveBeenCalledOnce();
            expect(controller.isRowFrozen(15)).toBe(true);
            expect(controller.unfreezeRow(15)).toBe(true);
            expect(controller.isRowFrozen(15)).toBe(false);

            expect(controller.freezeRow('amb-temp-1')).toBe(true);
            expect(crud.findRowByKey).toHaveBeenLastCalledWith('amb-temp-1');
            expect(rowFreezingMock.tempRow.freeze).toHaveBeenCalledOnce();
            expect(controller.unfreezeRow('amb-temp-1')).toBe(true);

            expect(controller.freezeRow(lookup)).toBe(true);
            expect(crud.findRowByKey).toHaveBeenLastCalledWith(lookup);
            expect(table.getRow).toHaveBeenLastCalledWith(lookup);
            expect(rowFreezingMock.fallbackRow.freeze).toHaveBeenCalledOnce();
            expect(controller.unfreezeRow(lookup)).toBe(true);

            expect(controller.freezeRow('missing-row')).toBe(false);
            expect(controller.unfreezeRow('missing-row')).toBe(false);
            expect(controller.isRowFrozen('missing-row')).toBe(false);

            expect(crud.getSavePayload).not.toHaveBeenCalled();
            expect(crud.getStateReport).not.toHaveBeenCalled();
            expect(data).toEqual(originalData);
            expect(controller.crud.getSavePayload()).toEqual(payloadBefore);
            expect(controller.crud.getStateReport()).toEqual(stateBefore);
            expect(controller.getSearchState()).toEqual(searchStateBefore);
            expect(controller.getFilters()).toEqual(filtersBefore);
            expect(controller.getSorters()).toBe(sortersBefore);
            expect(controller.getSelectedData()).toBe(selectedDataBefore);
            expect(controller.getSelectedRowComponents()).toBe(selectedRowsBefore);
            expect(controller.getPage()).toBe(pageBefore);
            expectNoRuntimeSideEffects(table, crud);
        } finally {
            harness.restore();
        }
    });
});

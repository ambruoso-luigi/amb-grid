import { describe, expect, test, vi } from 'vitest';

const tabulatorMock = vi.hoisted(() => ({
    instances: []
}));

const crudMock = vi.hoisted(() => ({
    instances: []
}));

const dataTreeMock = vi.hoisted(() => {
    const createRow = (name, data) => {
        let expanded = false;
        const row = {
            name,
            data,
            parent: false,
            children: [],
            treeExpand: vi.fn(() => {
                expanded = true;
            }),
            treeCollapse: vi.fn(() => {
                expanded = false;
            }),
            treeToggle: vi.fn(() => {
                expanded = !expanded;
            }),
            getTreeParent: vi.fn(() => row.parent),
            getTreeChildren: vi.fn(() => row.children),
            isTreeExpanded: vi.fn(() => expanded),
            addTreeChild: vi.fn(),
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

        return row;
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
    const savedRow = createRow('saved-row', savedData);
    const tempRow = createRow('temp-row', tempData);
    const fallbackRow = createRow('fallback-row', fallbackData);

    tempRow.parent = savedRow;
    fallbackRow.parent = savedRow;
    savedRow.children = [tempRow, fallbackRow];

    return {
        savedData,
        tempData,
        fallbackData,
        savedRow,
        tempRow,
        fallbackRow,
        rows: [savedRow, tempRow, fallbackRow]
    };
});

vi.mock('tabulator-tables', () => ({
    TabulatorFull: class TabulatorMock {
        constructor(selector, options) {
            this.selector = selector;
            this.options = options;
            this.filters = [{ field: 'status', type: '=', value: 'active' }];
            this.sorters = [{ field: 'name', dir: 'asc' }];
            this.selectedData = [dataTreeMock.savedData];
            this.selectedRows = [dataTreeMock.savedRow];
            this.getData = vi.fn(() => options.data || []);
            this.getDataCount = vi.fn(() => (options.data || []).length);
            this.getRows = vi.fn(() => dataTreeMock.rows);
            this.getRow = vi.fn(identifier => (
                identifier && identifier.lookup === 'engine-row'
                    ? dataTreeMock.fallbackRow
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
            this.setData = vi.fn();
            this.replaceData = vi.fn();
            this.updateData = vi.fn();
            this.addData = vi.fn();
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
                if (identifier === 15) return dataTreeMock.savedRow;
                if (identifier === 'amb-temp-1') return dataTreeMock.tempRow;

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

    dataTreeMock.rows.forEach(row => {
        row.treeExpand.mockClear();
        row.treeCollapse.mockClear();
        row.treeToggle.mockClear();
        row.getTreeParent.mockClear();
        row.getTreeChildren.mockClear();
        row.isTreeExpanded.mockClear();
        row.addTreeChild.mockClear();
        row.getData.mockClear();
        row.select.mockClear();
        row.deselect.mockClear();
        row.update.mockClear();
        row.delete.mockClear();
        row.scrollTo.mockClear();
        row.pageTo.mockClear();
        row.show.mockClear();
        row.edit.mockClear();
        if (row.isTreeExpanded()) row.treeCollapse();
        row.isTreeExpanded.mockClear();
        row.treeCollapse.mockClear();
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
    expect(table.setData).not.toHaveBeenCalled();
    expect(table.replaceData).not.toHaveBeenCalled();
    expect(table.updateData).not.toHaveBeenCalled();
    expect(table.addData).not.toHaveBeenCalled();
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

describe('AMB table controller Data Tree row API', () => {
    test('exposes Data Tree row methods directly on the main grid controller', () => {
        const harness = createDocumentHarness();

        try {
            const controller = createTable({
                selector: harness.mount,
                columns: [],
                data: [],
                dataTree: true,
                toolbar: false
            });

            expect(controller.table).toBe(tabulatorMock.instances[0]);
            expect(typeof controller.expandTreeRow).toBe('function');
            expect(typeof controller.collapseTreeRow).toBe('function');
            expect(typeof controller.toggleTreeRow).toBe('function');
            expect(typeof controller.getTreeParent).toBe('function');
            expect(typeof controller.getTreeChildren).toBe('function');
            expect(typeof controller.isTreeExpanded).toBe('function');
            expect(controller.tree).toBeUndefined();
            expect(controller.rows).toBeUndefined();
            expect(controller.dataTree).toBeUndefined();
            expect(controller.rowMethods).toBeUndefined();
            expect(controller.addTreeChild).toBeUndefined();
        } finally {
            harness.restore();
        }
    });

    test('delegates Data Tree row operations without changing AMB-managed state', () => {
        const harness = createDocumentHarness();

        try {
            const data = [
                dataTreeMock.savedData,
                dataTreeMock.tempData,
                dataTreeMock.fallbackData
            ];
            const originalData = structuredClone(data);
            const controller = createTable({
                selector: harness.mount,
                columns: [
                    { title: 'Name', field: 'name' },
                    { title: 'Status', field: 'status' }
                ],
                data,
                dataTree: true,
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

            expect(controller.expandTreeRow(15)).toBe(true);
            expect(crud.findRowByKey).toHaveBeenLastCalledWith(15);
            expect(table.getRow).not.toHaveBeenCalled();
            expect(dataTreeMock.savedRow.treeExpand).toHaveBeenCalledOnce();
            expect(controller.isTreeExpanded(15)).toBe(true);

            expect(controller.collapseTreeRow('amb-temp-1')).toBe(true);
            expect(crud.findRowByKey).toHaveBeenLastCalledWith('amb-temp-1');
            expect(dataTreeMock.tempRow.treeCollapse).toHaveBeenCalledOnce();

            expect(controller.toggleTreeRow(lookup)).toBe(true);
            expect(crud.findRowByKey).toHaveBeenLastCalledWith(lookup);
            expect(table.getRow).toHaveBeenLastCalledWith(lookup);
            expect(dataTreeMock.fallbackRow.treeToggle).toHaveBeenCalledOnce();
            expect(controller.isTreeExpanded(lookup)).toBe(true);
            expect(controller.toggleTreeRow(lookup)).toBe(true);
            expect(controller.isTreeExpanded(lookup)).toBe(false);

            expect(controller.getTreeParent('amb-temp-1')).toBe(dataTreeMock.savedRow);
            expect(controller.getTreeChildren(15)).toBe(dataTreeMock.savedRow.children);
            expect(controller.getTreeChildren(15)[0]).toBe(dataTreeMock.tempRow);
            expect(controller.getTreeChildren(15)[1]).toBe(dataTreeMock.fallbackRow);
            expect(controller.expandTreeRow('missing-row')).toBe(false);
            expect(controller.getTreeParent('missing-row')).toBe(false);
            expect(controller.getTreeChildren('missing-row')).toBe(false);
            expect(controller.isTreeExpanded('missing-row')).toBe(false);

            expect(dataTreeMock.savedRow.addTreeChild).not.toHaveBeenCalled();
            expect(dataTreeMock.tempRow.addTreeChild).not.toHaveBeenCalled();
            expect(dataTreeMock.fallbackRow.addTreeChild).not.toHaveBeenCalled();
            expect(crud.getSavePayload).not.toHaveBeenCalled();
            expect(crud.getStateReport).not.toHaveBeenCalled();
            expect(data).toEqual(originalData);
            expect(data[0]._state).toBe(originalData[0]._state);
            expect(data[1]._state).toBe(originalData[1]._state);
            expect(data[2]._state).toBe(originalData[2]._state);
            expect(data[0]._ambTempId).toBe(originalData[0]._ambTempId);
            expect(data[1]._ambTempId).toBe(originalData[1]._ambTempId);
            expect(data[2]._ambTempId).toBe(originalData[2]._ambTempId);
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

    test('returns false when Data Tree is disabled or a row is unavailable', () => {
        const harness = createDocumentHarness();

        try {
            const controller = createTable({
                selector: harness.mount,
                columns: [],
                data: [dataTreeMock.savedData],
                dataTree: false,
                toolbar: false
            });
            const table = tabulatorMock.instances[0];
            const crud = crudMock.instances[0];

            clearSetupCalls(table, crud);

            expect(controller.expandTreeRow(15)).toBe(false);
            expect(controller.collapseTreeRow(15)).toBe(false);
            expect(controller.toggleTreeRow(15)).toBe(false);
            expect(controller.getTreeParent(15)).toBe(false);
            expect(controller.getTreeChildren(15)).toBe(false);
            expect(controller.isTreeExpanded(15)).toBe(false);
            expect(crud.findRowByKey).not.toHaveBeenCalled();
            expect(table.getRow).not.toHaveBeenCalled();
            expect(dataTreeMock.savedRow.treeExpand).not.toHaveBeenCalled();
            expect(dataTreeMock.savedRow.treeCollapse).not.toHaveBeenCalled();
            expect(dataTreeMock.savedRow.treeToggle).not.toHaveBeenCalled();
            expect(dataTreeMock.savedRow.addTreeChild).not.toHaveBeenCalled();
            expect(controller.addTreeChild).toBeUndefined();
            expectNoRuntimeSideEffects(table, crud);
        } finally {
            harness.restore();
        }
    });
});

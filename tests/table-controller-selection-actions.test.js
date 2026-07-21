import { describe, expect, test, vi } from 'vitest';

const tabulatorMock = vi.hoisted(() => ({
    instances: []
}));

const crudMock = vi.hoisted(() => ({
    instances: []
}));

const selectionActionMock = vi.hoisted(() => {
    const createRow = name => ({
        name,
        select: vi.fn(),
        deselect: vi.fn(),
        toggleSelect: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        scrollTo: vi.fn(),
        pageTo: vi.fn(),
        show: vi.fn(),
        edit: vi.fn()
    });

    return {
        savedRow: createRow('saved-row'),
        tempRow: createRow('temp-row'),
        noSelectRow: {
            name: 'no-select-row',
            deselect: vi.fn(),
            toggleSelect: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
            scrollTo: vi.fn(),
            pageTo: vi.fn(),
            show: vi.fn(),
            edit: vi.fn()
        },
        noDeselectRow: {
            name: 'no-deselect-row',
            select: vi.fn(),
            toggleSelect: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
            scrollTo: vi.fn(),
            pageTo: vi.fn(),
            show: vi.fn(),
            edit: vi.fn()
        },
        noToggleRow: {
            name: 'no-toggle-row',
            select: vi.fn(),
            deselect: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
            scrollTo: vi.fn(),
            pageTo: vi.fn(),
            show: vi.fn(),
            edit: vi.fn()
        }
    };
});

vi.mock('tabulator-tables', () => ({
    TabulatorFull: class TabulatorMock {
        constructor(selector, options) {
            this.selector = selector;
            this.options = options;
            this.getSelectedData = vi.fn(() => []);
            this.getSelectedRows = vi.fn(() => []);
            this.selectRow = vi.fn();
            this.deselectRow = vi.fn();
            this.toggleSelectRow = vi.fn();
            this.getFilters = vi.fn(() => []);
            this.getSorters = vi.fn(() => []);
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
            this.findRowByKey = vi.fn(identifier => {
                if (identifier === 15) return selectionActionMock.savedRow;
                if (identifier === 'amb-temp-1') return selectionActionMock.tempRow;
                if (identifier === 'no-select') return selectionActionMock.noSelectRow;
                if (identifier === 'no-deselect') return selectionActionMock.noDeselectRow;
                if (identifier === 'no-toggle') return selectionActionMock.noToggleRow;

                return null;
            });
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

const getRows = () => [
    selectionActionMock.savedRow,
    selectionActionMock.tempRow,
    selectionActionMock.noSelectRow,
    selectionActionMock.noDeselectRow,
    selectionActionMock.noToggleRow
];

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

    getRows().forEach(row => {
        Object.values(row).forEach(value => {
            if (typeof value === 'function' && typeof value.mockClear === 'function') {
                value.mockClear();
            }
        });
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
    crud.validateAll.mockClear();
    crud.updateRowFields.mockClear();
    crud.deleteRow.mockClear();
    crud.rollbackRow.mockClear();
    crud.destroy.mockClear();
};

const expectNoCrudMutation = crud => {
    expect(crud.getSavePayload).not.toHaveBeenCalled();
    expect(crud.getStateReport).not.toHaveBeenCalled();
    expect(crud.validateRow).not.toHaveBeenCalled();
    expect(crud.validateAll).not.toHaveBeenCalled();
    expect(crud.updateRowFields).not.toHaveBeenCalled();
    expect(crud.deleteRow).not.toHaveBeenCalled();
    expect(crud.rollbackRow).not.toHaveBeenCalled();
    expect(crud.destroy).not.toHaveBeenCalled();
};

const expectNoRowSideEffects = ({ allowSelect = [], allowDeselect = [], allowToggleSelect = [] } = {}) => {
    const allowedSelectRows = Array.isArray(allowSelect) ? allowSelect : [allowSelect];
    const allowedDeselectRows = Array.isArray(allowDeselect) ? allowDeselect : [allowDeselect];
    const allowedToggleSelectRows = Array.isArray(allowToggleSelect)
        ? allowToggleSelect
        : [allowToggleSelect];

    getRows().forEach(row => {
        if (!allowedSelectRows.includes(row) && typeof row.select === 'function') {
            expect(row.select).not.toHaveBeenCalled();
        }
        if (!allowedDeselectRows.includes(row) && typeof row.deselect === 'function') {
            expect(row.deselect).not.toHaveBeenCalled();
        }
        if (!allowedToggleSelectRows.includes(row) && typeof row.toggleSelect === 'function') {
            expect(row.toggleSelect).not.toHaveBeenCalled();
        }
        expect(row.update).not.toHaveBeenCalled();
        expect(row.delete).not.toHaveBeenCalled();
        expect(row.scrollTo).not.toHaveBeenCalled();
        expect(row.pageTo).not.toHaveBeenCalled();
        expect(row.show).not.toHaveBeenCalled();
        expect(row.edit).not.toHaveBeenCalled();
    });
};

describe('AMB table controller selection action API', () => {
    test('keeps the cumulative controller API available', () => {
        const harness = createDocumentHarness();

        try {
            const controller = createTable({
                selector: harness.mount,
                columns: [],
                toolbar: false
            });

            expect(controller.table).toBe(tabulatorMock.instances[0]);
            expect(typeof controller.getSelectedRows).toBe('function');
            expect(typeof controller.getSelectedData).toBe('function');
            expect(typeof controller.getSelectedRowComponents).toBe('function');
            expect(typeof controller.clearSelection).toBe('function');
            expect(typeof controller.selectRow).toBe('function');
            expect(typeof controller.deselectRow).toBe('function');
            expect(typeof controller.toggleSelectRow).toBe('function');
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
            expect(controller.selectionMethods).toBeUndefined();
            expect(controller.selection).toBeUndefined();
            expect(controller.controllerMethods).toBeUndefined();
        } finally {
            harness.restore();
        }
    });

    test('clearSelection clears all selected rows through table deselection', () => {
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

            expect(controller.clearSelection()).toBeUndefined();
            expect(table.deselectRow).toHaveBeenCalledOnce();
            expect(table.deselectRow).toHaveBeenCalledWith();
            expect(table.selectRow).not.toHaveBeenCalled();
            expect(table.toggleSelectRow).not.toHaveBeenCalled();
            expect(crud.findRowByKey).not.toHaveBeenCalled();
            expectNoCrudMutation(crud);
            expectNoRowSideEffects();
        } finally {
            harness.restore();
        }
    });

    test('clearSelection is a no-op when table deselection is unavailable', () => {
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
            table.deselectRow = undefined;

            expect(() => controller.clearSelection()).not.toThrow();
            expect(controller.clearSelection()).toBeUndefined();
            expect(table.selectRow).not.toHaveBeenCalled();
            expect(table.toggleSelectRow).not.toHaveBeenCalled();
            expect(crud.findRowByKey).not.toHaveBeenCalled();
            expectNoCrudMutation(crud);
            expectNoRowSideEffects();
        } finally {
            harness.restore();
        }
    });

    test('selectRow selects one row resolved by backend id or AMB temporary id', () => {
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

            expect(controller.selectRow(15)).toBe(true);
            expect(crud.findRowByKey).toHaveBeenCalledOnce();
            expect(crud.findRowByKey).toHaveBeenLastCalledWith(15);
            expect(selectionActionMock.savedRow.select).toHaveBeenCalledOnce();
            expect(table.selectRow).not.toHaveBeenCalled();
            expect(table.toggleSelectRow).not.toHaveBeenCalled();
            expectNoRowSideEffects({ allowSelect: selectionActionMock.savedRow });

            expect(controller.selectRow('amb-temp-1')).toBe(true);
            expect(crud.findRowByKey).toHaveBeenCalledTimes(2);
            expect(crud.findRowByKey).toHaveBeenLastCalledWith('amb-temp-1');
            expect(selectionActionMock.tempRow.select).toHaveBeenCalledOnce();
            expect(table.selectRow).not.toHaveBeenCalled();
            expect(table.toggleSelectRow).not.toHaveBeenCalled();
            expectNoCrudMutation(crud);
            expectNoRowSideEffects({
                allowSelect: [
                    selectionActionMock.savedRow,
                    selectionActionMock.tempRow
                ]
            });
        } finally {
            harness.restore();
        }
    });

    test('selectRow returns false when the row is missing or cannot be selected', () => {
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

            expect(controller.selectRow('missing-row')).toBe(false);
            expect(crud.findRowByKey).toHaveBeenCalledOnce();
            expect(crud.findRowByKey).toHaveBeenLastCalledWith('missing-row');
            expect(table.selectRow).not.toHaveBeenCalled();
            expect(table.toggleSelectRow).not.toHaveBeenCalled();
            expectNoRowSideEffects();

            expect(controller.selectRow('no-select')).toBe(false);
            expect(crud.findRowByKey).toHaveBeenCalledTimes(2);
            expect(crud.findRowByKey).toHaveBeenLastCalledWith('no-select');
            expect(table.selectRow).not.toHaveBeenCalled();
            expect(table.toggleSelectRow).not.toHaveBeenCalled();
            expect(selectionActionMock.noSelectRow.deselect).not.toHaveBeenCalled();
            expectNoCrudMutation(crud);
            expectNoRowSideEffects();
        } finally {
            harness.restore();
        }
    });

    test('deselectRow deselects one row resolved by backend id or AMB temporary id', () => {
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

            expect(controller.deselectRow(15)).toBe(true);
            expect(crud.findRowByKey).toHaveBeenCalledOnce();
            expect(crud.findRowByKey).toHaveBeenLastCalledWith(15);
            expect(selectionActionMock.savedRow.deselect).toHaveBeenCalledOnce();
            expect(table.deselectRow).not.toHaveBeenCalled();
            expect(table.toggleSelectRow).not.toHaveBeenCalled();
            expectNoRowSideEffects({ allowDeselect: selectionActionMock.savedRow });

            expect(controller.deselectRow('amb-temp-1')).toBe(true);
            expect(crud.findRowByKey).toHaveBeenCalledTimes(2);
            expect(crud.findRowByKey).toHaveBeenLastCalledWith('amb-temp-1');
            expect(selectionActionMock.tempRow.deselect).toHaveBeenCalledOnce();
            expect(table.deselectRow).not.toHaveBeenCalled();
            expect(table.toggleSelectRow).not.toHaveBeenCalled();
            expectNoCrudMutation(crud);
            expectNoRowSideEffects({
                allowDeselect: [
                    selectionActionMock.savedRow,
                    selectionActionMock.tempRow
                ]
            });
        } finally {
            harness.restore();
        }
    });

    test('deselectRow returns false when the row is missing or cannot be deselected', () => {
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

            expect(controller.deselectRow('missing-row')).toBe(false);
            expect(crud.findRowByKey).toHaveBeenCalledOnce();
            expect(crud.findRowByKey).toHaveBeenLastCalledWith('missing-row');
            expect(table.deselectRow).not.toHaveBeenCalled();
            expect(table.toggleSelectRow).not.toHaveBeenCalled();
            expectNoRowSideEffects();

            expect(controller.deselectRow('no-deselect')).toBe(false);
            expect(crud.findRowByKey).toHaveBeenCalledTimes(2);
            expect(crud.findRowByKey).toHaveBeenLastCalledWith('no-deselect');
            expect(table.deselectRow).not.toHaveBeenCalled();
            expect(table.toggleSelectRow).not.toHaveBeenCalled();
            expect(selectionActionMock.noDeselectRow.select).not.toHaveBeenCalled();
            expectNoCrudMutation(crud);
            expectNoRowSideEffects();
        } finally {
            harness.restore();
        }
    });

    test('toggleSelectRow toggles one row resolved by backend id or AMB temporary id', () => {
        const harness = createDocumentHarness();

        try {
            const controller = createTable({
                selector: harness.mount,
                columns: [],
                data: [
                    {
                        id: 15,
                        name: 'Saved',
                        _state: 'clean',
                        _errors: {},
                        _ambTempId: 'amb-saved'
                    },
                    {
                        id: null,
                        name: 'Temp',
                        _state: 'created',
                        _errors: { name: ['Required'] },
                        _ambTempId: 'amb-temp-1'
                    }
                ],
                toolbar: false
            });
            const table = tabulatorMock.instances[0];
            const crud = crudMock.instances[0];
            const rows = table.options.data;
            const originalSavedState = rows[0]._state;
            const originalSavedErrors = rows[0]._errors;
            const originalSavedTempId = rows[0]._ambTempId;
            const originalTempState = rows[1]._state;
            const originalTempErrors = rows[1]._errors;
            const originalTempId = rows[1]._ambTempId;
            const filters = [{ field: 'name', type: 'like', value: 'a' }];
            const sorters = [{ field: 'name', dir: 'asc' }];

            clearCrudSetupCalls(crud);

            table.getSelectedData.mockReturnValueOnce([{ id: 15 }]);
            table.getSelectedRows.mockReturnValueOnce([selectionActionMock.savedRow]);
            table.getFilters.mockReturnValue(filters);
            table.getSorters.mockReturnValue(sorters);
            const searchState = controller.getSearchState();

            expect(controller.toggleSelectRow(15)).toBe(true);
            expect(crud.findRowByKey).toHaveBeenCalledOnce();
            expect(crud.findRowByKey).toHaveBeenLastCalledWith(15);
            expect(selectionActionMock.savedRow.toggleSelect).toHaveBeenCalledOnce();
            expect(table.toggleSelectRow).not.toHaveBeenCalled();
            expect(table.selectRow).not.toHaveBeenCalled();
            expect(table.deselectRow).not.toHaveBeenCalled();
            expectNoRowSideEffects({ allowToggleSelect: selectionActionMock.savedRow });

            expect(controller.getSelectedData()).toEqual([{ id: 15 }]);
            expect(controller.getSelectedRowComponents()).toEqual([selectionActionMock.savedRow]);
            expect(controller.getSearchState()).toEqual(searchState);
            expect(controller.getFilters()).toBe(filters);
            expect(controller.getSorters()).toBe(sorters);
            expect(controller.getPage()).toBe(1);
            expect(controller.getPageMax()).toBe(5);
            expect(controller.getPageSize()).toBe(25);

            expect(controller.toggleSelectRow('amb-temp-1')).toBe(true);
            expect(crud.findRowByKey).toHaveBeenCalledTimes(2);
            expect(crud.findRowByKey).toHaveBeenLastCalledWith('amb-temp-1');
            expect(selectionActionMock.tempRow.toggleSelect).toHaveBeenCalledOnce();
            expect(table.toggleSelectRow).not.toHaveBeenCalled();
            expect(table.selectRow).not.toHaveBeenCalled();
            expect(table.deselectRow).not.toHaveBeenCalled();
            expectNoCrudMutation(crud);
            expectNoRowSideEffects({
                allowToggleSelect: [
                    selectionActionMock.savedRow,
                    selectionActionMock.tempRow
                ]
            });

            expect(rows[0]._state).toBe(originalSavedState);
            expect(rows[0]._errors).toBe(originalSavedErrors);
            expect(rows[0]._ambTempId).toBe(originalSavedTempId);
            expect(rows[1]._state).toBe(originalTempState);
            expect(rows[1]._errors).toBe(originalTempErrors);
            expect(rows[1]._ambTempId).toBe(originalTempId);
            expect(table.getData).not.toHaveBeenCalled();
            expect(table.setPage).not.toHaveBeenCalled();
            expect(table.nextPage).not.toHaveBeenCalled();
            expect(table.previousPage).not.toHaveBeenCalled();
        } finally {
            harness.restore();
        }
    });

    test('toggleSelectRow returns false when the row is missing or cannot be toggled', () => {
        const harness = createDocumentHarness();

        try {
            const controller = createTable({
                selector: harness.mount,
                columns: [],
                data: [
                    {
                        id: 1,
                        name: 'Stable',
                        _state: 'modified',
                        _errors: { name: ['Too short'] },
                        _ambTempId: 'amb-stable'
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

            clearCrudSetupCalls(crud);

            expect(controller.toggleSelectRow('missing-row')).toBe(false);
            expect(crud.findRowByKey).toHaveBeenCalledOnce();
            expect(crud.findRowByKey).toHaveBeenLastCalledWith('missing-row');
            expect(table.toggleSelectRow).not.toHaveBeenCalled();
            expectNoRowSideEffects();

            expect(controller.toggleSelectRow('no-toggle')).toBe(false);
            expect(crud.findRowByKey).toHaveBeenCalledTimes(2);
            expect(crud.findRowByKey).toHaveBeenLastCalledWith('no-toggle');
            expect(selectionActionMock.noToggleRow.select).not.toHaveBeenCalled();
            expect(selectionActionMock.noToggleRow.deselect).not.toHaveBeenCalled();
            expect(table.toggleSelectRow).not.toHaveBeenCalled();
            expectNoCrudMutation(crud);
            expectNoRowSideEffects();

            expect(rowData._state).toBe(originalState);
            expect(rowData._errors).toBe(originalErrors);
            expect(rowData._ambTempId).toBe(originalTempId);
            expect(table.getData).not.toHaveBeenCalled();
            expect(table.setPage).not.toHaveBeenCalled();
            expect(table.nextPage).not.toHaveBeenCalled();
            expect(table.previousPage).not.toHaveBeenCalled();
        } finally {
            harness.restore();
        }
    });
});

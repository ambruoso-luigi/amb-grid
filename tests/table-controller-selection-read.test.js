import { describe, expect, test, vi } from 'vitest';

const tabulatorMock = vi.hoisted(() => ({
    instances: []
}));

const crudMock = vi.hoisted(() => ({
    instances: []
}));

const selectionReadMock = vi.hoisted(() => {
    const firstData = {
        id: 1,
        name: 'Mario',
        _state: 'modified',
        _ambTempId: 'temp-1'
    };
    const secondData = {
        id: 2,
        name: 'Ada',
        _state: 'clean'
    };
    const firstRow = {
        name: 'first-row',
        getData: vi.fn(() => firstData),
        select: vi.fn(),
        deselect: vi.fn(),
        toggleSelect: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        scrollTo: vi.fn()
    };
    const secondRow = {
        name: 'second-row',
        getData: vi.fn(() => secondData),
        select: vi.fn(),
        deselect: vi.fn(),
        toggleSelect: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        scrollTo: vi.fn()
    };

    return {
        firstData,
        secondData,
        selectedData: [firstData, secondData],
        firstRow,
        secondRow,
        selectedRows: [firstRow, secondRow]
    };
});

vi.mock('tabulator-tables', () => ({
    TabulatorFull: class TabulatorMock {
        constructor(selector, options) {
            this.selector = selector;
            this.options = options;
            this.getSelectedData = vi.fn(() => selectionReadMock.selectedData);
            this.getSelectedRows = vi.fn(() => selectionReadMock.selectedRows);
            this.selectRow = vi.fn();
            this.deselectRow = vi.fn();
            this.setPage = vi.fn();
            this.setPageToRow = vi.fn();
            this.setFilter = vi.fn();
            this.clearFilter = vi.fn();
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

    [
        selectionReadMock.firstRow,
        selectionReadMock.secondRow
    ].forEach(row => {
        row.getData.mockClear();
        row.select.mockClear();
        row.deselect.mockClear();
        row.toggleSelect.mockClear();
        row.update.mockClear();
        row.delete.mockClear();
        row.scrollTo.mockClear();
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

const expectNoSelectionSideEffects = (table, crud) => {
    expect(table.selectRow).not.toHaveBeenCalled();
    expect(table.deselectRow).not.toHaveBeenCalled();
    expect(table.setPage).not.toHaveBeenCalled();
    expect(table.setPageToRow).not.toHaveBeenCalled();
    expect(table.setFilter).not.toHaveBeenCalled();
    expect(table.clearFilter).not.toHaveBeenCalled();
    expect(crud.findRowByKey).not.toHaveBeenCalled();
    expect(crud.getSavePayload).not.toHaveBeenCalled();
    expect(crud.getStateReport).not.toHaveBeenCalled();
    expect(crud.validateRow).not.toHaveBeenCalled();
    expect(crud.updateRowFields).not.toHaveBeenCalled();
    expect(crud.deleteRow).not.toHaveBeenCalled();
    expect(crud.rollbackRow).not.toHaveBeenCalled();
    expect(crud.destroy).not.toHaveBeenCalled();

    [
        selectionReadMock.firstRow,
        selectionReadMock.secondRow
    ].forEach(row => {
        expect(row.select).not.toHaveBeenCalled();
        expect(row.deselect).not.toHaveBeenCalled();
        expect(row.toggleSelect).not.toHaveBeenCalled();
        expect(row.update).not.toHaveBeenCalled();
        expect(row.delete).not.toHaveBeenCalled();
        expect(row.scrollTo).not.toHaveBeenCalled();
    });
};

describe('AMB table controller selection read API', () => {
    test('exposes selection read methods and keeps the cumulative controller API available', () => {
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
            expect(controller.selectionMethods).toBeUndefined();
            expect(controller.selection).toBeUndefined();
            expect(controller.controllerMethods).toBeUndefined();

            clearCrudSetupCalls(crud);
            expectNoSelectionSideEffects(table, crud);
        } finally {
            harness.restore();
        }
    });

    test('getSelectedData returns selected row data without cloning or cleanup', () => {
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
            table.getSelectedData.mockReturnValueOnce(selectionReadMock.selectedData);

            const result = controller.getSelectedData();

            expect(table.getSelectedData).toHaveBeenCalledOnce();
            expect(table.getSelectedData).toHaveBeenCalledWith();
            expect(table.getSelectedRows).not.toHaveBeenCalled();
            expect(result).toBe(selectionReadMock.selectedData);
            expect(result[0]).toBe(selectionReadMock.firstData);
            expect(result[0]._state).toBe('modified');
            expect(result[0]._ambTempId).toBe('temp-1');
            expect(result[1]).toBe(selectionReadMock.secondData);
            expectNoSelectionSideEffects(table, crud);
        } finally {
            harness.restore();
        }
    });

    test('getSelectedRowComponents returns selected row components without converting them to data', () => {
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
            table.getSelectedRows.mockReturnValueOnce(selectionReadMock.selectedRows);

            const result = controller.getSelectedRowComponents();

            expect(table.getSelectedRows).toHaveBeenCalledOnce();
            expect(table.getSelectedRows).toHaveBeenCalledWith();
            expect(table.getSelectedData).not.toHaveBeenCalled();
            expect(result).toBe(selectionReadMock.selectedRows);
            expect(result[0]).toBe(selectionReadMock.firstRow);
            expect(result[1]).toBe(selectionReadMock.secondRow);
            expect(selectionReadMock.firstRow.getData).not.toHaveBeenCalled();
            expect(selectionReadMock.secondRow.getData).not.toHaveBeenCalled();
            expectNoSelectionSideEffects(table, crud);
        } finally {
            harness.restore();
        }
    });

    test('getSelectedRows keeps the existing AMB compatibility data semantics', () => {
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
            table.getSelectedData.mockReturnValueOnce(selectionReadMock.selectedData);

            const result = controller.getSelectedRows();

            expect(table.getSelectedData).toHaveBeenCalledOnce();
            expect(table.getSelectedData).toHaveBeenCalledWith();
            expect(table.getSelectedRows).not.toHaveBeenCalled();
            expect(result).toBe(selectionReadMock.selectedData);
            expect(result[0]).toBe(selectionReadMock.firstData);
            expect(result[1]).toBe(selectionReadMock.secondData);
            expect(result).not.toBe(selectionReadMock.selectedRows);
            expectNoSelectionSideEffects(table, crud);
        } finally {
            harness.restore();
        }
    });

    test('getSelectedRows keeps the empty-array fallback when selected data is unavailable', () => {
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
            table.getSelectedData = undefined;

            const result = controller.getSelectedRows();

            expect(result).toEqual([]);
            expect(table.getSelectedRows).not.toHaveBeenCalled();
            expectNoSelectionSideEffects(table, crud);
        } finally {
            harness.restore();
        }
    });
});

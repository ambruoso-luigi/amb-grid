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
            this.getPage = vi.fn(() => 3);
            this.getPageMax = vi.fn(() => 12);
            this.getPageSize = vi.fn(() => 25);
            this.setPage = vi.fn();
            this.nextPage = vi.fn();
            this.previousPage = vi.fn();
            this.setPageSize = vi.fn();
            this.setPageToRow = vi.fn();
            this.setFilter = vi.fn();
            this.clearFilter = vi.fn();
            this.selectRow = vi.fn();
            this.deselectRow = vi.fn();
            this.redraw = vi.fn(() => 'redraw-result');
            this.blockRedraw = vi.fn(() => 'block-result');
            this.restoreRedraw = vi.fn(() => 'restore-result');
            this.getSelectedData = vi.fn(() => []);
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
            this.updateRowFields = vi.fn();
            this.deleteRow = vi.fn();
            this.rollbackRow = vi.fn();
            this.validateRow = vi.fn();
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
    crud.updateRowFields.mockClear();
    crud.deleteRow.mockClear();
    crud.rollbackRow.mockClear();
    crud.validateRow.mockClear();
    crud.destroy.mockClear();
};

const expectNoPaginationSideEffects = (table, crud) => {
    expect(table.setPage).not.toHaveBeenCalled();
    expect(table.nextPage).not.toHaveBeenCalled();
    expect(table.previousPage).not.toHaveBeenCalled();
    expect(table.setPageSize).not.toHaveBeenCalled();
    expect(table.setPageToRow).not.toHaveBeenCalled();
    expect(table.setFilter).not.toHaveBeenCalled();
    expect(table.clearFilter).not.toHaveBeenCalled();
    expect(table.selectRow).not.toHaveBeenCalled();
    expect(table.deselectRow).not.toHaveBeenCalled();
    expect(crud.findRowByKey).not.toHaveBeenCalled();
    expect(crud.updateRowFields).not.toHaveBeenCalled();
    expect(crud.deleteRow).not.toHaveBeenCalled();
    expect(crud.rollbackRow).not.toHaveBeenCalled();
    expect(crud.validateRow).not.toHaveBeenCalled();
    expect(crud.destroy).not.toHaveBeenCalled();
};

describe('AMB table controller pagination read API', () => {
    test('exposes pagination read methods and keeps existing controller API available', () => {
        const harness = createDocumentHarness();

        try {
            const controller = createTable({
                selector: harness.mount,
                columns: [],
                toolbar: false,
                pagination: {
                    enabled: true,
                    pageSize: 10
                }
            });
            const table = tabulatorMock.instances[0];
            const crud = crudMock.instances[0];

            expect(controller.table).toBe(table);
            expect(typeof controller.getPage).toBe('function');
            expect(typeof controller.getPageMax).toBe('function');
            expect(typeof controller.getPageSize).toBe('function');
            expect(typeof controller.getRowPosition).toBe('function');
            expect(typeof controller.getRowFromPosition).toBe('function');
            expect(typeof controller.getRow).toBe('function');
            expect(typeof controller.getRows).toBe('function');
            expect(typeof controller.getData).toBe('function');
            expect(typeof controller.getDataCount).toBe('function');
            expect(typeof controller.redraw).toBe('function');
            expect(typeof controller.blockRedraw).toBe('function');
            expect(typeof controller.restoreRedraw).toBe('function');

            clearCrudSetupCalls(crud);
            expectNoPaginationSideEffects(table, crud);
        } finally {
            harness.restore();
        }
    });

    test('returns the current page number without changing pagination state', () => {
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

            expect(controller.getPage()).toBe(3);
            expect(table.getPage).toHaveBeenCalledOnce();
            expect(table.getPage).toHaveBeenCalledWith();
            expectNoPaginationSideEffects(table, crud);

            table.getPage.mockClear();
            table.getPage.mockReturnValueOnce(false);

            expect(controller.getPage()).toBe(false);
            expect(table.getPage).toHaveBeenCalledOnce();
            expect(table.getPage).toHaveBeenCalledWith();
            expectNoPaginationSideEffects(table, crud);
        } finally {
            harness.restore();
        }
    });

    test('returns the maximum page number without calculating it', () => {
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

            expect(controller.getPageMax()).toBe(12);
            expect(table.getPageMax).toHaveBeenCalledOnce();
            expect(table.getPageMax).toHaveBeenCalledWith();
            expect(table.getDataCount).not.toHaveBeenCalled();
            expect(table.getPageSize).not.toHaveBeenCalled();
            expectNoPaginationSideEffects(table, crud);

            table.getPageMax.mockClear();
            table.getPageMax.mockReturnValueOnce(false);

            expect(controller.getPageMax()).toBe(false);
            expect(table.getPageMax).toHaveBeenCalledOnce();
            expect(table.getPageMax).toHaveBeenCalledWith();
            expect(table.getDataCount).not.toHaveBeenCalled();
            expect(table.getPageSize).not.toHaveBeenCalled();
            expectNoPaginationSideEffects(table, crud);
        } finally {
            harness.restore();
        }
    });

    test('returns the current page size without reading or changing pagination options', () => {
        const harness = createDocumentHarness();

        try {
            const controller = createTable({
                selector: harness.mount,
                columns: [],
                toolbar: false,
                pagination: {
                    enabled: true,
                    pageSize: 10
                }
            });
            const table = tabulatorMock.instances[0];
            const crud = crudMock.instances[0];

            clearCrudSetupCalls(crud);

            expect(controller.getPageSize()).toBe(25);
            expect(table.getPageSize).toHaveBeenCalledOnce();
            expect(table.getPageSize).toHaveBeenCalledWith();
            expect(table.options.paginationSize).toBe(10);
            expectNoPaginationSideEffects(table, crud);
        } finally {
            harness.restore();
        }
    });
});

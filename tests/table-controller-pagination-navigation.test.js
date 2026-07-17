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
            this.getStateReport = vi.fn();
            this.getSavePayload = vi.fn();
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
    crud.getStateReport.mockClear();
    crud.getSavePayload.mockClear();
    crud.validateRow.mockClear();
    crud.updateRowFields.mockClear();
    crud.deleteRow.mockClear();
    crud.rollbackRow.mockClear();
    crud.destroy.mockClear();
};

const expectNoNavigationSideEffects = (table, crud) => {
    expect(table.getPage).not.toHaveBeenCalled();
    expect(table.getPageMax).not.toHaveBeenCalled();
    expect(table.setPageSize).not.toHaveBeenCalled();
    expect(table.setPageToRow).not.toHaveBeenCalled();
    expect(table.setFilter).not.toHaveBeenCalled();
    expect(table.clearFilter).not.toHaveBeenCalled();
    expect(table.selectRow).not.toHaveBeenCalled();
    expect(table.deselectRow).not.toHaveBeenCalled();
    expect(crud.findRowByKey).not.toHaveBeenCalled();
    expect(crud.getStateReport).not.toHaveBeenCalled();
    expect(crud.getSavePayload).not.toHaveBeenCalled();
    expect(crud.validateRow).not.toHaveBeenCalled();
    expect(crud.updateRowFields).not.toHaveBeenCalled();
    expect(crud.deleteRow).not.toHaveBeenCalled();
    expect(crud.rollbackRow).not.toHaveBeenCalled();
    expect(crud.destroy).not.toHaveBeenCalled();
};

describe('AMB table controller pagination navigation API', () => {
    test('exposes pagination navigation methods and keeps existing controller API available', () => {
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
            expect(typeof controller.setPage).toBe('function');
            expect(typeof controller.nextPage).toBe('function');
            expect(typeof controller.previousPage).toBe('function');
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
            expect(controller.paginationMethods).toBeUndefined();
            expect(controller.pagination).toBeUndefined();
            expect(controller.controllerMethods).toBeUndefined();

            clearCrudSetupCalls(crud);
            expectNoNavigationSideEffects(table, crud);
        } finally {
            harness.restore();
        }
    });

    test('setPage forwards page values unchanged and returns the original Promise', async () => {
        const harness = createDocumentHarness();

        try {
            const controller = createTable({
                selector: harness.mount,
                columns: [],
                toolbar: false
            });
            const table = tabulatorMock.instances[0];
            const crud = crudMock.instances[0];
            const pageValues = [4, 'first', 'prev', 'next', 'last'];

            clearCrudSetupCalls(crud);

            pageValues.forEach((page, index) => {
                const promise = Promise.resolve(`page-${index}`);

                table.setPage.mockReturnValueOnce(promise);
                expect(controller.setPage(page)).toBe(promise);
                expect(table.setPage).toHaveBeenCalledTimes(index + 1);
                expect(table.setPage).toHaveBeenLastCalledWith(page);
            });

            expect(table.nextPage).not.toHaveBeenCalled();
            expect(table.previousPage).not.toHaveBeenCalled();
            expectNoNavigationSideEffects(table, crud);

            const error = new Error('set-page-failed');
            const rejected = Promise.reject(error);

            table.setPage.mockReturnValueOnce(rejected);
            const result = controller.setPage('last');

            expect(result).toBe(rejected);
            expect(table.setPage).toHaveBeenCalledTimes(6);
            expect(table.setPage).toHaveBeenLastCalledWith('last');
            await expect(result).rejects.toBe(error);
            expectNoNavigationSideEffects(table, crud);
        } finally {
            harness.restore();
        }
    });

    test('nextPage calls the dedicated table method and returns the original Promise', async () => {
        const harness = createDocumentHarness();

        try {
            const controller = createTable({
                selector: harness.mount,
                columns: [],
                toolbar: false
            });
            const table = tabulatorMock.instances[0];
            const crud = crudMock.instances[0];
            const promise = Promise.resolve('next-page');

            clearCrudSetupCalls(crud);
            table.nextPage.mockReturnValueOnce(promise);

            expect(controller.nextPage()).toBe(promise);
            expect(table.nextPage).toHaveBeenCalledOnce();
            expect(table.nextPage).toHaveBeenCalledWith();
            expect(table.setPage).not.toHaveBeenCalled();
            expectNoNavigationSideEffects(table, crud);

            const error = new Error('next-page-failed');
            const rejected = Promise.reject(error);

            table.nextPage.mockReturnValueOnce(rejected);
            const result = controller.nextPage();

            expect(result).toBe(rejected);
            expect(table.nextPage).toHaveBeenCalledTimes(2);
            await expect(result).rejects.toBe(error);
            expect(table.setPage).not.toHaveBeenCalled();
            expectNoNavigationSideEffects(table, crud);
        } finally {
            harness.restore();
        }
    });

    test('previousPage calls the dedicated table method and returns the original Promise', async () => {
        const harness = createDocumentHarness();

        try {
            const controller = createTable({
                selector: harness.mount,
                columns: [],
                toolbar: false
            });
            const table = tabulatorMock.instances[0];
            const crud = crudMock.instances[0];
            const promise = Promise.resolve('previous-page');

            clearCrudSetupCalls(crud);
            table.previousPage.mockReturnValueOnce(promise);

            expect(controller.previousPage()).toBe(promise);
            expect(table.previousPage).toHaveBeenCalledOnce();
            expect(table.previousPage).toHaveBeenCalledWith();
            expect(table.setPage).not.toHaveBeenCalled();
            expectNoNavigationSideEffects(table, crud);

            const error = new Error('previous-page-failed');
            const rejected = Promise.reject(error);

            table.previousPage.mockReturnValueOnce(rejected);
            const result = controller.previousPage();

            expect(result).toBe(rejected);
            expect(table.previousPage).toHaveBeenCalledTimes(2);
            await expect(result).rejects.toBe(error);
            expect(table.setPage).not.toHaveBeenCalled();
            expectNoNavigationSideEffects(table, crud);
        } finally {
            harness.restore();
        }
    });
});

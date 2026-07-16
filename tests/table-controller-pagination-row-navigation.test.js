import { describe, expect, test, vi } from 'vitest';

const tabulatorMock = vi.hoisted(() => ({
    instances: []
}));

const crudMock = vi.hoisted(() => ({
    instances: []
}));

const rowNavigationMock = vi.hoisted(() => {
    const createRowComponent = name => ({
        name,
        select: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        scrollTo: vi.fn(),
        show: vi.fn(),
        edit: vi.fn()
    });

    return {
        savedRow: createRowComponent('saved-row'),
        tempRow: createRowComponent('temp-row'),
        fallbackRow: createRowComponent('fallback-row')
    };
});

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
            this.selectRow = vi.fn();
            this.deselectRow = vi.fn();
            this.scrollToRow = vi.fn();
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
            this.findRowByKey = vi.fn(identifier => {
                if (identifier === 15) return rowNavigationMock.savedRow;
                if (identifier === 'amb-temp-1') return rowNavigationMock.tempRow;

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
        rowNavigationMock.savedRow,
        rowNavigationMock.tempRow,
        rowNavigationMock.fallbackRow
    ].forEach(row => {
        row.select.mockClear();
        row.update.mockClear();
        row.delete.mockClear();
        row.scrollTo.mockClear();
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

const expectNoRowNavigationSideEffects = (table, crud) => {
    expect(table.setPage).not.toHaveBeenCalled();
    expect(table.nextPage).not.toHaveBeenCalled();
    expect(table.previousPage).not.toHaveBeenCalled();
    expect(table.setPageSize).not.toHaveBeenCalled();
    expect(table.getPage).not.toHaveBeenCalled();
    expect(table.getPageMax).not.toHaveBeenCalled();
    expect(table.selectRow).not.toHaveBeenCalled();
    expect(table.deselectRow).not.toHaveBeenCalled();
    expect(table.scrollToRow).not.toHaveBeenCalled();
    expect(table.getRows).not.toHaveBeenCalled();
    expect(table.getRow).not.toHaveBeenCalled();
    expect(table.getRowPosition).not.toHaveBeenCalled();
    expect(crud.getSavePayload).not.toHaveBeenCalled();
    expect(crud.getStateReport).not.toHaveBeenCalled();
    expect(crud.validateRow).not.toHaveBeenCalled();
    expect(crud.updateRowFields).not.toHaveBeenCalled();
    expect(crud.deleteRow).not.toHaveBeenCalled();
    expect(crud.rollbackRow).not.toHaveBeenCalled();
    expect(crud.destroy).not.toHaveBeenCalled();

    [
        rowNavigationMock.savedRow,
        rowNavigationMock.tempRow,
        rowNavigationMock.fallbackRow
    ].forEach(row => {
        expect(row.select).not.toHaveBeenCalled();
        expect(row.update).not.toHaveBeenCalled();
        expect(row.delete).not.toHaveBeenCalled();
        expect(row.scrollTo).not.toHaveBeenCalled();
        expect(row.show).not.toHaveBeenCalled();
        expect(row.edit).not.toHaveBeenCalled();
    });
};

describe('AMB table controller pagination row navigation API', () => {
    test('exposes setPageToRow and keeps pagination controller API available', () => {
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

            clearCrudSetupCalls(crud);
            expectNoRowNavigationSideEffects(table, crud);
        } finally {
            harness.restore();
        }
    });

    test('resolves AMB identifiers before calling setPageToRow', () => {
        const harness = createDocumentHarness();

        try {
            const controller = createTable({
                selector: harness.mount,
                columns: [],
                toolbar: false
            });
            const table = tabulatorMock.instances[0];
            const crud = crudMock.instances[0];
            const savedPromise = Promise.resolve('saved-page');
            const tempPromise = Promise.resolve('temp-page');

            clearCrudSetupCalls(crud);

            table.setPageToRow.mockReturnValueOnce(savedPromise);
            expect(controller.setPageToRow(15)).toBe(savedPromise);
            expect(crud.findRowByKey).toHaveBeenCalledOnce();
            expect(crud.findRowByKey).toHaveBeenLastCalledWith(15);
            expect(table.setPageToRow).toHaveBeenCalledOnce();
            expect(table.setPageToRow).toHaveBeenLastCalledWith(rowNavigationMock.savedRow);
            expect(table.setPageToRow).not.toHaveBeenCalledWith(15);

            table.setPageToRow.mockReturnValueOnce(tempPromise);
            expect(controller.setPageToRow('amb-temp-1')).toBe(tempPromise);
            expect(crud.findRowByKey).toHaveBeenCalledTimes(2);
            expect(crud.findRowByKey).toHaveBeenLastCalledWith('amb-temp-1');
            expect(table.setPageToRow).toHaveBeenCalledTimes(2);
            expect(table.setPageToRow).toHaveBeenLastCalledWith(rowNavigationMock.tempRow);
            expect(table.setPageToRow).not.toHaveBeenCalledWith('amb-temp-1');
            expectNoRowNavigationSideEffects(table, crud);
        } finally {
            harness.restore();
        }
    });

    test('preserves fallback lookup values without manual row searches', () => {
        const harness = createDocumentHarness();

        try {
            const controller = createTable({
                selector: harness.mount,
                columns: [],
                toolbar: false
            });
            const table = tabulatorMock.instances[0];
            const crud = crudMock.instances[0];
            const lookupObject = { lookup: 'row-element' };
            const fallbacks = [
                22,
                'external-row',
                rowNavigationMock.fallbackRow,
                lookupObject
            ];

            clearCrudSetupCalls(crud);

            fallbacks.forEach((lookup, index) => {
                const promise = Promise.resolve(`fallback-${index}`);

                table.setPageToRow.mockReturnValueOnce(promise);
                expect(controller.setPageToRow(lookup)).toBe(promise);
                expect(crud.findRowByKey).toHaveBeenCalledTimes(index + 1);
                expect(crud.findRowByKey).toHaveBeenLastCalledWith(lookup);
                expect(table.setPageToRow).toHaveBeenCalledTimes(index + 1);
                expect(table.setPageToRow).toHaveBeenLastCalledWith(lookup);
            });

            expectNoRowNavigationSideEffects(table, crud);
        } finally {
            harness.restore();
        }
    });

    test('returns the original Promise and preserves resolution or rejection', async () => {
        const harness = createDocumentHarness();

        try {
            const controller = createTable({
                selector: harness.mount,
                columns: [],
                toolbar: false
            });
            const table = tabulatorMock.instances[0];
            const crud = crudMock.instances[0];
            const resolvedValue = { displayed: true };
            const resolved = Promise.resolve(resolvedValue);

            clearCrudSetupCalls(crud);

            table.setPageToRow.mockReturnValueOnce(resolved);
            const resolvedResult = controller.setPageToRow(15);

            expect(resolvedResult).toBe(resolved);
            await expect(resolvedResult).resolves.toBe(resolvedValue);

            const error = new Error('row-page-not-found');
            const rejected = Promise.reject(error);

            table.setPageToRow.mockReturnValueOnce(rejected);
            const rejectedResult = controller.setPageToRow('missing-row');

            expect(rejectedResult).toBe(rejected);
            expect(rejectedResult).not.toBe(false);
            await expect(rejectedResult).rejects.toBe(error);
            expectNoRowNavigationSideEffects(table, crud);
        } finally {
            harness.restore();
        }
    });
});

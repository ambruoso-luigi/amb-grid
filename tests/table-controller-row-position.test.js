import { describe, expect, test, vi } from 'vitest';

const tabulatorMock = vi.hoisted(() => ({
    instances: []
}));

const crudMock = vi.hoisted(() => ({
    instances: []
}));

const rowPositionMock = vi.hoisted(() => {
    const createRowComponent = name => ({
        name,
        getData: vi.fn(() => ({ name })),
        select: vi.fn(),
        deselect: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        scrollTo: vi.fn(),
        pageTo: vi.fn(),
        show: vi.fn()
    });
    const savedRow = createRowComponent('saved-row');
    const tempRow = createRowComponent('temp-row');
    const fallbackRow = createRowComponent('fallback-row');

    return {
        savedRow,
        tempRow,
        fallbackRow
    };
});

vi.mock('tabulator-tables', () => ({
    TabulatorFull: class TabulatorMock {
        constructor(selector, options) {
            this.selector = selector;
            this.options = options;
            this.getData = vi.fn(() => []);
            this.getDataCount = vi.fn(() => 0);
            this.getRows = vi.fn(() => [
                rowPositionMock.savedRow,
                rowPositionMock.tempRow,
                rowPositionMock.fallbackRow
            ]);
            this.getRow = vi.fn(() => false);
            this.getRowPosition = vi.fn(lookup => {
                if (lookup === rowPositionMock.savedRow) return 3;
                if (lookup === rowPositionMock.tempRow) return 4;
                if (lookup === 'fallback-lookup') return 7;
                if (lookup === rowPositionMock.fallbackRow) return 8;

                return false;
            });
            this.getRowFromPosition = vi.fn(position => {
                if (position === 1) return rowPositionMock.savedRow;
                if (position === 5) return rowPositionMock.fallbackRow;

                return false;
            });
            this.redraw = vi.fn(() => 'redraw-result');
            this.blockRedraw = vi.fn(() => 'block-result');
            this.restoreRedraw = vi.fn(() => 'restore-result');
            this.getSelectedData = vi.fn(() => []);
            this.deselectRow = vi.fn();
            this.setFilter = vi.fn();
            this.clearFilter = vi.fn();
            this.setPage = vi.fn();
            this.scrollToRow = vi.fn();
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
                if (identifier === 15) return rowPositionMock.savedRow;
                if (identifier === 'amb-temp-1') return rowPositionMock.tempRow;

                return null;
            });
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

    [
        rowPositionMock.savedRow,
        rowPositionMock.tempRow,
        rowPositionMock.fallbackRow
    ].forEach(row => {
        row.getData.mockClear();
        row.select.mockClear();
        row.deselect.mockClear();
        row.update.mockClear();
        row.delete.mockClear();
        row.scrollTo.mockClear();
        row.pageTo.mockClear();
        row.show.mockClear();
    });

    return {
        mount,
        restore() {
            globalThis.document = originalDocument;
        }
    };
};

const clearCrudReadSetupCalls = crud => {
    crud.on.mockClear();
    crud.addCellValidator.mockClear();
    crud.findRowByKey.mockClear();
    crud.updateRowFields.mockClear();
    crud.deleteRow.mockClear();
    crud.rollbackRow.mockClear();
    crud.validateRow.mockClear();
    crud.destroy.mockClear();
};

const expectNoSideEffects = (table, crud) => {
    expect(table.getRows).not.toHaveBeenCalled();
    expect(table.deselectRow).not.toHaveBeenCalled();
    expect(table.setFilter).not.toHaveBeenCalled();
    expect(table.clearFilter).not.toHaveBeenCalled();
    expect(table.setPage).not.toHaveBeenCalled();
    expect(table.scrollToRow).not.toHaveBeenCalled();
    expect(crud.updateRowFields).not.toHaveBeenCalled();
    expect(crud.deleteRow).not.toHaveBeenCalled();
    expect(crud.rollbackRow).not.toHaveBeenCalled();
    expect(crud.validateRow).not.toHaveBeenCalled();
    expect(crud.destroy).not.toHaveBeenCalled();

    [
        rowPositionMock.savedRow,
        rowPositionMock.tempRow,
        rowPositionMock.fallbackRow
    ].forEach(row => {
        expect(row.getData).not.toHaveBeenCalled();
        expect(row.select).not.toHaveBeenCalled();
        expect(row.deselect).not.toHaveBeenCalled();
        expect(row.update).not.toHaveBeenCalled();
        expect(row.delete).not.toHaveBeenCalled();
        expect(row.scrollTo).not.toHaveBeenCalled();
        expect(row.pageTo).not.toHaveBeenCalled();
        expect(row.show).not.toHaveBeenCalled();
    });
};

describe('AMB table controller row position API', () => {
    test('resolves getRowPosition through AMB identifiers and preserves fallback lookups', () => {
        const harness = createDocumentHarness();

        try {
            const controller = createTable({
                selector: harness.mount,
                columns: [],
                toolbar: false
            });
            const table = tabulatorMock.instances[0];
            const crud = crudMock.instances[0];
            const missingLookup = { lookup: 'missing-row' };

            expect(controller.table).toBe(table);
            expect(typeof controller.getRowPosition).toBe('function');
            expect(typeof controller.getRowFromPosition).toBe('function');
            expect(typeof controller.getRow).toBe('function');
            expect(typeof controller.getRows).toBe('function');
            expect(typeof controller.getData).toBe('function');
            expect(typeof controller.getDataCount).toBe('function');
            expect(typeof controller.redraw).toBe('function');
            expect(typeof controller.blockRedraw).toBe('function');
            expect(typeof controller.restoreRedraw).toBe('function');
            expect(controller.rowMethods).toBeUndefined();
            expect(controller.rows).toBeUndefined();
            expect(controller.controllerMethods).toBeUndefined();

            clearCrudReadSetupCalls(crud);

            expect(controller.getRowPosition(15, 'visible')).toBe(3);
            expect(crud.findRowByKey).toHaveBeenCalledOnce();
            expect(crud.findRowByKey).toHaveBeenLastCalledWith(15);
            expect(table.getRowPosition).toHaveBeenCalledOnce();
            expect(table.getRowPosition).toHaveBeenLastCalledWith(rowPositionMock.savedRow, 'visible');

            expect(controller.getRowPosition('amb-temp-1', 'active', true)).toBe(4);
            expect(crud.findRowByKey).toHaveBeenCalledTimes(2);
            expect(crud.findRowByKey).toHaveBeenLastCalledWith('amb-temp-1');
            expect(table.getRowPosition).toHaveBeenCalledTimes(2);
            expect(table.getRowPosition).toHaveBeenLastCalledWith(rowPositionMock.tempRow, 'active', true);

            expect(controller.getRowPosition('fallback-lookup', 'all')).toBe(7);
            expect(crud.findRowByKey).toHaveBeenCalledTimes(3);
            expect(crud.findRowByKey).toHaveBeenLastCalledWith('fallback-lookup');
            expect(table.getRowPosition).toHaveBeenCalledTimes(3);
            expect(table.getRowPosition).toHaveBeenLastCalledWith('fallback-lookup', 'all');

            expect(controller.getRowPosition(rowPositionMock.fallbackRow, 'visible')).toBe(8);
            expect(crud.findRowByKey).toHaveBeenCalledTimes(4);
            expect(crud.findRowByKey).toHaveBeenLastCalledWith(rowPositionMock.fallbackRow);
            expect(table.getRowPosition).toHaveBeenCalledTimes(4);
            expect(table.getRowPosition).toHaveBeenLastCalledWith(rowPositionMock.fallbackRow, 'visible');

            expect(controller.getRowPosition(missingLookup)).toBe(false);
            expect(crud.findRowByKey).toHaveBeenCalledTimes(5);
            expect(crud.findRowByKey).toHaveBeenLastCalledWith(missingLookup);
            expect(table.getRowPosition).toHaveBeenCalledTimes(5);
            expect(table.getRowPosition).toHaveBeenLastCalledWith(missingLookup);
            expectNoSideEffects(table, crud);
        } finally {
            harness.restore();
        }
    });

    test('exposes getRowFromPosition as a read-only position wrapper', () => {
        const harness = createDocumentHarness();

        try {
            const controller = createTable({
                selector: harness.mount,
                columns: [],
                toolbar: false
            });
            const table = tabulatorMock.instances[0];
            const crud = crudMock.instances[0];

            clearCrudReadSetupCalls(crud);

            expect(controller.getRowFromPosition(1)).toBe(rowPositionMock.savedRow);
            expect(table.getRowFromPosition).toHaveBeenCalledOnce();
            expect(table.getRowFromPosition).toHaveBeenLastCalledWith(1);

            expect(controller.getRowFromPosition(5, 'visible')).toBe(rowPositionMock.fallbackRow);
            expect(table.getRowFromPosition).toHaveBeenCalledTimes(2);
            expect(table.getRowFromPosition).toHaveBeenLastCalledWith(5, 'visible');

            expect(controller.getRowFromPosition(99, 'active')).toBe(false);
            expect(table.getRowFromPosition).toHaveBeenCalledTimes(3);
            expect(table.getRowFromPosition).toHaveBeenLastCalledWith(99, 'active');
            expect(crud.findRowByKey).not.toHaveBeenCalled();
            expectNoSideEffects(table, crud);
        } finally {
            harness.restore();
        }
    });
});

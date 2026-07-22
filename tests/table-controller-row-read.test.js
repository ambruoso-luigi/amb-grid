import { describe, expect, test, vi } from 'vitest';

const tabulatorMock = vi.hoisted(() => ({
    instances: []
}));

const crudMock = vi.hoisted(() => ({
    instances: []
}));

const rowReadMock = vi.hoisted(() => {
    const createRowComponent = (name, data) => ({
        name,
        data,
        getData: vi.fn(() => data),
        getIndex: vi.fn(() => data.id || data._ambTempId || false),
        getNextRow: vi.fn(() => false),
        getPrevRow: vi.fn(() => false),
        select: vi.fn(),
        deselect: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        scrollTo: vi.fn(),
        pageTo: vi.fn(),
        show: vi.fn()
    });
    const savedData = { id: 15, name: 'Saved', _state: 'clean', _ambTempId: 'amb-saved' };
    const tempData = { id: null, name: 'Temporary', _state: 'created', _ambTempId: 'amb-temp-1' };
    const fallbackData = { id: 30, name: 'Fallback', _state: 'modified', _ambTempId: 'amb-fallback' };
    const savedRow = createRowComponent('saved-row', savedData);
    const tempRow = createRowComponent('temp-row', tempData);
    const fallbackRow = createRowComponent('fallback-row', fallbackData);

    savedRow.getNextRow.mockImplementation(() => tempRow);
    tempRow.getPrevRow.mockImplementation(() => savedRow);
    fallbackRow.getPrevRow.mockImplementation(() => tempRow);

    return {
        savedData,
        tempData,
        fallbackData,
        savedRow,
        tempRow,
        fallbackRow,
        allRows: [savedRow, tempRow],
        activeRows: [savedRow],
        visibleRows: [tempRow]
    };
});

vi.mock('tabulator-tables', () => ({
    TabulatorFull: class TabulatorMock {
        constructor(selector, options) {
            this.selector = selector;
            this.options = options;
            this.getData = vi.fn(() => []);
            this.getDataCount = vi.fn(() => 0);
            this.getRows = vi.fn(range => {
                if (range === 'active') return rowReadMock.activeRows;
                if (range === 'visible') return rowReadMock.visibleRows;

                return rowReadMock.allRows;
            });
            this.getRow = vi.fn(lookup => {
                if (lookup === 'fallback-lookup' || lookup === rowReadMock.fallbackRow) {
                    return rowReadMock.fallbackRow;
                }

                return false;
            });
            this.redraw = vi.fn(() => 'redraw-result');
            this.blockRedraw = vi.fn(() => 'block-result');
            this.restoreRedraw = vi.fn(() => 'restore-result');
            this.getSelectedData = vi.fn(() => []);
            this.deselectRow = vi.fn();
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
                if (identifier === 15) return rowReadMock.savedRow;
                if (identifier === 'amb-temp-1') return rowReadMock.tempRow;

                return null;
            });
            this.getStateReport = vi.fn(() => ({
                rows: [
                    rowReadMock.savedData,
                    rowReadMock.tempData,
                    rowReadMock.fallbackData
                ].map(row => ({
                    id: row.id,
                    tempId: row._ambTempId,
                    state: row._state
                }))
            }));
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
        rowReadMock.savedRow,
        rowReadMock.tempRow,
        rowReadMock.fallbackRow
    ].forEach(row => {
        row.getData.mockClear();
        row.getIndex.mockClear();
        row.getNextRow.mockClear();
        row.getPrevRow.mockClear();
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

const expectRowsNotMutated = () => {
    [
        rowReadMock.savedRow,
        rowReadMock.tempRow,
        rowReadMock.fallbackRow
    ].forEach(row => {
        expect(row.select).not.toHaveBeenCalled();
        expect(row.deselect).not.toHaveBeenCalled();
        expect(row.update).not.toHaveBeenCalled();
        expect(row.delete).not.toHaveBeenCalled();
        expect(row.scrollTo).not.toHaveBeenCalled();
        expect(row.pageTo).not.toHaveBeenCalled();
        expect(row.show).not.toHaveBeenCalled();
    });
};

describe('AMB table controller row read API', () => {
    test('exposes getRows as a read-only row component wrapper', () => {
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
            expect(typeof controller.getRows).toBe('function');
            expect(typeof controller.getRow).toBe('function');
            expect(typeof controller.getRowPosition).toBe('function');
            expect(typeof controller.getRowFromPosition).toBe('function');
            expect(typeof controller.getData).toBe('function');
            expect(typeof controller.getDataCount).toBe('function');
            expect(typeof controller.redraw).toBe('function');
            expect(typeof controller.blockRedraw).toBe('function');
            expect(typeof controller.restoreRedraw).toBe('function');
            expect(controller.rowMethods).toBeUndefined();
            expect(controller.rows).toBeUndefined();
            expect(controller.controllerMethods).toBeUndefined();

            crud.on.mockClear();
            crud.addCellValidator.mockClear();
            crud.findRowByKey.mockClear();
            crud.getStateReport.mockClear();
            crud.updateRowFields.mockClear();
            crud.deleteRow.mockClear();
            crud.rollbackRow.mockClear();
            crud.validateRow.mockClear();
            crud.destroy.mockClear();

            const allRows = controller.getRows();

            expect(table.getRows).toHaveBeenCalledOnce();
            expect(table.getRows).toHaveBeenCalledWith();
            expect(allRows).toBe(rowReadMock.allRows);
            expect(allRows[0]).toBe(rowReadMock.savedRow);
            expect(allRows[1]).toBe(rowReadMock.tempRow);

            expect(controller.getRows('active')).toBe(rowReadMock.activeRows);
            expect(table.getRows).toHaveBeenCalledTimes(2);
            expect(table.getRows).toHaveBeenLastCalledWith('active');

            expect(controller.getRows('visible')).toBe(rowReadMock.visibleRows);
            expect(table.getRows).toHaveBeenCalledTimes(3);
            expect(table.getRows).toHaveBeenLastCalledWith('visible');

            expect(crud.findRowByKey).not.toHaveBeenCalled();
            expect(crud.updateRowFields).not.toHaveBeenCalled();
            expect(crud.deleteRow).not.toHaveBeenCalled();
            expect(crud.rollbackRow).not.toHaveBeenCalled();
            expect(crud.validateRow).not.toHaveBeenCalled();
            expect(crud.destroy).not.toHaveBeenCalled();
            expectRowsNotMutated();
        } finally {
            harness.restore();
        }
    });

    test('resolves getRow through AMB identifiers before using fallback lookup', () => {
        const harness = createDocumentHarness();

        try {
            const controller = createTable({
                selector: harness.mount,
                columns: [],
                toolbar: false
            });
            const table = tabulatorMock.instances[0];
            const crud = crudMock.instances[0];
            const unsupportedLookup = { type: 'dom-or-row-lookup' };

            crud.on.mockClear();
            crud.addCellValidator.mockClear();
            crud.findRowByKey.mockClear();
            crud.updateRowFields.mockClear();
            crud.deleteRow.mockClear();
            crud.rollbackRow.mockClear();
            crud.validateRow.mockClear();
            crud.destroy.mockClear();

            expect(controller.getRow(15)).toBe(rowReadMock.savedRow);
            expect(crud.findRowByKey).toHaveBeenCalledOnce();
            expect(crud.findRowByKey).toHaveBeenLastCalledWith(15);
            expect(table.getRow).not.toHaveBeenCalled();

            expect(controller.getRow('amb-temp-1')).toBe(rowReadMock.tempRow);
            expect(crud.findRowByKey).toHaveBeenCalledTimes(2);
            expect(crud.findRowByKey).toHaveBeenLastCalledWith('amb-temp-1');
            expect(table.getRow).not.toHaveBeenCalled();

            expect(controller.getRow('fallback-lookup')).toBe(rowReadMock.fallbackRow);
            expect(crud.findRowByKey).toHaveBeenCalledTimes(3);
            expect(crud.findRowByKey).toHaveBeenLastCalledWith('fallback-lookup');
            expect(table.getRow).toHaveBeenCalledOnce();
            expect(table.getRow).toHaveBeenLastCalledWith('fallback-lookup');

            expect(controller.getRow(rowReadMock.fallbackRow)).toBe(rowReadMock.fallbackRow);
            expect(crud.findRowByKey).toHaveBeenCalledTimes(4);
            expect(crud.findRowByKey).toHaveBeenLastCalledWith(rowReadMock.fallbackRow);
            expect(table.getRow).toHaveBeenCalledTimes(2);
            expect(table.getRow).toHaveBeenLastCalledWith(rowReadMock.fallbackRow);

            expect(controller.getRow(unsupportedLookup)).toBe(false);
            expect(crud.findRowByKey).toHaveBeenCalledTimes(5);
            expect(crud.findRowByKey).toHaveBeenLastCalledWith(unsupportedLookup);
            expect(table.getRow).toHaveBeenCalledTimes(3);
            expect(table.getRow).toHaveBeenLastCalledWith(unsupportedLookup);

            expect(crud.updateRowFields).not.toHaveBeenCalled();
            expect(crud.deleteRow).not.toHaveBeenCalled();
            expect(crud.rollbackRow).not.toHaveBeenCalled();
            expect(crud.validateRow).not.toHaveBeenCalled();
            expect(crud.destroy).not.toHaveBeenCalled();
            expectRowsNotMutated();
        } finally {
            harness.restore();
        }
    });

    test('exposes contextual row reads directly without mutating data or CRUD state', () => {
        const harness = createDocumentHarness();

        try {
            const originalData = structuredClone([
                rowReadMock.savedData,
                rowReadMock.tempData,
                rowReadMock.fallbackData
            ]);
            const controller = createTable({
                selector: harness.mount,
                columns: [],
                data: [
                    rowReadMock.savedData,
                    rowReadMock.tempData,
                    rowReadMock.fallbackData
                ],
                toolbar: false
            });
            const table = tabulatorMock.instances[0];
            const crud = crudMock.instances[0];
            const stateBefore = crud.getStateReport();

            crud.on.mockClear();
            crud.addCellValidator.mockClear();
            crud.findRowByKey.mockClear();
            crud.getStateReport.mockClear();
            crud.updateRowFields.mockClear();
            crud.deleteRow.mockClear();
            crud.rollbackRow.mockClear();
            crud.validateRow.mockClear();
            crud.destroy.mockClear();

            expect(typeof controller.getRowData).toBe('function');
            expect(typeof controller.getRowIndex).toBe('function');
            expect(typeof controller.getNextRow).toBe('function');
            expect(typeof controller.getPrevRow).toBe('function');
            expect(controller.rows).toBeUndefined();
            expect(controller.rowReads).toBeUndefined();
            expect(controller.rowContext).toBeUndefined();
            expect(controller.getRowElement).toBeUndefined();
            expect(controller.watchRowPosition).toBeUndefined();

            expect(controller.getRowData(15)).toBe(rowReadMock.savedData);
            expect(crud.findRowByKey).toHaveBeenLastCalledWith(15);
            expect(table.getRow).not.toHaveBeenCalled();

            expect(controller.getRowIndex('amb-temp-1')).toBe('amb-temp-1');
            expect(controller.getNextRow(15)).toBe(rowReadMock.tempRow);
            expect(controller.getPrevRow('amb-temp-1')).toBe(rowReadMock.savedRow);
            expect(controller.getPrevRow('fallback-lookup')).toBe(rowReadMock.tempRow);
            expect(table.getRow).toHaveBeenLastCalledWith('fallback-lookup');
            expect(controller.getNextRow('missing-row')).toBe(false);

            expect([
                rowReadMock.savedData,
                rowReadMock.tempData,
                rowReadMock.fallbackData
            ]).toEqual(originalData);
            expect(crud.getStateReport()).toEqual(stateBefore);
            expect(crud.updateRowFields).not.toHaveBeenCalled();
            expect(crud.deleteRow).not.toHaveBeenCalled();
            expect(crud.rollbackRow).not.toHaveBeenCalled();
            expect(crud.validateRow).not.toHaveBeenCalled();
            expect(crud.destroy).not.toHaveBeenCalled();
            expectRowsNotMutated();
        } finally {
            harness.restore();
        }
    });
});

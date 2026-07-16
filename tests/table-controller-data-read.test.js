import { describe, expect, test, vi } from 'vitest';

const tabulatorMock = vi.hoisted(() => ({
    instances: []
}));

const crudMock = vi.hoisted(() => ({
    instances: []
}));

const rows = vi.hoisted(() => [
    { id: 1, name: 'Ada', _state: 'clean' },
    { id: 2, name: 'Grace', _ambTempId: 'amb-temp-1' }
]);

const activeRows = vi.hoisted(() => [
    rows[1]
]);

vi.mock('tabulator-tables', () => ({
    TabulatorFull: class TabulatorMock {
        constructor(selector, options) {
            this.selector = selector;
            this.options = options;
            this.getData = vi.fn(range => (range === 'active' ? activeRows : rows));
            this.getDataCount = vi.fn(range => (range === 'active' ? 1 : 2));
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
            this.findRowByKey = vi.fn();
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

describe('AMB table controller data read API', () => {
    test('exposes getData and getDataCount as read-only controller wrappers', () => {
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
            expect(typeof controller.getData).toBe('function');
            expect(typeof controller.getDataCount).toBe('function');
            expect(typeof controller.redraw).toBe('function');
            expect(typeof controller.blockRedraw).toBe('function');
            expect(typeof controller.restoreRedraw).toBe('function');

            crud.on.mockClear();
            crud.addCellValidator.mockClear();
            crud.findRowByKey.mockClear();
            crud.destroy.mockClear();

            const allData = controller.getData();

            expect(table.getData).toHaveBeenCalledOnce();
            expect(table.getData).toHaveBeenCalledWith();
            expect(allData).toBe(rows);
            expect(allData[0]).toBe(rows[0]);
            expect(allData[1]).toBe(rows[1]);

            const currentRows = controller.getData('active');

            expect(table.getData).toHaveBeenCalledTimes(2);
            expect(table.getData).toHaveBeenLastCalledWith('active');
            expect(currentRows).toBe(activeRows);
            expect(currentRows[0]).toBe(rows[1]);

            expect(controller.getDataCount()).toBe(2);
            expect(table.getDataCount).toHaveBeenCalledOnce();
            expect(table.getDataCount).toHaveBeenCalledWith();

            expect(controller.getDataCount('active')).toBe(1);
            expect(table.getDataCount).toHaveBeenCalledTimes(2);
            expect(table.getDataCount).toHaveBeenLastCalledWith('active');

            expect(controller.redraw(true)).toBe('redraw-result');
            expect(table.redraw).toHaveBeenCalledOnce();
            expect(table.redraw).toHaveBeenCalledWith(true);
            expect(controller.blockRedraw()).toBe('block-result');
            expect(controller.restoreRedraw()).toBe('restore-result');

            expect(crud.on).not.toHaveBeenCalled();
            expect(crud.addCellValidator).not.toHaveBeenCalled();
            expect(crud.findRowByKey).not.toHaveBeenCalled();
            expect(crud.destroy).not.toHaveBeenCalled();
        } finally {
            harness.restore();
        }
    });
});

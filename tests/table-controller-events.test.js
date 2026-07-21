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
            this.listeners = new Map();
            this.engineWideOffCalls = [];
            this.technicalDataLoaded = vi.fn();
            this.on('dataLoaded', this.technicalDataLoaded);
            this.on.mockClear();
            this.getData = vi.fn(() => []);
            this.getRows = vi.fn(() => []);
            this.getFilters = vi.fn(() => []);
            this.getSorters = vi.fn(() => []);
            this.getSelectedData = vi.fn(() => []);
            this.getSelectedRows = vi.fn(() => []);
            this.setData = vi.fn();
            this.setFilter = vi.fn();
            this.clearFilter = vi.fn();
            this.setSort = vi.fn();
            this.clearSort = vi.fn();
            this.selectRow = vi.fn();
            this.deselectRow = vi.fn();
            this.destroy = vi.fn(() => {
                this.emit('tableDestroyed', { reason: 'destroy' });
            });
            tabulatorMock.instances.push(this);
        }

        on = vi.fn((eventName, callback) => {
            const eventListeners = this.listeners.get(eventName) || [];

            eventListeners.push(callback);
            this.listeners.set(eventName, eventListeners);
        });

        off = vi.fn((eventName, callback) => {
            if (callback === undefined) {
                this.engineWideOffCalls.push(eventName);
                this.listeners.delete(eventName);
                return;
            }

            const eventListeners = this.listeners.get(eventName);

            if (!eventListeners) return;

            const index = eventListeners.indexOf(callback);

            if (index === -1) return;

            eventListeners.splice(index, 1);

            if (eventListeners.length === 0) {
                this.listeners.delete(eventName);
            }
        });

        emit(eventName, ...args) {
            (this.listeners.get(eventName) || []).slice().forEach(listener => {
                listener(...args);
            });
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
        this.listeners = {};
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
        body: parent,
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

const clearSetupCalls = (table, crud) => {
    table.on.mockClear();
    table.off.mockClear();
    table.getData.mockClear();
    table.getRows.mockClear();
    table.getFilters.mockClear();
    table.getSorters.mockClear();
    table.getSelectedData.mockClear();
    table.getSelectedRows.mockClear();
    table.setData.mockClear();
    table.setFilter.mockClear();
    table.clearFilter.mockClear();
    table.setSort.mockClear();
    table.clearSort.mockClear();
    table.selectRow.mockClear();
    table.deselectRow.mockClear();
    table.destroy.mockClear();
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

const expectNoGridSideEffects = (table, crud) => {
    expect(table.getData).not.toHaveBeenCalled();
    expect(table.getRows).not.toHaveBeenCalled();
    expect(table.setData).not.toHaveBeenCalled();
    expect(table.setFilter).not.toHaveBeenCalled();
    expect(table.clearFilter).not.toHaveBeenCalled();
    expect(table.setSort).not.toHaveBeenCalled();
    expect(table.clearSort).not.toHaveBeenCalled();
    expect(table.selectRow).not.toHaveBeenCalled();
    expect(table.deselectRow).not.toHaveBeenCalled();
    expect(crud.findRowByKey).not.toHaveBeenCalled();
    expect(crud.getSavePayload).not.toHaveBeenCalled();
    expect(crud.getStateReport).not.toHaveBeenCalled();
    expect(crud.validateRow).not.toHaveBeenCalled();
    expect(crud.validateAll).not.toHaveBeenCalled();
    expect(crud.updateRowFields).not.toHaveBeenCalled();
    expect(crud.addRow).not.toHaveBeenCalled();
    expect(crud.deleteRow).not.toHaveBeenCalled();
    expect(crud.rollbackRow).not.toHaveBeenCalled();
};

describe('AMB table controller event API', () => {
    test('tracks application events without removing internal or advanced listeners', () => {
        const harness = createDocumentHarness();

        try {
            const controller = createTable({
                selector: harness.mount,
                columns: [],
                toolbar: false
            });
            const table = tabulatorMock.instances[0];
            const crud = crudMock.instances[0];
            const firstCallback = vi.fn();
            const secondCallback = vi.fn();
            const otherEventCallback = vi.fn();
            const advancedCallback = vi.fn();
            const destroyCallback = vi.fn();

            expect(controller.table).toBe(table);
            expect(typeof controller.on).toBe('function');
            expect(typeof controller.off).toBe('function');
            expect(controller.events).toBeUndefined();
            expect(controller.eventMethods).toBeUndefined();
            expect(controller.controllerMethods).toBeUndefined();

            clearSetupCalls(table, crud);

            expect(controller.on('dataLoaded', firstCallback)).toBeUndefined();
            expect(controller.on('dataLoaded', secondCallback)).toBeUndefined();
            expect(controller.on('rowAdded', otherEventCallback)).toBeUndefined();
            expect(table.on).toHaveBeenCalledTimes(3);
            expect(table.on).toHaveBeenNthCalledWith(1, 'dataLoaded', firstCallback);
            expect(table.on).toHaveBeenNthCalledWith(2, 'dataLoaded', secondCallback);
            expect(table.on).toHaveBeenNthCalledWith(3, 'rowAdded', otherEventCallback);

            table.on('dataLoaded', advancedCallback);
            table.on.mockClear();

            table.emit('dataLoaded', { rows: [1, 2] }, 'original-context');
            expect(table.technicalDataLoaded).toHaveBeenCalledOnce();
            expect(table.technicalDataLoaded).toHaveBeenCalledWith({ rows: [1, 2] }, 'original-context');
            expect(firstCallback).toHaveBeenCalledOnce();
            expect(firstCallback).toHaveBeenCalledWith({ rows: [1, 2] }, 'original-context');
            expect(secondCallback).toHaveBeenCalledOnce();
            expect(secondCallback).toHaveBeenCalledWith({ rows: [1, 2] }, 'original-context');
            expect(advancedCallback).toHaveBeenCalledOnce();
            expect(advancedCallback).toHaveBeenCalledWith({ rows: [1, 2] }, 'original-context');
            expect(otherEventCallback).not.toHaveBeenCalled();

            expect(controller.off('dataLoaded', firstCallback)).toBeUndefined();
            expect(table.off).toHaveBeenCalledOnce();
            expect(table.off).toHaveBeenCalledWith('dataLoaded', firstCallback);

            table.emit('dataLoaded', { rows: [3] });
            expect(firstCallback).toHaveBeenCalledOnce();
            expect(secondCallback).toHaveBeenCalledTimes(2);
            expect(table.technicalDataLoaded).toHaveBeenCalledTimes(2);
            expect(advancedCallback).toHaveBeenCalledTimes(2);

            expect(controller.off('dataLoaded')).toBeUndefined();
            expect(table.off).toHaveBeenCalledTimes(2);
            expect(table.off).toHaveBeenLastCalledWith('dataLoaded', secondCallback);
            table.off.mock.calls.forEach(call => {
                expect(call).toHaveLength(2);
            });
            expect(table.engineWideOffCalls).toEqual([]);

            table.emit('dataLoaded', { rows: [4] });
            expect(secondCallback).toHaveBeenCalledTimes(2);
            expect(table.technicalDataLoaded).toHaveBeenCalledTimes(3);
            expect(advancedCallback).toHaveBeenCalledTimes(3);

            table.emit('rowAdded', { id: 1 });
            expect(otherEventCallback).toHaveBeenCalledOnce();
            expect(otherEventCallback).toHaveBeenCalledWith({ id: 1 });

            controller.off('unknownEvent');
            expect(table.off).toHaveBeenCalledTimes(2);

            controller.on('tableDestroyed', destroyCallback);
            table.on.mockClear();
            table.off.mockClear();

            expectNoGridSideEffects(table, crud);
            controller.destroy();

            expect(destroyCallback).toHaveBeenCalledOnce();
            expect(destroyCallback).toHaveBeenCalledWith({ reason: 'destroy' });
            expect(table.destroy).toHaveBeenCalledOnce();
            expect(table.off).not.toHaveBeenCalled();
        } finally {
            harness.restore();
        }
    });
});

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
            this.getColumnDefinitions = vi.fn(() => []);
            this.getColumns = vi.fn(() => []);
            this.getColumn = vi.fn(() => false);
            this.showColumn = vi.fn();
            this.hideColumn = vi.fn();
            this.toggleColumn = vi.fn();
            this.scrollToColumn = vi.fn(() => Promise.resolve());
            this.moveColumn = vi.fn();
            this.getSorters = vi.fn(() => []);
            this.setSort = vi.fn();
            this.clearSort = vi.fn();
            this.getFilters = vi.fn(() => []);
            this.addFilter = vi.fn();
            this.setFilter = vi.fn();
            this.removeFilter = vi.fn();
            this.clearFilter = vi.fn();
            this.refreshFilter = vi.fn();
            this.getHeaderFilters = vi.fn(() => []);
            this.getHeaderFilterValue = vi.fn(() => undefined);
            this.setHeaderFilterValue = vi.fn();
            this.setHeaderFilterFocus = vi.fn();
            this.clearHeaderFilter = vi.fn();
            this.getSelectedData = vi.fn(() => []);
            this.getSelectedRows = vi.fn(() => []);
            this.selectRow = vi.fn();
            this.deselectRow = vi.fn();
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

describe('AMB table controller column API', () => {
    test('exposes flat column methods and preserves delegation contracts', () => {
        const harness = createDocumentHarness();

        try {
            const controller = createTable({
                selector: harness.mount,
                columns: [
                    { title: 'Name', field: 'name' },
                    { title: 'Age', field: 'age' }
                ],
                search: {
                    enabled: true
                },
                toolbar: false
            });
            const table = tabulatorMock.instances[0];
            const crud = crudMock.instances[0];
            const ambDefinition = { title: '', field: '_amb_select' };
            const dataDefinition = { title: 'Name', field: 'name' };
            const definitions = [ambDefinition, dataDefinition];
            const ambComponent = { field: '_amb_actions' };
            const nameComponent = { field: 'name' };
            const ambLookup = { field: '_amb_actions' };
            const ambTargetLookup = { field: '_amb_select' };
            const flatColumns = [ambComponent, nameComponent];
            const groupComponent = { title: 'Person', columns: [nameComponent] };
            const groupedColumns = [ambComponent, groupComponent];
            const columnDefinition = { title: 'Runtime', field: 'runtime' }, columnCells = [], subColumns = [], nextColumn = {}, runtimeColumn = { getDefinition: vi.fn(() => columnDefinition), getCells: vi.fn(() => columnCells), isVisible: vi.fn(() => false), getWidth: vi.fn(() => 0), getSubColumns: vi.fn(() => subColumns), getNextColumn: vi.fn(() => nextColumn), getTitleDownload: vi.fn(() => '') };
            const showResult = { shown: true };
            const hideResult = { hidden: true };
            const toggleResult = { toggled: true };
            const scrollPromise = Promise.resolve();
            const ambScrollPromise = Promise.resolve();
            const moveResult = { moved: true };

            expect(controller.table).toBe(table);
            expect(typeof controller.getColumnDefinitions).toBe('function');
            expect(typeof controller.getColumns).toBe('function');
            expect(typeof controller.getColumn).toBe('function');
            expect(typeof controller.showColumn).toBe('function');
            expect(typeof controller.hideColumn).toBe('function');
            expect(typeof controller.toggleColumn).toBe('function');
            expect(typeof controller.scrollToColumn).toBe('function');
            expect(typeof controller.moveColumn).toBe('function');
            ['getColumnDefinition', 'getColumnElement', 'getColumnField', 'getColumnCells', 'isColumnVisible', 'getColumnWidth', 'getColumnSubColumns', 'getColumnParent', 'getNextColumn', 'getPrevColumn', 'getColumnDownloadTitle'].forEach(name => expect(typeof controller[name]).toBe('function'));
            expect(controller.columnMethods).toBeUndefined();
            expect(controller.columns).toBeUndefined();
            expect(controller.navigation).toBeUndefined();
            expect(controller.visibility).toBeUndefined();
            expect(controller.controllerMethods).toBeUndefined();

            clearCrudSetupCalls(crud);
            const searchState = controller.getSearchState();

            table.getColumnDefinitions.mockReturnValueOnce(definitions);
            expect(controller.getColumnDefinitions()).toBe(definitions);
            expect(table.getColumnDefinitions).toHaveBeenCalledOnce();
            expect(table.getColumnDefinitions).toHaveBeenCalledWith();
            expect(definitions[0]).toBe(ambDefinition);
            expect(definitions[1]).toBe(dataDefinition);

            table.getColumns
                .mockReturnValueOnce(flatColumns)
                .mockReturnValueOnce(groupedColumns);
            expect(controller.getColumns()).toBe(flatColumns);
            expect(table.getColumns).toHaveBeenCalledOnce();
            expect(table.getColumns).toHaveBeenLastCalledWith();
            expect(flatColumns[0]).toBe(ambComponent);
            expect(flatColumns[1]).toBe(nameComponent);

            expect(controller.getColumns(true)).toBe(groupedColumns);
            expect(table.getColumns).toHaveBeenCalledTimes(2);
            expect(table.getColumns).toHaveBeenLastCalledWith(true);
            expect(groupedColumns[1]).toBe(groupComponent);
            expect(groupedColumns[1].columns[0]).toBe(nameComponent);

            table.getColumn
                .mockReturnValueOnce(nameComponent)
                .mockReturnValueOnce(false);
            expect(controller.getColumn('name')).toBe(nameComponent);
            expect(table.getColumn).toHaveBeenCalledOnce();
            expect(table.getColumn).toHaveBeenLastCalledWith('name');
            expect(controller.getColumn('missing')).toBe(false);
            expect(table.getColumn).toHaveBeenCalledTimes(2);
            expect(table.getColumn).toHaveBeenLastCalledWith('missing');
            table.getColumn.mockReturnValue(runtimeColumn);
            expect(controller.getColumnDefinition('runtime')).toBe(columnDefinition);
            expect(controller.getColumnCells('runtime')).toBe(columnCells);
            expect(controller.isColumnVisible('runtime')).toBe(false);
            expect(controller.getColumnWidth('runtime')).toBe(0);
            expect(controller.getColumnSubColumns('runtime')).toBe(subColumns);
            expect(controller.getNextColumn('runtime')).toBe(nextColumn);
            expect(controller.getColumnDownloadTitle('runtime')).toBe('');

            table.showColumn
                .mockReturnValueOnce(showResult)
                .mockReturnValueOnce(undefined);
            expect(controller.showColumn('name')).toBe(showResult);
            expect(table.showColumn).toHaveBeenCalledOnce();
            expect(table.showColumn).toHaveBeenLastCalledWith('name');
            expect(controller.showColumn(ambLookup)).toBeUndefined();
            expect(table.showColumn).toHaveBeenCalledTimes(2);
            expect(table.showColumn).toHaveBeenLastCalledWith(ambLookup);
            expect(table.showColumn.mock.calls[1][0]).toBe(ambLookup);

            table.hideColumn
                .mockReturnValueOnce(hideResult)
                .mockReturnValueOnce(undefined);
            expect(controller.hideColumn('name')).toBe(hideResult);
            expect(table.hideColumn).toHaveBeenCalledOnce();
            expect(table.hideColumn).toHaveBeenLastCalledWith('name');
            expect(controller.hideColumn(ambLookup)).toBeUndefined();
            expect(table.hideColumn).toHaveBeenCalledTimes(2);
            expect(table.hideColumn).toHaveBeenLastCalledWith(ambLookup);
            expect(table.hideColumn.mock.calls[1][0]).toBe(ambLookup);

            table.toggleColumn.mockReturnValueOnce(toggleResult);
            expect(controller.toggleColumn('name')).toBe(toggleResult);
            expect(table.toggleColumn).toHaveBeenCalledOnce();
            expect(table.toggleColumn).toHaveBeenLastCalledWith('name');

            table.scrollToColumn
                .mockReturnValueOnce(scrollPromise)
                .mockReturnValueOnce(ambScrollPromise);
            expect(controller.scrollToColumn('email', 'center', false)).toBe(scrollPromise);
            expect(table.scrollToColumn).toHaveBeenCalledOnce();
            expect(table.scrollToColumn).toHaveBeenLastCalledWith('email', 'center', false);
            expect(table.scrollToColumn.mock.calls[0][2]).toBe(false);
            expect(controller.scrollToColumn(ambLookup, 'left', true)).toBe(ambScrollPromise);
            expect(table.scrollToColumn).toHaveBeenCalledTimes(2);
            expect(table.scrollToColumn).toHaveBeenLastCalledWith(ambLookup, 'left', true);
            expect(table.scrollToColumn.mock.calls[1][0]).toBe(ambLookup);

            table.moveColumn
                .mockReturnValueOnce(moveResult)
                .mockReturnValueOnce(undefined);
            expect(controller.moveColumn('name', 'age', true)).toBe(moveResult);
            expect(table.moveColumn).toHaveBeenCalledOnce();
            expect(table.moveColumn).toHaveBeenLastCalledWith('name', 'age', true);
            expect(controller.moveColumn(ambLookup, ambTargetLookup, false)).toBeUndefined();
            expect(table.moveColumn).toHaveBeenCalledTimes(2);
            expect(table.moveColumn).toHaveBeenLastCalledWith(ambLookup, ambTargetLookup, false);
            expect(table.moveColumn.mock.calls[1][0]).toBe(ambLookup);
            expect(table.moveColumn.mock.calls[1][1]).toBe(ambTargetLookup);
            expect(table.moveColumn.mock.calls[1][2]).toBe(false);

            expect(controller.getSearchState()).toEqual(searchState);
            expect(table.setFilter).not.toHaveBeenCalled();
            expect(table.clearFilter).not.toHaveBeenCalled();
            expect(table.addFilter).not.toHaveBeenCalled();
            expect(table.removeFilter).not.toHaveBeenCalled();
            expect(table.refreshFilter).not.toHaveBeenCalled();
            expect(table.setSort).not.toHaveBeenCalled();
            expect(table.clearSort).not.toHaveBeenCalled();
            expect(table.selectRow).not.toHaveBeenCalled();
            expect(table.deselectRow).not.toHaveBeenCalled();
            expect(table.setPage).not.toHaveBeenCalled();
            expect(table.nextPage).not.toHaveBeenCalled();
            expect(table.previousPage).not.toHaveBeenCalled();
            expect(crud.findRowByKey).not.toHaveBeenCalled();
            expect(crud.getSavePayload).not.toHaveBeenCalled();
            expect(crud.getStateReport).not.toHaveBeenCalled();
            expect(crud.validateRow).not.toHaveBeenCalled();
            expect(crud.updateRowFields).not.toHaveBeenCalled();
            expect(crud.deleteRow).not.toHaveBeenCalled();
            expect(crud.rollbackRow).not.toHaveBeenCalled();
            expect(crud.destroy).not.toHaveBeenCalled();
        } finally {
            harness.restore();
        }
    });
});

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
            this.searchData = vi.fn(() => []);
            this.getRows = vi.fn(() => []);
            this.getRow = vi.fn(() => false);
            this.getRowPosition = vi.fn(() => false);
            this.getRowFromPosition = vi.fn(() => false);
            this.scrollToRow = vi.fn(() => Promise.resolve());
            this.searchRows = vi.fn(() => []);
            this.getPage = vi.fn(() => 1);
            this.getPageMax = vi.fn(() => 5);
            this.getPageSize = vi.fn(() => 25);
            this.setPage = vi.fn();
            this.nextPage = vi.fn();
            this.previousPage = vi.fn();
            this.setPageSize = vi.fn();
            this.setPageToRow = vi.fn();
            this.getHtml = vi.fn(() => '<table></table>');
            this.copyToClipboard = vi.fn();
            this.download = vi.fn();
            this.downloadToTab = vi.fn();
            this.print = vi.fn();
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

const clearTableSideEffects = table => {
    table.addFilter.mockClear();
    table.setFilter.mockClear();
    table.removeFilter.mockClear();
    table.clearFilter.mockClear();
    table.refreshFilter.mockClear();
    table.setHeaderFilterValue.mockClear();
    table.clearHeaderFilter.mockClear();
    table.setSort.mockClear();
    table.clearSort.mockClear();
    table.selectRow.mockClear();
    table.deselectRow.mockClear();
    table.setPage.mockClear();
    table.nextPage.mockClear();
    table.previousPage.mockClear();
    table.getData.mockClear();
    table.copyToClipboard.mockClear();
    table.searchData.mockClear();
    table.getRows.mockClear();
    table.searchRows.mockClear();
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

describe('AMB table controller export API', () => {
    test('exposes flat export methods and preserves delegation contracts', () => {
        const harness = createDocumentHarness();

        try {
            const controller = createTable({
                selector: harness.mount,
                columns: [
                    { title: 'Name', field: 'name' },
                    { title: 'Status', field: 'status' }
                ],
                search: {
                    enabled: true
                },
                toolbar: false
            });
            const table = tabulatorMock.instances[0];
            const crud = crudMock.instances[0];
            const html = '<table><tbody><tr><td>Mario</td></tr></tbody></table>';
            const options = { sheetName: 'Data' };
            const tabOptions = { orientation: 'landscape' };
            const downloadResult = { downloaded: true };
            const clipboardResult = { copied: true };
            const tabResult = { opened: true };
            const printResult = { printed: true };

            expect(controller.table).toBe(table);
            expect(typeof controller.getHtml).toBe('function');
            expect(typeof controller.copyToClipboard).toBe('function');
            expect(typeof controller.download).toBe('function');
            expect(typeof controller.downloadToTab).toBe('function');
            expect(typeof controller.print).toBe('function');
            expect(controller.clipboard).toBeUndefined();
            expect(controller.clipboardMethods).toBeUndefined();
            expect(controller.exportMethods).toBeUndefined();
            expect(controller.export).toBeUndefined();
            expect(controller.output).toBeUndefined();
            expect(controller.controllerMethods).toBeUndefined();

            expect(controller.setSearchQuery('Mario')).toBe(true);
            const searchState = controller.getSearchState();

            clearTableSideEffects(table);
            clearCrudSetupCalls(crud);

            table.getHtml.mockReturnValueOnce(html);
            expect(controller.getHtml('visible', true, { columnGroups: false })).toBe(html);
            expect(table.getHtml).toHaveBeenCalledOnce();
            expect(table.getHtml).toHaveBeenLastCalledWith('visible', true, { columnGroups: false });

            table.copyToClipboard
                .mockReturnValueOnce(clipboardResult)
                .mockReturnValueOnce(undefined);
            expect(controller.copyToClipboard()).toBe(clipboardResult);
            expect(table.copyToClipboard).toHaveBeenCalledOnce();
            expect(table.copyToClipboard).toHaveBeenLastCalledWith();
            expect(controller.copyToClipboard('selected')).toBeUndefined();
            expect(table.copyToClipboard).toHaveBeenCalledTimes(2);
            expect(table.copyToClipboard).toHaveBeenLastCalledWith('selected');

            table.download.mockReturnValueOnce(downloadResult);
            expect(controller.download('csv', 'data.csv')).toBe(downloadResult);
            expect(table.download).toHaveBeenCalledOnce();
            expect(table.download).toHaveBeenLastCalledWith('csv', 'data.csv');

            table.download.mockReturnValueOnce(undefined);
            expect(controller.download('xlsx', 'data.xlsx', options)).toBeUndefined();
            expect(table.download).toHaveBeenCalledTimes(2);
            expect(table.download).toHaveBeenLastCalledWith('xlsx', 'data.xlsx', options);
            expect(table.download.mock.calls[1][2]).toBe(options);

            table.downloadToTab.mockReturnValueOnce(tabResult);
            expect(controller.downloadToTab('pdf', 'report.pdf', tabOptions)).toBe(tabResult);
            expect(table.downloadToTab).toHaveBeenCalledOnce();
            expect(table.downloadToTab).toHaveBeenLastCalledWith('pdf', 'report.pdf', tabOptions);
            expect(table.downloadToTab.mock.calls[0][2]).toBe(tabOptions);

            table.print.mockReturnValueOnce(printResult);
            expect(controller.print('active', true)).toBe(printResult);
            expect(table.print).toHaveBeenCalledOnce();
            expect(table.print).toHaveBeenLastCalledWith('active', true);

            expect(controller.getSearchState()).toEqual(searchState);
            expect(table.addFilter).not.toHaveBeenCalled();
            expect(table.setFilter).not.toHaveBeenCalled();
            expect(table.removeFilter).not.toHaveBeenCalled();
            expect(table.clearFilter).not.toHaveBeenCalled();
            expect(table.refreshFilter).not.toHaveBeenCalled();
            expect(table.setHeaderFilterValue).not.toHaveBeenCalled();
            expect(table.clearHeaderFilter).not.toHaveBeenCalled();
            expect(table.setSort).not.toHaveBeenCalled();
            expect(table.clearSort).not.toHaveBeenCalled();
            expect(table.selectRow).not.toHaveBeenCalled();
            expect(table.deselectRow).not.toHaveBeenCalled();
            expect(table.setPage).not.toHaveBeenCalled();
            expect(table.nextPage).not.toHaveBeenCalled();
            expect(table.previousPage).not.toHaveBeenCalled();
            expect(table.getData).not.toHaveBeenCalled();
            expect(table.searchData).not.toHaveBeenCalled();
            expect(table.getRows).not.toHaveBeenCalled();
            expect(table.searchRows).not.toHaveBeenCalled();
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

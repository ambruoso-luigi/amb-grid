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
            this.data = [];
            this.rows = [];
            this.filters = [];
            this.sorters = [];
            this.selectedData = [];
            this.selectedRows = [];
            this.page = 1;
            this.validate = vi.fn(() => {
                throw new Error('The native table validation method must not be called');
            });
            this.getInvalidCells = vi.fn(() => []);
            this.clearCellValidation = vi.fn();
            this.getData = vi.fn(() => this.data);
            this.getRows = vi.fn(() => this.rows);
            this.getFilters = vi.fn(() => this.filters);
            this.getSorters = vi.fn(() => this.sorters);
            this.getSelectedData = vi.fn(() => this.selectedData);
            this.getSelectedRows = vi.fn(() => this.selectedRows);
            this.getPage = vi.fn(() => this.page);
            this.setData = vi.fn();
            this.replaceData = vi.fn();
            this.updateData = vi.fn();
            this.addData = vi.fn();
            this.setFilter = vi.fn();
            this.clearFilter = vi.fn();
            this.setSort = vi.fn();
            this.clearSort = vi.fn();
            this.setPage = vi.fn();
            this.selectRow = vi.fn();
            this.deselectRow = vi.fn();
            this.destroy = vi.fn();
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
            this.validateAll = vi.fn();
            this.validateChanges = vi.fn();
            this.validateRow = vi.fn();
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
    table.validate.mockClear();
    table.getInvalidCells.mockClear();
    table.clearCellValidation.mockClear();
    table.getData.mockClear();
    table.getRows.mockClear();
    table.getFilters.mockClear();
    table.getSorters.mockClear();
    table.getSelectedData.mockClear();
    table.getSelectedRows.mockClear();
    table.getPage.mockClear();
    table.setData.mockClear();
    table.replaceData.mockClear();
    table.updateData.mockClear();
    table.addData.mockClear();
    table.setFilter.mockClear();
    table.clearFilter.mockClear();
    table.setSort.mockClear();
    table.clearSort.mockClear();
    table.setPage.mockClear();
    table.selectRow.mockClear();
    table.deselectRow.mockClear();
    crud.on.mockClear();
    crud.addCellValidator.mockClear();
    crud.findRowByKey.mockClear();
    crud.getSavePayload.mockClear();
    crud.getStateReport.mockClear();
    crud.validateAll.mockClear();
    crud.validateChanges.mockClear();
    crud.validateRow.mockClear();
    crud.updateRowFields.mockClear();
    crud.addRow.mockClear();
    crud.deleteRow.mockClear();
    crud.rollbackRow.mockClear();
};

describe('AMB table controller validation API', () => {
    test('validates through the AMB CRUD layer without using native table validation', () => {
        const harness = createDocumentHarness();

        try {
            const controller = createTable({
                selector: harness.mount,
                columns: [
                    { title: 'Name', field: 'name' }
                ],
                toolbar: false
            });
            const table = tabulatorMock.instances[0];
            const crud = crudMock.instances[0];
            const rowData = [
                {
                    id: 1,
                    name: 'Clean',
                    _state: 'clean',
                    _errors: {},
                    _ambTempId: undefined,
                    _original: {
                        id: 1,
                        name: 'Clean'
                    }
                },
                {
                    id: undefined,
                    name: '',
                    _state: 'new',
                    _errors: {
                        name: 'Required'
                    },
                    _ambTempId: 'amb-temp-1',
                    _original: null
                },
                {
                    id: 2,
                    name: '',
                    _state: 'modified',
                    _errors: {
                        name: 'Required'
                    },
                    _ambTempId: 'tmp-2',
                    _original: {
                        id: 2,
                        name: 'Ada'
                    }
                },
                {
                    id: 3,
                    name: 'Deleted',
                    _state: 'deleted',
                    _errors: {},
                    _ambTempId: undefined,
                    _original: {
                        id: 3,
                        name: 'Deleted'
                    }
                },
                {
                    id: 4,
                    name: 'Saved',
                    _state: 'saved',
                    _errors: {},
                    _ambTempId: undefined,
                    _original: {
                        id: 4,
                        name: 'Saved'
                    }
                }
            ];
            const rowComponents = rowData.map(row => ({
                data: row,
                validate: vi.fn()
            }));
            const filters = [{ field: 'department', type: '=', value: 'Sales' }];
            const sorters = [{ field: 'name', dir: 'asc' }];
            const selectedData = [rowData[0]];
            const selectedRows = [{ id: 'selected-row-component-1' }];
            const options = {
                includeDeleted: true
            };
            const report = {
                isValid: false,
                rows: [
                    {
                        id: 2,
                        tempId: undefined,
                        rowNumber: 3,
                        isValid: false,
                        errors: [
                            {
                                field: 'name',
                                message: 'Required'
                            }
                        ]
                    }
                ],
                errors: [
                    {
                        id: 2,
                        field: 'name',
                        message: 'Required'
                    }
                ]
            };
            const changesReport = {
                isValid: false,
                rows: [
                    {
                        id: undefined,
                        tempId: 'amb-temp-1',
                        rowNumber: 2,
                        isValid: false,
                        errors: [
                            {
                                field: 'name',
                                message: 'Required'
                            }
                        ]
                    },
                    {
                        id: 2,
                        tempId: 'tmp-2',
                        rowNumber: 3,
                        isValid: false,
                        errors: [
                            {
                                field: 'name',
                                message: 'Required'
                            }
                        ]
                    }
                ],
                errors: [
                    {
                        tempId: 'amb-temp-1',
                        field: 'name',
                        message: 'Required'
                    },
                    {
                        id: 2,
                        field: 'name',
                        message: 'Required'
                    }
                ]
            };
            const backendRowReport = {
                id: 2,
                tempId: 'tmp-2',
                rowNumber: 3,
                isValid: true,
                errors: []
            };
            const temporaryRowReport = {
                id: undefined,
                tempId: 'amb-temp-1',
                rowNumber: 2,
                isValid: false,
                errors: [
                    {
                        field: 'name',
                        message: 'Required'
                    }
                ]
            };
            const zeroRowReport = {
                id: 0,
                tempId: undefined,
                rowNumber: 6,
                isValid: true,
                errors: []
            };
            const emptyStringRowReport = {
                id: '',
                tempId: undefined,
                rowNumber: 7,
                isValid: true,
                errors: []
            };
            const originalRowsSnapshot = rowData.map(row => ({
                state: row._state,
                errors: row._errors,
                tempId: row._ambTempId,
                original: row._original
            }));
            const rowOptions = {
                markDeletedErrors: false
            };

            table.data = rowData;
            table.rows = rowComponents;
            table.filters = filters;
            table.sorters = sorters;
            table.selectedData = selectedData;
            table.selectedRows = selectedRows;
            table.page = 3;
            crud.validateAll.mockReturnValue(report);
            crud.validateChanges.mockReturnValue(changesReport);
            crud.validateRow
                .mockReturnValueOnce(backendRowReport)
                .mockReturnValueOnce(temporaryRowReport)
                .mockReturnValueOnce(null)
                .mockReturnValueOnce(zeroRowReport)
                .mockReturnValueOnce(emptyStringRowReport);

            expect(controller.table).toBe(table);
            expect(typeof controller.validate).toBe('function');
            expect(typeof controller.validateChanges).toBe('function');
            expect(typeof controller.validateRow).toBe('function');
            expect(controller.validation).toBeUndefined();
            expect(controller.validationMethods).toBeUndefined();
            expect(controller.controllerMethods).toBeUndefined();

            clearSetupCalls(table, crud);

            const result = controller.validate(options);

            expect(result).toBe(report);
            expect(result.rows).toBe(report.rows);
            expect(result.errors).toBe(report.errors);
            expect(crud.validateAll).toHaveBeenCalledOnce();
            expect(crud.validateAll).toHaveBeenCalledWith(options);
            expect(crud.validateAll.mock.calls[0][0]).toBe(options);
            expect(crud.validateChanges).not.toHaveBeenCalled();
            expect(crud.validateRow).not.toHaveBeenCalled();

            const changesResult = controller.validateChanges();

            expect(changesResult).toBe(changesReport);
            expect(changesResult.rows).toBe(changesReport.rows);
            expect(changesResult.errors).toBe(changesReport.errors);
            expect(changesResult.rows.map(row => row.tempId || row.id)).toEqual([
                'amb-temp-1',
                'tmp-2'
            ]);
            expect(crud.validateChanges).toHaveBeenCalledOnce();
            expect(crud.validateChanges).toHaveBeenCalledWith();
            expect(crud.validateAll).toHaveBeenCalledOnce();

            expect(controller.validateRow(2, rowOptions)).toBe(backendRowReport);
            expect(controller.validateRow('amb-temp-1')).toBe(temporaryRowReport);
            expect(controller.validateRow('missing-row')).toBeNull();
            expect(controller.validateRow(0)).toBe(zeroRowReport);
            expect(controller.validateRow('')).toBe(emptyStringRowReport);

            expect(crud.validateRow).toHaveBeenCalledTimes(5);
            expect(crud.validateRow).toHaveBeenNthCalledWith(1, 2, rowOptions);
            expect(crud.validateRow.mock.calls[0][1]).toBe(rowOptions);
            expect(crud.validateRow).toHaveBeenNthCalledWith(2, 'amb-temp-1');
            expect(crud.validateRow).toHaveBeenNthCalledWith(3, 'missing-row');
            expect(crud.validateRow).toHaveBeenNthCalledWith(4, 0);
            expect(crud.validateRow).toHaveBeenNthCalledWith(5, '');
            expect(crud.validateAll).toHaveBeenCalledOnce();
            expect(crud.validateChanges).toHaveBeenCalledOnce();
            expect(table.validate).not.toHaveBeenCalled();
            expect(table.getInvalidCells).not.toHaveBeenCalled();
            expect(table.clearCellValidation).not.toHaveBeenCalled();
            rowComponents.forEach(row => {
                expect(row.validate).not.toHaveBeenCalled();
            });
            rowData.forEach((row, index) => {
                expect(row._state).toBe(originalRowsSnapshot[index].state);
                expect(row._errors).toBe(originalRowsSnapshot[index].errors);
                expect(row._ambTempId).toBe(originalRowsSnapshot[index].tempId);
                expect(row._original).toBe(originalRowsSnapshot[index].original);
            });
            expect(table.data).toBe(rowData);
            expect(table.rows).toBe(rowComponents);
            expect(table.filters).toBe(filters);
            expect(table.sorters).toBe(sorters);
            expect(table.selectedData).toBe(selectedData);
            expect(table.selectedRows).toBe(selectedRows);
            expect(table.page).toBe(3);
            expect(crud.getSavePayload).not.toHaveBeenCalled();
            expect(crud.getStateReport).not.toHaveBeenCalled();
            expect(crud.findRowByKey).not.toHaveBeenCalled();
            expect(crud.updateRowFields).not.toHaveBeenCalled();
            expect(crud.addRow).not.toHaveBeenCalled();
            expect(crud.deleteRow).not.toHaveBeenCalled();
            expect(crud.rollbackRow).not.toHaveBeenCalled();
            expect(table.setData).not.toHaveBeenCalled();
            expect(table.replaceData).not.toHaveBeenCalled();
            expect(table.updateData).not.toHaveBeenCalled();
            expect(table.addData).not.toHaveBeenCalled();
            expect(table.setFilter).not.toHaveBeenCalled();
            expect(table.clearFilter).not.toHaveBeenCalled();
            expect(table.setSort).not.toHaveBeenCalled();
            expect(table.clearSort).not.toHaveBeenCalled();
            expect(table.setPage).not.toHaveBeenCalled();
            expect(table.selectRow).not.toHaveBeenCalled();
            expect(table.deselectRow).not.toHaveBeenCalled();
        } finally {
            harness.restore();
        }
    });
});

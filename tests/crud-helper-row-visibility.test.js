import { describe, expect, test, vi } from 'vitest';
import { CrudHelper, ROW_STATE } from '../src/lib/crud-helper.js';

const flushPromises = async () => {
    await Promise.resolve();
    await Promise.resolve();
};

const createColumnMock = (definition = {}) => ({
    getDefinition: () => definition,
    getField: () => definition.field,
    isVisible: () => definition.visible !== false
});

const createCellMock = (row, definition = {}) => {
    const column = createColumnMock(definition);
    const field = definition.field;
    const focusElement = {
        className: definition.focusClassName || '',
        dataset: { field },
        closest: selector => {
            return selector === '.amb-row-action-button' && definition.isActionButton
                ? focusElement
                : null;
        }
    };
    const cell = {
        focusElement,
        edit: vi.fn(() => {
            if (globalThis.document) {
                globalThis.document.activeElement = focusElement;
            }
        }),
        getColumn: () => column,
        getElement: () => ({ dataset: {} }),
        getField: () => field,
        getRow: () => row,
        getValue: () => row.getData()[field]
    };

    return cell;
};

const createTableMock = ({
    rowsData = [],
    columns = [{ field: 'name', editor: 'input' }],
    pagination = false,
    pageSize = 10,
    currentPage = 1,
    asyncAdd = true,
    asyncDelete = true,
    hasPageTo = true,
    pageToRejects = false,
    rerenderOnNavigation = false
} = {}) => {
    const rows = [];
    const handlers = new Map();
    const tableColumns = columns.map(createColumnMock);
    const rerenderCurrentPage = () => {
        const start = (currentPage - 1) * pageSize;
        const end = start + pageSize;
        const replacementRows = rows
            .slice(start, end)
            .map(row => createRow(row.getData()));

        rows.splice(start, replacementRows.length, ...replacementRows);
    };
    const table = {
        options: pagination
            ? { pagination: true, paginationSize: pageSize }
            : { pagination: false },
        handlers,
        addRow: vi.fn(data => {
            const row = createRow(data);

            rows.push(row);

            return asyncAdd ? Promise.resolve(row) : row;
        }),
        getColumns: vi.fn(() => tableColumns),
        getPage: vi.fn(() => currentPage),
        getPageMax: vi.fn(() => Math.max(1, Math.ceil(rows.length / pageSize))),
        getRows: vi.fn(active => active === 'visible' ? table.getVisibleRows() : rows),
        getVisibleRows: vi.fn(() => {
            if (!pagination) return rows;

            const start = (currentPage - 1) * pageSize;

            return rows.slice(start, start + pageSize);
        }),
        off: vi.fn(),
        on: vi.fn((eventName, handler) => {
            handlers.set(eventName, handler);
        }),
        scrollToRow: vi.fn(() => Promise.resolve()),
        setPage: vi.fn(page => {
            currentPage = Number(page);

            if (rerenderOnNavigation) {
                rerenderCurrentPage();
            }

            return Promise.resolve();
        })
    };

    const createRow = data => {
        const rowElement = {
            dataset: {},
            removeAttribute: vi.fn()
        };
        let row;
        let cells = [];

        row = {
            scrollTo: vi.fn(() => Promise.resolve()),
            delete: vi.fn(() => {
                const index = rows.indexOf(row);

                if (index >= 0) {
                    rows.splice(index, 1);
                }

                return asyncDelete ? Promise.resolve() : undefined;
            }),
            ...(hasPageTo
                ? {
                    pageTo: vi.fn(() => {
                        if (pageToRejects) {
                            return Promise.reject(new Error('pageTo failed'));
                        }

                        const index = rows.indexOf(row);

                        currentPage = index >= 0
                            ? Math.ceil((index + 1) / pageSize)
                            : currentPage;

                        if (rerenderOnNavigation) {
                            rerenderCurrentPage();
                        }

                        return Promise.resolve();
                    })
                }
                : {}),
            getCell: field => cells.find(cell => cell.getField() === field) || null,
            getCells: () => cells,
            getData: () => data,
            getElement: () => rowElement,
            update: patch => {
                Object.assign(data, patch);

                return row;
            }
        };
        cells = columns.map(column => createCellMock(row, column));

        return row;
    };

    rowsData.forEach(data => rows.push(createRow(data)));

    return {
        table,
        rows,
        getCurrentPage: () => currentPage
    };
};

const createRowsData = count => {
    return Array.from({ length: count }, (_, index) => ({
        id: index + 1,
        name: `Row ${index + 1}`
    }));
};

describe('CrudHelper row reveal and pagination normalization', () => {
    test('addRow without pagination appends, scrolls, and focuses the first editable cell', async () => {
        const { table, rows } = createTableMock({
            rowsData: createRowsData(2),
            asyncAdd: false,
            columns: [
                { title: 'Actions' },
                { field: 'locked', editor: 'input', editable: false },
                { field: 'secret', editor: 'input', visible: false },
                { field: 'name', editor: 'input' }
            ]
        });
        const crud = new CrudHelper(table);

        const row = crud.addRow({ id: null, name: 'New row' });

        await flushPromises();

        expect(row).toBe(rows[2]);
        expect(rows).toHaveLength(3);
        expect(row.getData()._state).toBe(ROW_STATE.NEW);
        expect(row.pageTo).not.toHaveBeenCalled();
        expect(row.scrollTo).toHaveBeenCalledWith('bottom', false);
        expect(row.getCell('locked').edit).not.toHaveBeenCalled();
        expect(row.getCell('secret').edit).not.toHaveBeenCalled();
        expect(row.getCell('name').edit).toHaveBeenCalledTimes(1);
    });

    test('addRow with pagination uses RowComponent.pageTo before scrolling and focusing', async () => {
        const { table, getCurrentPage } = createTableMock({
            rowsData: createRowsData(19),
            pagination: true,
            pageSize: 10
        });
        const crud = new CrudHelper(table);

        const row = await crud.addRow({ id: null, name: 'New row' });

        expect(getCurrentPage()).toBe(2);
        expect(row.pageTo).toHaveBeenCalledTimes(1);
        expect(table.setPage).not.toHaveBeenCalled();
        expect(table.getVisibleRows()).toContain(row);
        expect(row.scrollTo).toHaveBeenCalledWith('bottom', false);
        expect(row.getCell('name').edit).toHaveBeenCalledTimes(1);
    });

    test('addRow with pagination falls back to setPage when pageTo is unavailable', async () => {
        const { table, getCurrentPage } = createTableMock({
            rowsData: createRowsData(19),
            pagination: true,
            pageSize: 10,
            hasPageTo: false
        });
        const crud = new CrudHelper(table);

        const row = await crud.addRow({ id: null, name: 'New row' });

        expect(getCurrentPage()).toBe(2);
        expect(row.pageTo).toBeUndefined();
        expect(table.setPage).toHaveBeenCalledWith(2);
        expect(table.getVisibleRows()).toContain(row);
        expect(row.getCell('name').edit).toHaveBeenCalledTimes(1);
    });

    test('addRow with pagination falls back safely when pageTo rejects', async () => {
        const { table, getCurrentPage } = createTableMock({
            rowsData: createRowsData(19),
            pagination: true,
            pageSize: 10,
            pageToRejects: true
        });
        const crud = new CrudHelper(table);

        const row = await crud.addRow({ id: null, name: 'New row' });

        expect(getCurrentPage()).toBe(2);
        expect(row.pageTo).toHaveBeenCalledTimes(1);
        expect(table.setPage).toHaveBeenCalledWith(2);
        expect(row.getCell('name').edit).toHaveBeenCalledTimes(1);
    });

    test('addRow with pagination and a full last page creates and opens the new last page', async () => {
        const { table, getCurrentPage } = createTableMock({
            rowsData: createRowsData(20),
            pagination: true,
            pageSize: 10
        });
        const crud = new CrudHelper(table);

        const row = await crud.addRow({ id: null, name: 'New row' });

        expect(table.getPageMax()).toBe(3);
        expect(getCurrentPage()).toBe(3);
        expect(row.pageTo).toHaveBeenCalledTimes(1);
        expect(table.setPage).not.toHaveBeenCalled();
        expect(table.getVisibleRows()).toEqual([row]);
        expect(row.getCell('name').edit).toHaveBeenCalledTimes(1);
    });

    test('addRow with pagination and an action column focuses the first editable data cell', async () => {
        const originalDocument = globalThis.document;
        const actionButton = {
            className: 'amb-row-action-button amb-row-action-button--remove-new',
            closest: selector => selector === '.amb-row-action-button' ? actionButton : null
        };
        globalThis.document = { activeElement: actionButton };
        const { table } = createTableMock({
            rowsData: createRowsData(20),
            pagination: true,
            pageSize: 10,
            columns: [
                {
                    title: 'Actions',
                    field: '_actions',
                    editor: 'input',
                    cssClass: 'amb-row-actions',
                    isActionButton: true
                },
                {
                    title: 'Item code',
                    field: 'itemCode',
                    editor: 'input',
                    focusClassName: 'tabulator-editing'
                },
                { title: 'Product name', field: 'productName', editor: 'input' }
            ]
        });
        const crud = new CrudHelper(table);

        try {
            const row = await crud.addRow({ id: null, itemCode: '', productName: '' });

            expect(table.getVisibleRows()).toContain(row);
            expect(row.getCell('_actions').edit).not.toHaveBeenCalled();
            expect(row.getCell('itemCode').edit).toHaveBeenCalledTimes(1);
            expect(row.getCell('productName').edit).not.toHaveBeenCalled();
            expect(globalThis.document.activeElement).toBe(row.getCell('itemCode').focusElement);
            expect(globalThis.document.activeElement.closest('.amb-row-action-button')).toBeNull();
        } finally {
            globalThis.document = originalDocument;
        }
    });

    test('addRow resolves the rendered row again after paginated navigation before focusing', async () => {
        const { table } = createTableMock({
            rowsData: createRowsData(20),
            pagination: true,
            pageSize: 10,
            rerenderOnNavigation: true,
            columns: [
                {
                    title: 'Actions',
                    field: '_actions',
                    editor: 'input',
                    cssClass: 'amb-row-actions'
                },
                { title: 'Item code', field: 'itemCode', editor: 'input' }
            ]
        });
        const crud = new CrudHelper(table);

        const originalRow = await crud.addRow({ id: null, itemCode: '' });
        const renderedRow = table.getVisibleRows()[0];

        expect(originalRow.pageTo).toHaveBeenCalledTimes(1);
        expect(table.setPage).not.toHaveBeenCalled();
        expect(renderedRow).not.toBe(originalRow);
        expect(renderedRow.getData()._ambTempId).toBe(originalRow.getData()._ambTempId);
        expect(originalRow.getCell('itemCode').edit).not.toHaveBeenCalled();
        expect(renderedRow.getCell('_actions').edit).not.toHaveBeenCalled();
        expect(renderedRow.getCell('itemCode').edit).toHaveBeenCalledTimes(1);
    });

    test('multiple paginated addRow calls reveal each new row without changing page size', async () => {
        const { table, getCurrentPage } = createTableMock({
            rowsData: createRowsData(20),
            pagination: true,
            pageSize: 10,
            columns: [
                {
                    title: 'Actions',
                    field: '_actions',
                    editor: 'input',
                    cssClass: 'amb-row-actions'
                },
                { field: 'name', editor: 'input' }
            ]
        });
        const crud = new CrudHelper(table);

        const first = await crud.addRow({ id: null, name: 'First new row' });
        const second = await crud.addRow({ id: null, name: 'Second new row' });
        const third = await crud.addRow({ id: null, name: 'Third new row' });

        expect(getCurrentPage()).toBe(3);
        expect(table.setPage).not.toHaveBeenCalled();
        expect(table.getVisibleRows()).toEqual([first, second, third]);
        expect(first.pageTo).toHaveBeenCalledTimes(1);
        expect(second.pageTo).toHaveBeenCalledTimes(1);
        expect(third.pageTo).toHaveBeenCalledTimes(1);
        expect(first.getCell('_actions').edit).not.toHaveBeenCalled();
        expect(second.getCell('_actions').edit).not.toHaveBeenCalled();
        expect(third.getCell('_actions').edit).not.toHaveBeenCalled();
        expect(first.getCell('name').edit).toHaveBeenCalledTimes(1);
        expect(second.getCell('name').edit).toHaveBeenCalledTimes(1);
        expect(third.getCell('name').edit).toHaveBeenCalledTimes(1);
    });

    test('remove-new keeps a still-valid current page after physical removal', async () => {
        const { table, getCurrentPage } = createTableMock({
            rowsData: [
                ...createRowsData(20),
                { id: null, name: 'Unsaved', _state: ROW_STATE.NEW, _ambTempId: 'amb-temp-new' }
            ],
            pagination: true,
            pageSize: 10,
            currentPage: 2
        });
        const crud = new CrudHelper(table);

        expect(crud.deleteRow('amb-temp-new')).toBe(true);
        await flushPromises();

        expect(getCurrentPage()).toBe(2);
        expect(table.setPage).not.toHaveBeenCalled();
    });

    test('remove-new moves to the last valid page when the current page disappears', async () => {
        const { table, getCurrentPage } = createTableMock({
            rowsData: [
                ...createRowsData(20),
                { id: null, name: 'Unsaved', _state: ROW_STATE.NEW, _ambTempId: 'amb-temp-new' }
            ],
            pagination: true,
            pageSize: 10,
            currentPage: 3
        });
        const crud = new CrudHelper(table);

        expect(crud.deleteRow('amb-temp-new')).toBe(true);
        await flushPromises();

        expect(getCurrentPage()).toBe(2);
        expect(table.setPage).toHaveBeenCalledWith(2);
    });

    test('physical delete after save normalizes pagination, while logical rollback does not move pages', async () => {
        const { table, getCurrentPage } = createTableMock({
            rowsData: [
                ...createRowsData(20),
                { id: 21, name: 'Deleted', _state: ROW_STATE.DELETED }
            ],
            pagination: true,
            pageSize: 10,
            currentPage: 3
        });
        const crud = new CrudHelper(table);

        expect(crud.markRowSaved(21)).toBe(true);
        await flushPromises();

        expect(getCurrentPage()).toBe(2);
        expect(table.setPage).toHaveBeenCalledWith(2);

        table.setPage.mockClear();
        expect(crud.deleteRow(20)).toBe(true);
        expect(crud.rollbackRow(20)).toBe(true);
        await flushPromises();

        expect(getCurrentPage()).toBe(2);
        expect(table.setPage).not.toHaveBeenCalled();
    });

    test('addRow does not throw when the new row has no editable cells', async () => {
        const { table } = createTableMock({
            rowsData: createRowsData(1),
            columns: [
                { title: 'Actions' },
                { field: 'secret', editor: 'input', visible: false },
                { field: 'label' }
            ]
        });
        const crud = new CrudHelper(table);

        const row = await crud.addRow({ id: null, label: 'Read only' });

        expect(row.scrollTo).toHaveBeenCalledWith('bottom', false);
        expect(row.getCell('secret').edit).not.toHaveBeenCalled();
        expect(row.getCell('label').edit).not.toHaveBeenCalled();
    });
});

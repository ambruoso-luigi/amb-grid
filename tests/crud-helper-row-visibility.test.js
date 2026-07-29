import { describe, expect, test, vi } from 'vitest';
import { CrudHelper, ROW_STATE } from '../src/lib/crud-helper.js';

const flushPromises = async () => {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
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
    const cellElement = {
        dataset: {},
        removeAttribute: vi.fn(function (attribute) {
            delete this[attribute];
        })
    };
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
        getElement: () => cellElement,
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
    asyncUpdate = false,
    hasPageTo = true,
    pageToRejects = false,
    rerenderOnNavigation = false
} = {}) => {
    const rows = [];
    const handlers = new Map();
    const updateResolvers = [];
    const tableColumns = columns.map(createColumnMock);
    const moveResult = { operation: 'moved' };
    let lastAddedRows;
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
        addData: vi.fn((batch, addToTop, position) => {
            const addedRows = batch.map(data => createRow(data));
            const positionIndex = rows.indexOf(position);
            const insertionIndex = positionIndex >= 0
                ? positionIndex + (addToTop ? 0 : 1)
                : addToTop
                    ? 0
                    : rows.length;

            rows.splice(insertionIndex, 0, ...addedRows);
            lastAddedRows = addedRows;

            return Promise.resolve(addedRows);
        }),
        clearData: vi.fn(() => {
            rows.splice(0, rows.length);
        }),
        moveRow: vi.fn((row, targetRow, aboveTarget) => {
            const rowIndex = rows.indexOf(row);

            if (rowIndex < 0) return moveResult;

            rows.splice(rowIndex, 1);

            const targetIndex = rows.indexOf(targetRow);

            rows.splice(aboveTarget ? targetIndex : targetIndex + 1, 0, row);

            return moveResult;
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
        selectRow: vi.fn(),
        deselectRow: vi.fn(),
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
            update: vi.fn(patch => {
                const applyPatch = () => {
                    Object.assign(data, patch);

                    return row;
                };

                if (!asyncUpdate) return applyPatch();

                return new Promise(resolve => {
                    updateResolvers.push(() => {
                        resolve(applyPatch());
                    });
                });
            })
        };
        cells = columns.map(column => createCellMock(row, column));

        return row;
    };

    rowsData.forEach(data => rows.push(createRow(data)));

    return {
        table,
        rows,
        moveResult,
        updateResolvers,
        getLastAddedRows: () => lastAddedRows,
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
    test('moveRow preserves delegation and realigns technical numbering without CRUD changes', () => {
        const { table, rows, moveResult } = createTableMock({
            rowsData: [
                { id: 1, name: 'First' },
                { id: 2, name: 'Second' },
                { id: 3, name: 'Third' }
            ]
        });
        const crud = new CrudHelper(table);
        const source = rows[2];
        const target = rows[0];

        expect(crud.moveRow(source, target, true)).toBe(moveResult);
        expect(table.moveRow).toHaveBeenCalledWith(source, target, true);
        expect(rows.map(row => row.getData().id)).toEqual([3, 1, 2]);
        expect(rows.map(row => row.getData()._ambRowNumber)).toEqual([1, 2, 3]);
        expect(rows.map(row => row.getData()._state))
            .toEqual([ROW_STATE.CLEAN, ROW_STATE.CLEAN, ROW_STATE.CLEAN]);
        expect(crud.getSavePayload().changes).toEqual({
            inserted: [],
            updated: [],
            deleted: []
        });

        expect(crud.moveRow(target, target, false)).toBe(false);

        source.getData()._state = ROW_STATE.DELETED;

        expect(crud.moveRow(source, target, false)).toBe(false);
        expect(table.moveRow).toHaveBeenCalledOnce();
    });

    test('addTreeChild prepares managed data, preserves delegation, and rejects deleted parents', () => {
        const { table, rows } = createTableMock({
            rowsData: [
                { id: 15, name: 'Parent' },
                { id: 16, name: 'Relative' }
            ],
            asyncAdd: false
        });
        const crud = new CrudHelper(table);
        const parent = rows[0];
        const relativeTo = rows[1];
        const internalResult = { operation: 'delegated' };
        let childRow;

        relativeTo.getTreeParent = vi.fn(() => parent);
        parent.getTreeChildren = vi.fn(() => childRow ? [childRow] : []);
        parent.addTreeChild = vi.fn(rowData => {
            childRow = {
                getData: vi.fn(() => rowData),
                getTreeChildren: vi.fn(() => [])
            };

            return internalResult;
        });

        const result = crud.addTreeChild(
            parent,
            { id: null, name: 'Child', category: 'application-data' },
            false,
            relativeTo
        );
        const [rowData, addToTop, relativeRow] = parent.addTreeChild.mock.calls[0];

        expect(result).toBe(internalResult);
        expect(rowData).toMatchObject({
            id: null,
            name: 'Child',
            category: 'application-data',
            _state: ROW_STATE.NEW,
            _ambRowNumber: 3
        });
        expect(rowData._ambTempId).toMatch(/^amb-temp-\d+$/);
        expect(addToTop).toBe(false);
        expect(relativeRow).toBe(relativeTo);
        expect(crud.findRowByKey(rowData._ambTempId)).toBe(childRow);
        expect(crud.getSavePayload().changes.inserted).toEqual([
            expect.objectContaining({
                id: null,
                name: 'Child',
                category: 'application-data',
                _ambTempId: rowData._ambTempId,
                _ambRowNumber: 3
            })
        ]);
        expect(parent.getData()._state).toBe(ROW_STATE.CLEAN);

        parent.getData()._state = ROW_STATE.DELETED;

        expect(crud.addTreeChild(parent, { name: 'Rejected' })).toBe(false);
        expect(parent.addTreeChild).toHaveBeenCalledOnce();
    });

    test('rebaseCurrentData turns the current managed dataset into a clean baseline', async () => {
        const { table, rows } = createTableMock({
            rowsData: [
                {
                    id: 0,
                    name: 'Before edit',
                    _state: ROW_STATE.CLEAN,
                    _ambRowNumber: 1
                },
                {
                    id: null,
                    name: 'Unsaved row',
                    _state: ROW_STATE.NEW,
                    _ambTempId: 'amb-temp-12',
                    _ambRowNumber: 2
                },
                {
                    id: 3,
                    name: 'Pending delete',
                    _state: ROW_STATE.DELETED,
                    _ambRowNumber: 3,
                    _originalData: {
                        id: 3,
                        name: 'Original deleted row'
                    }
                }
            ]
        });
        const crud = new CrudHelper(table);
        const subscription = vi.fn();

        crud.addCellValidator('name', 'Name is required', value => Boolean(value));
        crud.on('row-state-changed', subscription);
        crud.updateRowFields(0, { name: 'Edited before replacement' });
        crud.markCellError(0, 'name', 'Old cell error');
        crud.markRowError(0, 'Old row error');
        subscription.mockClear();

        delete rows[1].getData()._ambTempId;
        delete rows[2].getData()._ambRowNumber;

        await crud.rebaseCurrentData();

        const emptyChanges = {
            inserted: [],
            updated: [],
            deleted: []
        };
        const rebasedData = rows.map(row => row.getData());
        const secondTempId = rebasedData[1]._ambTempId;

        expect(rebasedData.map(data => data._state)).toEqual([
            ROW_STATE.CLEAN,
            ROW_STATE.CLEAN,
            ROW_STATE.CLEAN
        ]);
        expect(crud.getChanges()).toEqual(emptyChanges);
        expect(crud.getSavePayload().changes).toEqual(emptyChanges);
        expect(crud.getErrors()).toEqual({
            hasErrors: false,
            rows: [],
            cells: []
        });
        expect(rebasedData.every(data => !Object.hasOwn(data, '_originalData'))).toBe(true);
        expect(rebasedData.map(data => data._ambRowNumber)).toEqual([1, 2, 3]);
        expect(secondTempId).toMatch(/^amb-temp-\d+$/);
        expect(Number(secondTempId.replace('amb-temp-', ''))).toBeGreaterThan(12);
        expect(crud.originalRows.get(0)).toEqual({
            id: 0,
            name: 'Edited before replacement',
            _ambRowNumber: 1
        });
        expect(crud.originalRows.get(secondTempId)).toEqual({
            id: null,
            name: 'Unsaved row',
            _ambTempId: secondTempId,
            _ambRowNumber: 2
        });
        expect(crud.originalRows.get(3)).toEqual({
            id: 3,
            name: 'Pending delete',
            _ambRowNumber: 3
        });
        expect(rows[0].getElement().dataset.rowError).toBeUndefined();
        expect(rows[0].getCell('name').getElement().dataset.cellState).toBeUndefined();
        expect(rows[0].getCell('name').getElement().dataset.cellError).toBeUndefined();
        expect(crud.cellValidators.get('name')).toHaveLength(1);
        expect(crud.eventHandlers.get('row-state-changed')).toContain(subscription);
        expect(subscription).not.toHaveBeenCalled();
        expect(crud.validateRow(0)).toEqual({
            id: 0,
            tempId: undefined,
            rowNumber: 1,
            isValid: true,
            errors: []
        });

        crud.updateRowFields(0, { name: 'Edited after replacement' });

        expect(crud.getChanges().updated).toEqual([
            {
                id: 0,
                tempId: undefined,
                rowNumber: 1,
                before: {
                    id: 0,
                    name: 'Edited before replacement',
                    _ambRowNumber: 1
                },
                after: {
                    id: 0,
                    name: 'Edited after replacement',
                    _ambRowNumber: 1
                },
                changedFields: ['name']
            }
        ]);
    });

    test('rebaseCurrentData registers an empty baseline without resetting CRUD infrastructure', async () => {
        const {
            table,
            rows,
            getLastAddedRows
        } = createTableMock({
            rowsData: [
                {
                    id: 0,
                    name: 'Clean row',
                    _ambRowNumber: 1
                },
                {
                    id: 2,
                    name: 'Row to modify',
                    _ambRowNumber: 2
                },
                {
                    id: null,
                    name: 'New row',
                    _ambTempId: 'amb-temp-12',
                    _ambRowNumber: 3,
                    _state: ROW_STATE.NEW
                },
                {
                    id: 4,
                    name: 'Deleted row',
                    _ambRowNumber: 4,
                    _state: ROW_STATE.DELETED
                }
            ]
        });
        const crud = new CrudHelper(table);
        const validator = vi.fn(value => Boolean(value));
        const subscription = vi.fn();
        const options = crud.options;

        crud.addCellValidator('name', 'Name is required', validator);
        crud.on('row-state-changed', subscription);
        crud.updateRowFields(2, { name: 'Modified row' });
        crud.markCellError(0, 'name', 'Old cell error');
        crud.markRowError(0, 'Old row error');

        expect(rows.map(row => row.getData()._state)).toEqual([
            ROW_STATE.CLEAN,
            ROW_STATE.MODIFIED,
            ROW_STATE.NEW,
            ROW_STATE.DELETED
        ]);
        expect(crud.getChanges().inserted).toHaveLength(1);
        expect(crud.getChanges().updated).toHaveLength(1);
        expect(crud.getChanges().deleted).toHaveLength(1);
        expect(crud.getErrors().hasErrors).toBe(true);

        const nextTempIdNumber = crud.nextTempIdNumber;

        expect(table.clearData()).toBeUndefined();
        expect(table.clearData).toHaveBeenCalledOnce();
        expect(rows).toHaveLength(0);

        await crud.rebaseCurrentData();

        const emptyChanges = {
            inserted: [],
            updated: [],
            deleted: []
        };

        expect(rows).toHaveLength(0);
        expect(crud.originalRows.size).toBe(0);
        expect(crud.modifiedCells.size).toBe(0);
        expect(crud.cellErrors.size).toBe(0);
        expect(crud.rowErrors.size).toBe(0);
        expect(crud.getChanges()).toEqual(emptyChanges);
        expect(crud.getSavePayload().changes).toEqual(emptyChanges);
        expect(crud.getErrors()).toEqual({
            hasErrors: false,
            rows: [],
            cells: []
        });
        expect(crud.cellValidators.get('name')).toEqual([
            expect.objectContaining({
                validateFn: validator
            })
        ]);
        expect(crud.eventHandlers.get('row-state-changed')).toContain(subscription);
        expect(crud.options).toBe(options);
        expect(crud.isDestroyed).toBe(false);
        expect(crud.nextTempIdNumber).toBe(nextTempIdNumber);

        const result = await crud.addData([
            {
                id: null,
                name: 'After clear'
            }
        ], false);
        const addedRows = getLastAddedRows();
        const addedTempId = addedRows[0].getData()._ambTempId;

        expect(result).toBe(addedRows);
        expect(addedTempId).toBe(`amb-temp-${nextTempIdNumber}`);
        expect(addedTempId).not.toBe('amb-temp-12');
        expect(crud.getChanges().inserted).toHaveLength(1);
    });

    test('addData prepares one managed batch and completes only after successful insertion', async () => {
        const {
            table,
            rows,
            getCurrentPage,
            getLastAddedRows
        } = createTableMock({
            rowsData: [
                { id: 0, name: 'Existing first' },
                { id: 2, name: 'Existing second' }
            ],
            pagination: true,
            currentPage: 1
        });
        const crud = new CrudHelper(table);
        const rowsData = [
            { id: null, name: 'Inserted first', application: { value: 1 } },
            { name: 'Inserted second', application: { value: 2 } }
        ];
        const originalRowsData = structuredClone(rowsData);
        const position = rows[0];

        const result = await crud.addData(rowsData, false, position);
        const addedRows = getLastAddedRows();
        const addedData = addedRows.map(row => row.getData());

        expect(result).toBe(addedRows);
        expect(table.addData).toHaveBeenCalledOnce();
        expect(table.addData.mock.calls[0][0]).not.toBe(rowsData);
        expect(table.addData.mock.calls[0][1]).toBe(false);
        expect(table.addData.mock.calls[0][2]).toBe(position);
        expect(rowsData).toEqual(originalRowsData);
        expect(table.addData.mock.calls[0][0][0]).not.toBe(rowsData[0]);
        expect(table.addData.mock.calls[0][0][1]).not.toBe(rowsData[1]);
        expect(addedData.map(data => data._state)).toEqual([
            ROW_STATE.NEW,
            ROW_STATE.NEW
        ]);
        expect(addedData[0]._ambTempId).toMatch(/^amb-temp-\d+$/);
        expect(addedData[1]._ambTempId).toMatch(/^amb-temp-\d+$/);
        expect(addedData[0]._ambTempId).not.toBe(addedData[1]._ambTempId);
        expect(rows.map(row => row.getData().name)).toEqual([
            'Existing first',
            'Inserted first',
            'Inserted second',
            'Existing second'
        ]);
        expect(rows.map(row => row.getData()._ambRowNumber)).toEqual([1, 2, 3, 4]);
        expect(rows[0].getData()._state).toBe(ROW_STATE.CLEAN);
        expect(rows[3].getData()._state).toBe(ROW_STATE.CLEAN);
        expect(crud.getSavePayload().changes).toEqual({
            inserted: addedData.map(data => {
                const { _state, ...payloadData } = data;

                return payloadData;
            }),
            updated: [],
            deleted: []
        });
        expect(getCurrentPage()).toBe(1);
        expect(table.setPage).not.toHaveBeenCalled();
        expect(table.scrollToRow).not.toHaveBeenCalled();
        expect(table.selectRow).not.toHaveBeenCalled();
        expect(table.deselectRow).not.toHaveBeenCalled();
        rows.forEach(row => {
            expect(row.scrollTo).not.toHaveBeenCalled();
            row.getCells().forEach(cell => {
                expect(cell.edit).not.toHaveBeenCalled();
            });
        });

        const rejection = new Error('bulk insertion failed');

        rows.forEach(row => row.update.mockClear());
        table.addData.mockRejectedValueOnce(rejection);

        await expect(crud.addData(
            [{ id: null, name: 'Rejected' }],
            true,
            position
        )).rejects.toBe(rejection);
        rows.forEach(row => {
            expect(row.update).not.toHaveBeenCalled();
        });
        expect(table.setPage).not.toHaveBeenCalled();
        expect(table.scrollToRow).not.toHaveBeenCalled();
        expect(table.selectRow).not.toHaveBeenCalled();
        expect(table.deselectRow).not.toHaveBeenCalled();

        position.getData()._state = ROW_STATE.DELETED;
        expect(crud.addData([], false, position)).toBe(false);
        expect(crud.addData({}, false)).toBe(false);

        crud.destroy();
        expect(crud.addData([], false)).toBe(false);

        const unavailable = new CrudHelper({
            getRows: () => [],
            on: vi.fn()
        });

        expect(unavailable.addData([], false)).toBe(false);
    });

    test('updateData applies sanitized managed patches sequentially and stops on rejection', async () => {
        const { table, rows } = createTableMock({
            rowsData: [
                {
                    id: 0,
                    name: 'Persisted original',
                    untouched: 'persisted value',
                    _ambRowNumber: 1
                },
                {
                    id: null,
                    name: 'New original',
                    untouched: 'new value',
                    _ambTempId: 'amb-temp-new',
                    _ambRowNumber: 2,
                    _state: ROW_STATE.NEW
                },
                {
                    id: 3,
                    name: 'Deleted original',
                    untouched: 'deleted value',
                    _ambRowNumber: 3,
                    _state: ROW_STATE.DELETED
                }
            ],
            columns: [
                { field: 'name', editor: 'input' },
                { field: 'untouched', editor: 'input' }
            ]
        });
        const crud = new CrudHelper(table);
        const validator = vi.fn(() => true);
        const rowsData = [
            {
                id: 0,
                name: 'Persisted first patch',
                _ambTempId: 'forged-temp-id',
                _state: ROW_STATE.NEW,
                _originalData: { forged: true },
                _ambRowNumber: 999
            },
            {
                id: null,
                _ambTempId: 'amb-temp-new',
                name: 'New updated',
                _state: ROW_STATE.CLEAN,
                _originalData: { forged: true },
                _ambRowNumber: 998
            },
            {
                id: 3,
                name: 'Deleted changed'
            },
            {
                id: 404,
                name: 'Unknown'
            },
            {
                name: 'Missing identifier'
            },
            {
                id: 0,
                name: 'Persisted final patch'
            },
            {
                id: 0,
                _state: ROW_STATE.CLEAN
            }
        ];
        const originalRowsData = structuredClone(rowsData);

        crud.addCellValidator('name', 'Name is required', validator);

        await expect(crud.updateData(rowsData)).resolves.toBeUndefined();

        expect(rowsData).toEqual(originalRowsData);
        expect(rows).toHaveLength(3);
        expect(rows[0].getData()).toMatchObject({
            id: 0,
            name: 'Persisted final patch',
            untouched: 'persisted value',
            _ambRowNumber: 1,
            _state: ROW_STATE.MODIFIED
        });
        expect(rows[0].getData()._ambTempId).toBeUndefined();
        expect(rows[0].getData()._originalData).toBeUndefined();
        expect(rows[1].getData()).toMatchObject({
            id: null,
            name: 'New updated',
            untouched: 'new value',
            _ambTempId: 'amb-temp-new',
            _ambRowNumber: 2,
            _state: ROW_STATE.NEW
        });
        expect(rows[1].getData()._originalData).toBeUndefined();
        expect(rows[2].getData()).toMatchObject({
            id: 3,
            name: 'Deleted original',
            untouched: 'deleted value',
            _ambRowNumber: 3,
            _state: ROW_STATE.DELETED
        });
        expect(validator.mock.calls.map(([value]) => value)).toEqual([
            'Persisted first patch',
            'New updated',
            'Persisted final patch'
        ]);

        const changes = crud.getChanges();

        expect(changes.inserted).toEqual([
            {
                id: null,
                name: 'New updated',
                untouched: 'new value',
                _ambTempId: 'amb-temp-new',
                _ambRowNumber: 2
            }
        ]);
        expect(changes.updated).toEqual([
            {
                id: 0,
                tempId: undefined,
                rowNumber: 1,
                before: {
                    id: 0,
                    name: 'Persisted original',
                    untouched: 'persisted value',
                    _ambRowNumber: 1
                },
                after: {
                    id: 0,
                    name: 'Persisted final patch',
                    untouched: 'persisted value',
                    _ambRowNumber: 1
                },
                changedFields: ['name']
            }
        ]);
        expect(changes.deleted).toEqual([
            {
                id: 3,
                tempId: undefined,
                rowNumber: 3,
                originalData: {
                    id: 3,
                    name: 'Deleted original',
                    untouched: 'deleted value',
                    _ambRowNumber: 3
                }
            }
        ]);
        expect(crud.getSavePayload().changes).toEqual(changes);
        expect(table.updateData).toBeUndefined();
        expect(crud.updateData({ id: 0, name: 'Invalid container' })).toBe(false);

        const rejection = new Error('managed row update failed');

        validator.mockClear();
        rows.forEach(row => row.update.mockClear());
        rows[0].update.mockRejectedValueOnce(rejection);

        await expect(crud.updateData([
            {
                _ambTempId: 'amb-temp-new',
                name: 'Applied before rejection'
            },
            {
                id: 0,
                name: 'Rejected patch'
            },
            {
                _ambTempId: 'amb-temp-new',
                name: 'Must not run'
            }
        ])).rejects.toBe(rejection);

        expect(rows[1].getData().name).toBe('Applied before rejection');
        expect(rows[0].getData().name).toBe('Persisted final patch');
        expect(rows[0].update).toHaveBeenCalledOnce();
        expect(validator.mock.calls.map(([value]) => value)).toEqual([
            'Applied before rejection'
        ]);
        expect(rows).toHaveLength(3);
    });

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

    test('addRow waits for asynchronous state patching before focusing the editor', async () => {
        const { table, rows, updateResolvers } = createTableMock({
            asyncUpdate: true,
            pagination: true,
            columns: [
                { field: 'name', editor: 'input' }
            ]
        });
        const crud = new CrudHelper(table);

        const addResult = crud.addRow({ id: null, name: 'Pending update' });

        await flushPromises();

        const row = rows[0];

        expect(row.getCell('name').edit).not.toHaveBeenCalled();
        expect(updateResolvers).toHaveLength(1);

        updateResolvers.shift()();

        const resolvedRow = await addResult;

        expect(resolvedRow).toBe(row);
        expect(row.getCell('name').edit).toHaveBeenCalledTimes(1);
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

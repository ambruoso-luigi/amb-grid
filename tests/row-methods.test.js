import { describe, expect, test, vi } from 'vitest';

import { createRowMethods } from '../src/lib/table/controller/row-methods.js';

const createFreezableRow = (overrides = {}) => ({
    freeze: vi.fn(),
    unfreeze: vi.fn(),
    isFrozen: vi.fn(() => false),
    getData: vi.fn(),
    select: vi.fn(),
    deselect: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    ...overrides
});

const createFreezingHarness = ({
    crudRows = new Map(),
    fallbackRows = new Map()
} = {}) => {
    const table = {
        getRow: vi.fn(identifier => fallbackRows.get(identifier) || false),
        freezeRow: vi.fn(),
        unfreezeRow: vi.fn(),
        isRowFrozen: vi.fn(),
        selectRow: vi.fn(),
        deselectRow: vi.fn(),
        setFilter: vi.fn(),
        setSort: vi.fn(),
        setPage: vi.fn(),
        redraw: vi.fn()
    };
    const crud = {
        findRowByKey: vi.fn(identifier => crudRows.get(identifier) || null),
        updateRowFields: vi.fn(),
        addRow: vi.fn(),
        deleteRow: vi.fn()
    };
    const methods = createRowMethods({ table, crud });

    return {
        table,
        crud,
        methods
    };
};

const expectNoFreezingSideEffects = (table, crud) => {
    expect(crud.updateRowFields).not.toHaveBeenCalled();
    expect(crud.addRow).not.toHaveBeenCalled();
    expect(crud.deleteRow).not.toHaveBeenCalled();
    expect(table.freezeRow).not.toHaveBeenCalled();
    expect(table.unfreezeRow).not.toHaveBeenCalled();
    expect(table.isRowFrozen).not.toHaveBeenCalled();
    expect(table.selectRow).not.toHaveBeenCalled();
    expect(table.deselectRow).not.toHaveBeenCalled();
    expect(table.setFilter).not.toHaveBeenCalled();
    expect(table.setSort).not.toHaveBeenCalled();
    expect(table.setPage).not.toHaveBeenCalled();
    expect(table.redraw).not.toHaveBeenCalled();
};

describe('AMB table controller row method group', () => {
    test('exposes exactly the flat row controller methods', () => {
        const methods = createRowMethods({
            table: {},
            crud: {}
        });

        expect(Object.keys(methods).sort()).toEqual([
            'freezeRow',
            'getRow',
            'getRowFromPosition',
            'getRowPosition',
            'getRows',
            'isRowFrozen',
            'scrollToRow',
            'searchRows',
            'unfreezeRow'
        ]);
        expect(Object.values(methods).every(method => typeof method === 'function')).toBe(true);
        expect(methods.rows).toBeUndefined();
        expect(methods.frozenRows).toBeUndefined();
        expect(methods.rowFreezing).toBeUndefined();
        expect(methods.freezeRows).toBeUndefined();
        expect(methods.unfreezeRows).toBeUndefined();
        expect(methods.toggleRowFrozen).toBeUndefined();
    });

    test('resolves row freezing methods through AMB identifiers before engine fallback', () => {
        const backendId = 15;
        const tempId = 'amb-temp-1';
        const zeroId = 0;
        const emptyId = '';
        const identifiers = [backendId, tempId, zeroId, emptyId];
        const operations = [
            {
                name: 'freezeRow',
                rowFactory: label => createFreezableRow({ label })
            },
            {
                name: 'unfreezeRow',
                rowFactory: label => createFreezableRow({ label })
            },
            {
                name: 'isRowFrozen',
                rowFactory: label => createFreezableRow({
                    label,
                    isFrozen: vi.fn(() => true)
                })
            }
        ];

        operations.forEach(operation => {
            const crudRows = new Map(identifiers.map(identifier => [
                identifier,
                operation.rowFactory(`row-${String(identifier)}`)
            ]));
            const { table, crud, methods } = createFreezingHarness({ crudRows });

            identifiers.forEach(identifier => {
                expect(methods[operation.name](identifier)).toBe(true);
                expect(crud.findRowByKey).toHaveBeenLastCalledWith(identifier);
                expect(crud.findRowByKey.mock.calls.at(-1)[0]).toBe(identifier);
            });

            expect(crud.findRowByKey).toHaveBeenCalledTimes(identifiers.length);
            expect(table.getRow).not.toHaveBeenCalled();
            expectNoFreezingSideEffects(table, crud);
        });
    });

    test('uses the engine row lookup fallback without transforming identifiers', () => {
        const lookup = { lookup: 'engine-supported-row' };
        const operations = [
            {
                name: 'freezeRow',
                operation: 'freeze',
                row: createFreezableRow()
            },
            {
                name: 'unfreezeRow',
                operation: 'unfreeze',
                row: createFreezableRow()
            },
            {
                name: 'isRowFrozen',
                operation: 'isFrozen',
                row: createFreezableRow({ isFrozen: vi.fn(() => true) })
            }
        ];

        operations.forEach(({ name, operation, row }) => {
            const { table, crud, methods } = createFreezingHarness({
                fallbackRows: new Map([[lookup, row]])
            });

            expect(methods[name](lookup)).toBe(true);
            expect(crud.findRowByKey).toHaveBeenCalledOnce();
            expect(crud.findRowByKey).toHaveBeenLastCalledWith(lookup);
            expect(crud.findRowByKey.mock.calls[0][0]).toBe(lookup);
            expect(table.getRow).toHaveBeenCalledOnce();
            expect(table.getRow).toHaveBeenLastCalledWith(lookup);
            expect(table.getRow.mock.calls[0][0]).toBe(lookup);
            expect(row[operation]).toHaveBeenCalledOnce();
            expectNoFreezingSideEffects(table, crud);
        });
    });

    test('freezeRow calls only row.freeze once and returns false when unavailable', () => {
        const row = createFreezableRow();
        const missingFreezeRow = createFreezableRow({ freeze: undefined });
        const { table, crud, methods } = createFreezingHarness({
            crudRows: new Map([
                [15, row],
                ['no-freeze', missingFreezeRow]
            ])
        });

        expect(methods.freezeRow(15)).toBe(true);
        expect(row.freeze).toHaveBeenCalledOnce();
        expect(row.unfreeze).not.toHaveBeenCalled();
        expect(row.isFrozen).not.toHaveBeenCalled();

        expect(methods.freezeRow('missing-row')).toBe(false);
        expect(table.getRow).toHaveBeenCalledOnce();
        expect(table.getRow).toHaveBeenLastCalledWith('missing-row');

        expect(methods.freezeRow('no-freeze')).toBe(false);
        expect(missingFreezeRow.unfreeze).not.toHaveBeenCalled();
        expect(missingFreezeRow.isFrozen).not.toHaveBeenCalled();
        expectNoFreezingSideEffects(table, crud);
    });

    test('unfreezeRow calls only row.unfreeze once and returns false when unavailable', () => {
        const row = createFreezableRow();
        const missingUnfreezeRow = createFreezableRow({ unfreeze: undefined });
        const { table, crud, methods } = createFreezingHarness({
            crudRows: new Map([
                [15, row],
                ['no-unfreeze', missingUnfreezeRow]
            ])
        });

        expect(methods.unfreezeRow(15)).toBe(true);
        expect(row.unfreeze).toHaveBeenCalledOnce();
        expect(row.freeze).not.toHaveBeenCalled();
        expect(row.isFrozen).not.toHaveBeenCalled();

        expect(methods.unfreezeRow('missing-row')).toBe(false);
        expect(table.getRow).toHaveBeenCalledOnce();
        expect(table.getRow).toHaveBeenLastCalledWith('missing-row');

        expect(methods.unfreezeRow('no-unfreeze')).toBe(false);
        expect(missingUnfreezeRow.freeze).not.toHaveBeenCalled();
        expect(missingUnfreezeRow.isFrozen).not.toHaveBeenCalled();
        expectNoFreezingSideEffects(table, crud);
    });

    test('isRowFrozen calls only row.isFrozen once and forwards boolean results', () => {
        const frozenRow = createFreezableRow({ isFrozen: vi.fn(() => true) });
        const movableRow = createFreezableRow({ isFrozen: vi.fn(() => false) });
        const missingIsFrozenRow = createFreezableRow({ isFrozen: undefined });
        const { table, crud, methods } = createFreezingHarness({
            crudRows: new Map([
                ['frozen', frozenRow],
                ['movable', movableRow],
                ['no-is-frozen', missingIsFrozenRow]
            ])
        });

        expect(methods.isRowFrozen('frozen')).toBe(true);
        expect(frozenRow.isFrozen).toHaveBeenCalledOnce();
        expect(frozenRow.freeze).not.toHaveBeenCalled();
        expect(frozenRow.unfreeze).not.toHaveBeenCalled();

        expect(methods.isRowFrozen('movable')).toBe(false);
        expect(movableRow.isFrozen).toHaveBeenCalledOnce();
        expect(movableRow.freeze).not.toHaveBeenCalled();
        expect(movableRow.unfreeze).not.toHaveBeenCalled();

        expect(methods.isRowFrozen('missing-row')).toBe(false);
        expect(table.getRow).toHaveBeenCalledOnce();
        expect(table.getRow).toHaveBeenLastCalledWith('missing-row');

        expect(methods.isRowFrozen('no-is-frozen')).toBe(false);
        expect(missingIsFrozenRow.freeze).not.toHaveBeenCalled();
        expect(missingIsFrozenRow.unfreeze).not.toHaveBeenCalled();
        expectNoFreezingSideEffects(table, crud);
    });

    test('searches row components without touching CRUD or persistent grid state', () => {
        const firstRow = {
            type: 'first-row',
            getData: vi.fn()
        };
        const secondRow = {
            type: 'second-row',
            getData: vi.fn()
        };
        const rows = [firstRow, secondRow];
        const emptyRows = [];
        const customFilter = (data, params) => data.age >= params.minimum;
        const params = { minimum: 18 };
        const filterGroups = [
            { field: 'status', type: '=', value: 'active' },
            [
                { field: 'role', type: '=', value: 'admin' },
                { field: 'role', type: '=', value: 'editor' }
            ]
        ];
        const table = {
            searchRows: vi.fn()
                .mockReturnValueOnce(rows)
                .mockReturnValueOnce(rows)
                .mockReturnValueOnce(emptyRows),
            getRows: vi.fn(),
            getRow: vi.fn(),
            setFilter: vi.fn(),
            addFilter: vi.fn(),
            removeFilter: vi.fn(),
            clearFilter: vi.fn(),
            refreshFilter: vi.fn(),
            setHeaderFilterValue: vi.fn(),
            clearHeaderFilter: vi.fn(),
            setSort: vi.fn(),
            setPage: vi.fn(),
            selectRow: vi.fn(),
            deselectRow: vi.fn()
        };
        const crud = {
            findRowByKey: vi.fn(),
            updateRowFields: vi.fn(),
            deleteRow: vi.fn(),
            rollbackRow: vi.fn()
        };
        const methods = createRowMethods({ table, crud });

        expect(methods.searchRows('status', '=', 'active')).toBe(rows);
        expect(table.searchRows).toHaveBeenCalledOnce();
        expect(table.searchRows).toHaveBeenLastCalledWith('status', '=', 'active');
        expect(rows[0]).toBe(firstRow);
        expect(rows[1]).toBe(secondRow);

        expect(methods.searchRows(customFilter, params)).toBe(rows);
        expect(table.searchRows).toHaveBeenCalledTimes(2);
        expect(table.searchRows).toHaveBeenLastCalledWith(customFilter, params);
        expect(table.searchRows.mock.calls[1][0]).toBe(customFilter);
        expect(table.searchRows.mock.calls[1][1]).toBe(params);

        expect(methods.searchRows(filterGroups)).toBe(emptyRows);
        expect(table.searchRows).toHaveBeenCalledTimes(3);
        expect(table.searchRows).toHaveBeenLastCalledWith(filterGroups);
        expect(table.searchRows.mock.calls[2][0]).toBe(filterGroups);
        expect(firstRow.getData).not.toHaveBeenCalled();
        expect(secondRow.getData).not.toHaveBeenCalled();
        expect(table.getRows).not.toHaveBeenCalled();
        expect(table.getRow).not.toHaveBeenCalled();
        expect(table.setFilter).not.toHaveBeenCalled();
        expect(table.addFilter).not.toHaveBeenCalled();
        expect(table.removeFilter).not.toHaveBeenCalled();
        expect(table.clearFilter).not.toHaveBeenCalled();
        expect(table.refreshFilter).not.toHaveBeenCalled();
        expect(table.setHeaderFilterValue).not.toHaveBeenCalled();
        expect(table.clearHeaderFilter).not.toHaveBeenCalled();
        expect(table.setSort).not.toHaveBeenCalled();
        expect(table.setPage).not.toHaveBeenCalled();
        expect(table.selectRow).not.toHaveBeenCalled();
        expect(table.deselectRow).not.toHaveBeenCalled();
        expect(crud.findRowByKey).not.toHaveBeenCalled();
        expect(crud.updateRowFields).not.toHaveBeenCalled();
        expect(crud.deleteRow).not.toHaveBeenCalled();
        expect(crud.rollbackRow).not.toHaveBeenCalled();
    });

    test('scrolls to backend and temporary AMB rows without transforming the promise', () => {
        const savedRow = { type: 'saved-row' };
        const tempRow = { type: 'temp-row' };
        const backendPromise = Promise.resolve();
        const tempPromise = Promise.resolve('scrolled');
        const table = {
            scrollToRow: vi.fn()
                .mockReturnValueOnce(backendPromise)
                .mockReturnValueOnce(tempPromise),
            setPageToRow: vi.fn(),
            setPage: vi.fn(),
            nextPage: vi.fn(),
            previousPage: vi.fn(),
            selectRow: vi.fn(),
            getData: vi.fn(),
            updateData: vi.fn()
        };
        const crud = {
            findRowByKey: vi.fn(identifier => {
                if (identifier === 15) return savedRow;
                if (identifier === 'amb-temp-1') return tempRow;

                return null;
            }),
            updateRowFields: vi.fn(),
            deleteRow: vi.fn(),
            rollbackRow: vi.fn(),
            validateRow: vi.fn()
        };
        const methods = createRowMethods({ table, crud });

        expect(methods.scrollToRow(15, 'center', false)).toBe(backendPromise);
        expect(crud.findRowByKey).toHaveBeenCalledOnce();
        expect(crud.findRowByKey).toHaveBeenLastCalledWith(15);
        expect(table.scrollToRow).toHaveBeenCalledOnce();
        expect(table.scrollToRow).toHaveBeenLastCalledWith(savedRow, 'center', false);
        expect(table.scrollToRow.mock.calls[0][0]).toBe(savedRow);
        expect(table.scrollToRow.mock.calls[0][2]).toBe(false);

        expect(methods.scrollToRow('amb-temp-1', 'nearest', true)).toBe(tempPromise);
        expect(crud.findRowByKey).toHaveBeenCalledTimes(2);
        expect(crud.findRowByKey).toHaveBeenLastCalledWith('amb-temp-1');
        expect(table.scrollToRow).toHaveBeenCalledTimes(2);
        expect(table.scrollToRow).toHaveBeenLastCalledWith(tempRow, 'nearest', true);
        expect(table.scrollToRow.mock.calls[1][0]).toBe(tempRow);
        expect(table.scrollToRow.mock.calls[1][2]).toBe(true);
        expect(table.setPageToRow).not.toHaveBeenCalled();
        expect(table.setPage).not.toHaveBeenCalled();
        expect(table.nextPage).not.toHaveBeenCalled();
        expect(table.previousPage).not.toHaveBeenCalled();
        expect(table.selectRow).not.toHaveBeenCalled();
        expect(table.getData).not.toHaveBeenCalled();
        expect(table.updateData).not.toHaveBeenCalled();
        expect(crud.updateRowFields).not.toHaveBeenCalled();
        expect(crud.deleteRow).not.toHaveBeenCalled();
        expect(crud.rollbackRow).not.toHaveBeenCalled();
        expect(crud.validateRow).not.toHaveBeenCalled();
    });

    test('falls back to the original lookup and preserves rejected promises', () => {
        const rowComponent = {
            type: 'row-component',
            select: vi.fn(),
            scrollTo: vi.fn(),
            pageTo: vi.fn()
        };
        const domLookup = { nodeType: 1 };
        const rowPromise = Promise.resolve();
        const lookupPromise = Promise.resolve();
        const error = new Error('row scroll failed');
        const rejectedPromise = Promise.reject(error);

        rejectedPromise.catch(() => {});

        const table = {
            scrollToRow: vi.fn()
                .mockReturnValueOnce(rowPromise)
                .mockReturnValueOnce(lookupPromise)
                .mockReturnValueOnce(rejectedPromise),
            setPageToRow: vi.fn(),
            setPage: vi.fn(),
            selectRow: vi.fn(),
            deselectRow: vi.fn(),
            getRows: vi.fn(),
            getRow: vi.fn(),
            setFilter: vi.fn(),
            setSort: vi.fn()
        };
        const crud = {
            findRowByKey: vi.fn(() => null),
            updateRowFields: vi.fn(),
            deleteRow: vi.fn(),
            rollbackRow: vi.fn()
        };
        const methods = createRowMethods({ table, crud });

        expect(methods.scrollToRow(rowComponent, 'bottom', false)).toBe(rowPromise);
        expect(crud.findRowByKey).toHaveBeenCalledOnce();
        expect(crud.findRowByKey).toHaveBeenLastCalledWith(rowComponent);
        expect(table.scrollToRow).toHaveBeenCalledOnce();
        expect(table.scrollToRow).toHaveBeenLastCalledWith(rowComponent, 'bottom', false);
        expect(table.scrollToRow.mock.calls[0][0]).toBe(rowComponent);
        expect(table.scrollToRow.mock.calls[0][2]).toBe(false);

        expect(methods.scrollToRow(domLookup, 'top')).toBe(lookupPromise);
        expect(crud.findRowByKey).toHaveBeenCalledTimes(2);
        expect(crud.findRowByKey).toHaveBeenLastCalledWith(domLookup);
        expect(table.scrollToRow).toHaveBeenCalledTimes(2);
        expect(table.scrollToRow).toHaveBeenLastCalledWith(domLookup, 'top');
        expect(table.scrollToRow.mock.calls[1][0]).toBe(domLookup);

        expect(methods.scrollToRow('missing-row')).toBe(rejectedPromise);
        expect(crud.findRowByKey).toHaveBeenCalledTimes(3);
        expect(crud.findRowByKey).toHaveBeenLastCalledWith('missing-row');
        expect(table.scrollToRow).toHaveBeenCalledTimes(3);
        expect(table.scrollToRow).toHaveBeenLastCalledWith('missing-row');
        expect(rowComponent.select).not.toHaveBeenCalled();
        expect(rowComponent.scrollTo).not.toHaveBeenCalled();
        expect(rowComponent.pageTo).not.toHaveBeenCalled();
        expect(table.setPageToRow).not.toHaveBeenCalled();
        expect(table.setPage).not.toHaveBeenCalled();
        expect(table.selectRow).not.toHaveBeenCalled();
        expect(table.deselectRow).not.toHaveBeenCalled();
        expect(table.getRows).not.toHaveBeenCalled();
        expect(table.getRow).not.toHaveBeenCalled();
        expect(table.setFilter).not.toHaveBeenCalled();
        expect(table.setSort).not.toHaveBeenCalled();
        expect(crud.updateRowFields).not.toHaveBeenCalled();
        expect(crud.deleteRow).not.toHaveBeenCalled();
        expect(crud.rollbackRow).not.toHaveBeenCalled();
    });
});

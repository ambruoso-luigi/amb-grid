import { describe, expect, test, vi } from 'vitest';

import { createRowMethods } from '../src/lib/table/controller/row-methods.js';

describe('AMB table controller row method group', () => {
    test('exposes exactly the flat row controller methods', () => {
        const methods = createRowMethods({
            table: {},
            crud: {}
        });

        expect(Object.keys(methods).sort()).toEqual([
            'getRow',
            'getRowFromPosition',
            'getRowPosition',
            'getRows',
            'scrollToRow',
            'searchRows'
        ]);
        expect(Object.values(methods).every(method => typeof method === 'function')).toBe(true);
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

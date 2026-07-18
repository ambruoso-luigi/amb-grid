import { describe, expect, test, vi } from 'vitest';

import { createSortMethods } from '../src/lib/table/controller/sort-methods.js';

describe('AMB table controller sort method group', () => {
    test('exposes exactly the flat sorting controller methods', () => {
        const methods = createSortMethods({
            table: {}
        });

        expect(Object.keys(methods).sort()).toEqual([
            'clearSort',
            'getSorters',
            'setSort'
        ]);
        expect(Object.values(methods).every(method => typeof method === 'function')).toBe(true);
    });

    test('returns current sorters without cloning or calculating them', () => {
        const columnComponent = { field: 'name' };
        const sorter = { column: columnComponent, field: 'name', dir: 'asc' };
        const sorters = [sorter];
        const table = {
            getSorters: vi.fn(() => sorters),
            setSort: vi.fn(),
            clearSort: vi.fn(),
            getColumns: vi.fn(),
            getColumn: vi.fn(),
            setFilter: vi.fn(),
            refreshFilter: vi.fn(),
            setPage: vi.fn()
        };
        const methods = createSortMethods({ table });

        expect(methods.getSorters()).toBe(sorters);
        expect(table.getSorters).toHaveBeenCalledOnce();
        expect(table.getSorters).toHaveBeenCalledWith();
        expect(sorters[0]).toBe(sorter);
        expect(sorters[0].column).toBe(columnComponent);

        const emptySorters = [];

        table.getSorters.mockReturnValueOnce(emptySorters);
        expect(methods.getSorters()).toBe(emptySorters);
        expect(table.getSorters).toHaveBeenCalledTimes(2);
        expect(table.setSort).not.toHaveBeenCalled();
        expect(table.clearSort).not.toHaveBeenCalled();
        expect(table.getColumns).not.toHaveBeenCalled();
        expect(table.getColumn).not.toHaveBeenCalled();
        expect(table.setFilter).not.toHaveBeenCalled();
        expect(table.refreshFilter).not.toHaveBeenCalled();
        expect(table.setPage).not.toHaveBeenCalled();
    });

    test('applies sort arguments unchanged', () => {
        const columnComponent = { field: 'age' };
        const sorters = [
            { column: 'name', dir: 'asc' },
            { column: columnComponent, dir: 'desc' }
        ];
        const firstResult = { sorted: 'single' };
        const secondResult = { sorted: 'multi' };
        const table = {
            setSort: vi.fn()
                .mockReturnValueOnce(firstResult)
                .mockReturnValueOnce(secondResult),
            getSorters: vi.fn(),
            clearSort: vi.fn(),
            setFilter: vi.fn(),
            clearFilter: vi.fn(),
            setPage: vi.fn(),
            addFilter: vi.fn()
        };
        const methods = createSortMethods({ table });

        expect(methods.setSort('name', 'asc')).toBe(firstResult);
        expect(table.setSort).toHaveBeenCalledOnce();
        expect(table.setSort).toHaveBeenLastCalledWith('name', 'asc');

        expect(methods.setSort(sorters)).toBe(secondResult);
        expect(table.setSort).toHaveBeenCalledTimes(2);
        expect(table.setSort).toHaveBeenLastCalledWith(sorters);
        expect(table.setSort.mock.calls[1][0]).toBe(sorters);
        expect(table.setSort.mock.calls[1][0][0]).toBe(sorters[0]);
        expect(table.setSort.mock.calls[1][0][1].column).toBe(columnComponent);
        expect(table.getSorters).not.toHaveBeenCalled();
        expect(table.clearSort).not.toHaveBeenCalled();
        expect(table.setFilter).not.toHaveBeenCalled();
        expect(table.clearFilter).not.toHaveBeenCalled();
        expect(table.addFilter).not.toHaveBeenCalled();
        expect(table.setPage).not.toHaveBeenCalled();
    });

    test('clears sorters directly without side effects', () => {
        const result = { cleared: true };
        const table = {
            clearSort: vi.fn(() => result),
            setSort: vi.fn(),
            getSorters: vi.fn(),
            clearFilter: vi.fn(),
            refreshFilter: vi.fn(),
            setPage: vi.fn()
        };
        const methods = createSortMethods({ table });

        expect(methods.clearSort()).toBe(result);
        expect(table.clearSort).toHaveBeenCalledOnce();
        expect(table.clearSort).toHaveBeenCalledWith();
        expect(table.setSort).not.toHaveBeenCalled();
        expect(table.getSorters).not.toHaveBeenCalled();
        expect(table.clearFilter).not.toHaveBeenCalled();
        expect(table.refreshFilter).not.toHaveBeenCalled();
        expect(table.setPage).not.toHaveBeenCalled();
    });
});

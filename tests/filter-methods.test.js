import { describe, expect, test, vi } from 'vitest';

import { createFilterMethods } from '../src/lib/table/controller/filter-methods.js';

describe('AMB table controller filter method group', () => {
    test('exposes exactly the flat header filter controller methods', () => {
        const methods = createFilterMethods({
            table: {}
        });

        expect(Object.keys(methods).sort()).toEqual([
            'clearHeaderFilter',
            'getHeaderFilterValue',
            'getHeaderFilters',
            'refreshFilter',
            'setHeaderFilterFocus',
            'setHeaderFilterValue'
        ]);
        expect(Object.values(methods).every(method => typeof method === 'function')).toBe(true);
    });

    test('forwards arguments and return values without interacting with other layers', () => {
        const headerFilters = [{ field: 'name', value: 'Mario' }];
        const columnLookup = { field: 'name' };
        const elementLookup = { element: 'header-filter' };
        const updateResult = { updated: true };
        const focusResult = { focused: true };
        const clearResult = { cleared: true };
        const refreshResult = { refreshed: true };
        const table = {
            getHeaderFilters: vi.fn(() => headerFilters),
            getHeaderFilterValue: vi.fn(lookup => (lookup === 'false-field' ? false : 0)),
            setHeaderFilterValue: vi.fn(() => updateResult),
            setHeaderFilterFocus: vi.fn(() => focusResult),
            clearHeaderFilter: vi.fn(() => clearResult),
            refreshFilter: vi.fn(() => refreshResult),
            getFilters: vi.fn(),
            clearFilter: vi.fn(),
            setFilter: vi.fn(),
            getColumn: vi.fn()
        };
        const crud = {
            findRowByKey: vi.fn()
        };
        const searchController = {
            setSearchQuery: vi.fn()
        };
        const methods = createFilterMethods({ table });

        expect(methods.getHeaderFilters()).toBe(headerFilters);
        expect(table.getHeaderFilters).toHaveBeenCalledWith();

        expect(methods.getHeaderFilterValue('false-field')).toBe(false);
        expect(table.getHeaderFilterValue).toHaveBeenLastCalledWith('false-field');
        expect(methods.getHeaderFilterValue(columnLookup)).toBe(0);
        expect(table.getHeaderFilterValue).toHaveBeenLastCalledWith(columnLookup);

        expect(methods.setHeaderFilterValue(columnLookup, '')).toBe(updateResult);
        expect(table.setHeaderFilterValue).toHaveBeenLastCalledWith(columnLookup, '');
        expect(methods.setHeaderFilterValue(elementLookup, undefined)).toBe(updateResult);
        expect(table.setHeaderFilterValue).toHaveBeenLastCalledWith(elementLookup, undefined);

        expect(methods.setHeaderFilterFocus(elementLookup)).toBe(focusResult);
        expect(table.setHeaderFilterFocus).toHaveBeenLastCalledWith(elementLookup);

        expect(methods.clearHeaderFilter()).toBe(clearResult);
        expect(table.clearHeaderFilter).toHaveBeenCalledOnce();
        expect(table.clearHeaderFilter).toHaveBeenCalledWith();

        expect(methods.refreshFilter()).toBe(refreshResult);
        expect(table.refreshFilter).toHaveBeenCalledOnce();
        expect(table.refreshFilter).toHaveBeenCalledWith();

        expect(table.getFilters).not.toHaveBeenCalled();
        expect(table.clearFilter).not.toHaveBeenCalled();
        expect(table.setFilter).not.toHaveBeenCalled();
        expect(table.getColumn).not.toHaveBeenCalled();
        expect(crud.findRowByKey).not.toHaveBeenCalled();
        expect(searchController.setSearchQuery).not.toHaveBeenCalled();
    });
});

import { describe, expect, test, vi } from 'vitest';

import { createFilterMethods } from '../src/lib/table/controller/filter-methods.js';

describe('AMB table controller filter method group', () => {
    test('exposes exactly the flat filter controller methods', () => {
        const methods = createFilterMethods({
            table: {},
            searchController: null
        });

        expect(Object.keys(methods).sort()).toEqual([
            'addFilter',
            'clearHeaderFilter',
            'getFilters',
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
            addFilter: vi.fn(),
            clearFilter: vi.fn(),
            setFilter: vi.fn(),
            removeFilter: vi.fn(),
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
        expect(table.addFilter).not.toHaveBeenCalled();
        expect(table.clearFilter).not.toHaveBeenCalled();
        expect(table.setFilter).not.toHaveBeenCalled();
        expect(table.removeFilter).not.toHaveBeenCalled();
        expect(table.getColumn).not.toHaveBeenCalled();
        expect(crud.findRowByKey).not.toHaveBeenCalled();
        expect(searchController.setSearchQuery).not.toHaveBeenCalled();
    });

    test('returns table filters unchanged when global search is unavailable', () => {
        const developerFilter = { field: 'status', type: '=', value: 'active' };
        const filters = [developerFilter];
        const table = {
            getFilters: vi.fn(() => filters),
            addFilter: vi.fn(),
            setFilter: vi.fn(),
            removeFilter: vi.fn(),
            clearFilter: vi.fn(),
            refreshFilter: vi.fn(),
            clearHeaderFilter: vi.fn()
        };
        const searchController = {
            excludeSearchFilter: vi.fn()
        };
        const methods = createFilterMethods({
            table,
            searchController: null
        });

        expect(methods.getFilters(true)).toBe(filters);
        expect(table.getFilters).toHaveBeenCalledOnce();
        expect(table.getFilters).toHaveBeenCalledWith(true);
        expect(searchController.excludeSearchFilter).not.toHaveBeenCalled();
        expect(table.addFilter).not.toHaveBeenCalled();
        expect(table.setFilter).not.toHaveBeenCalled();
        expect(table.removeFilter).not.toHaveBeenCalled();
        expect(table.clearFilter).not.toHaveBeenCalled();
        expect(table.refreshFilter).not.toHaveBeenCalled();
        expect(table.clearHeaderFilter).not.toHaveBeenCalled();
    });

    test('excludes only the private search filter when global search is available', () => {
        const developerFunction = vi.fn();
        const developerFilter = { field: 'status', type: '=', value: 'active' };
        const functionFilter = { field: developerFunction, type: 'function' };
        const searchFilter = { field: vi.fn(), type: 'function' };
        const headerFilter = { field: 'name', type: 'like', value: 'Mario' };
        const orGroup = [
            { field: 'city', type: '=', value: 'Rome' },
            { field: 'city', type: '=', value: 'Milan' }
        ];
        const filters = [
            developerFilter,
            functionFilter,
            searchFilter,
            headerFilter,
            orGroup
        ];
        const visibleFilters = [
            developerFilter,
            functionFilter,
            headerFilter,
            orGroup
        ];
        const table = {
            getFilters: vi.fn(() => filters),
            addFilter: vi.fn(),
            setFilter: vi.fn(),
            removeFilter: vi.fn(),
            clearFilter: vi.fn(),
            refreshFilter: vi.fn(),
            clearHeaderFilter: vi.fn()
        };
        const searchController = {
            excludeSearchFilter: vi.fn(() => visibleFilters),
            reapplySearchFilter: vi.fn(),
            getSearchState: vi.fn(),
            setSearchQuery: vi.fn(),
            clearSearch: vi.fn()
        };
        const methods = createFilterMethods({
            table,
            searchController
        });

        expect(methods.getFilters(true)).toBe(visibleFilters);
        expect(table.getFilters).toHaveBeenCalledOnce();
        expect(table.getFilters).toHaveBeenCalledWith(true);
        expect(searchController.excludeSearchFilter).toHaveBeenCalledOnce();
        expect(searchController.excludeSearchFilter).toHaveBeenCalledWith(filters);
        expect(visibleFilters).not.toContain(searchFilter);
        expect(visibleFilters).toContain(developerFilter);
        expect(visibleFilters).toContain(functionFilter);
        expect(visibleFilters).toContain(headerFilter);
        expect(visibleFilters).toContain(orGroup);
        expect(orGroup[0].field).toBe('city');
        expect(searchController.reapplySearchFilter).not.toHaveBeenCalled();
        expect(searchController.getSearchState).not.toHaveBeenCalled();
        expect(searchController.setSearchQuery).not.toHaveBeenCalled();
        expect(searchController.clearSearch).not.toHaveBeenCalled();
        expect(table.addFilter).not.toHaveBeenCalled();
        expect(table.setFilter).not.toHaveBeenCalled();
        expect(table.removeFilter).not.toHaveBeenCalled();
        expect(table.clearFilter).not.toHaveBeenCalled();
        expect(table.refreshFilter).not.toHaveBeenCalled();
        expect(table.clearHeaderFilter).not.toHaveBeenCalled();
    });

    test('adds programmatic filters without rebuilding search or other filters', () => {
        const customFilter = vi.fn();
        const params = { status: 'active' };
        const firstResult = { added: 'field' };
        const secondResult = { added: 'function' };
        const table = {
            addFilter: vi.fn()
                .mockReturnValueOnce(firstResult)
                .mockReturnValueOnce(secondResult),
            getFilters: vi.fn(),
            setFilter: vi.fn(),
            removeFilter: vi.fn(),
            clearFilter: vi.fn(),
            refreshFilter: vi.fn(),
            clearHeaderFilter: vi.fn()
        };
        const searchController = {
            excludeSearchFilter: vi.fn(),
            reapplySearchFilter: vi.fn(),
            setSearchQuery: vi.fn(),
            clearSearch: vi.fn(),
            getSearchState: vi.fn()
        };
        const methods = createFilterMethods({
            table,
            searchController
        });

        expect(methods.addFilter('status', '=', 'active')).toBe(firstResult);
        expect(table.addFilter).toHaveBeenCalledOnce();
        expect(table.addFilter).toHaveBeenLastCalledWith('status', '=', 'active');

        expect(methods.addFilter(customFilter, params)).toBe(secondResult);
        expect(table.addFilter).toHaveBeenCalledTimes(2);
        expect(table.addFilter).toHaveBeenLastCalledWith(customFilter, params);

        expect(table.getFilters).not.toHaveBeenCalled();
        expect(table.setFilter).not.toHaveBeenCalled();
        expect(table.removeFilter).not.toHaveBeenCalled();
        expect(table.clearFilter).not.toHaveBeenCalled();
        expect(table.refreshFilter).not.toHaveBeenCalled();
        expect(table.clearHeaderFilter).not.toHaveBeenCalled();
        expect(searchController.excludeSearchFilter).not.toHaveBeenCalled();
        expect(searchController.reapplySearchFilter).not.toHaveBeenCalled();
        expect(searchController.setSearchQuery).not.toHaveBeenCalled();
        expect(searchController.clearSearch).not.toHaveBeenCalled();
        expect(searchController.getSearchState).not.toHaveBeenCalled();
    });
});

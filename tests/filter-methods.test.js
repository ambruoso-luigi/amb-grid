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
            'clearFilter',
            'clearHeaderFilter',
            'getFilters',
            'getHeaderFilterValue',
            'getHeaderFilters',
            'refreshFilter',
            'removeFilter',
            'setFilter',
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

    test('replaces programmatic filters and reapplies global search after success', () => {
        const customFilter = vi.fn();
        const nestedOrFilters = [
            { field: 'status', type: '=', value: 'pending' },
            { field: 'status', type: '=', value: 'active' }
        ];
        const filterArray = [
            { field: 'status', type: '=', value: 'active' },
            nestedOrFilters
        ];
        const result = { replaced: true };
        const table = {
            setFilter: vi.fn(() => result),
            clearFilter: vi.fn(),
            addFilter: vi.fn(),
            removeFilter: vi.fn(),
            getFilters: vi.fn()
        };
        const searchController = {
            reapplySearchFilter: vi.fn(),
            setSearchQuery: vi.fn(),
            clearSearch: vi.fn(),
            getSearchState: vi.fn()
        };
        const methods = createFilterMethods({
            table,
            searchController
        });

        expect(methods.setFilter('status', '=', 'active')).toBe(result);
        expect(table.setFilter).toHaveBeenCalledOnce();
        expect(table.setFilter).toHaveBeenLastCalledWith('status', '=', 'active');
        expect(searchController.reapplySearchFilter).toHaveBeenCalledOnce();

        table.setFilter.mockClear();
        searchController.reapplySearchFilter.mockClear();

        expect(methods.setFilter(customFilter, { active: true })).toBe(result);
        expect(table.setFilter).toHaveBeenCalledOnce();
        expect(table.setFilter).toHaveBeenLastCalledWith(customFilter, { active: true });
        expect(searchController.reapplySearchFilter).toHaveBeenCalledOnce();

        table.setFilter.mockClear();
        searchController.reapplySearchFilter.mockClear();

        expect(methods.setFilter(filterArray)).toBe(result);
        expect(table.setFilter).toHaveBeenCalledOnce();
        expect(table.setFilter).toHaveBeenLastCalledWith(filterArray);
        expect(table.setFilter.mock.calls[0][0][1]).toBe(nestedOrFilters);
        expect(searchController.reapplySearchFilter).toHaveBeenCalledOnce();
        expect(table.getFilters).not.toHaveBeenCalled();
        expect(table.clearFilter).not.toHaveBeenCalled();
        expect(table.addFilter).not.toHaveBeenCalled();
        expect(table.removeFilter).not.toHaveBeenCalled();
        expect(searchController.setSearchQuery).not.toHaveBeenCalled();
        expect(searchController.clearSearch).not.toHaveBeenCalled();
        expect(searchController.getSearchState).not.toHaveBeenCalled();
    });

    test('does not reapply global search when setFilter fails or search is unavailable', () => {
        const error = new Error('set-filter-failed');
        const table = {
            setFilter: vi.fn(() => {
                throw error;
            })
        };
        const searchController = {
            reapplySearchFilter: vi.fn()
        };
        const methods = createFilterMethods({
            table,
            searchController
        });

        expect(() => methods.setFilter('status', '=', 'active')).toThrow(error);
        expect(searchController.reapplySearchFilter).not.toHaveBeenCalled();

        const result = { replaced: true };
        const tableWithoutSearch = {
            setFilter: vi.fn(() => result)
        };
        const methodsWithoutSearch = createFilterMethods({
            table: tableWithoutSearch,
            searchController: null
        });

        expect(methodsWithoutSearch.setFilter('status', '=', 'active')).toBe(result);
        expect(tableWithoutSearch.setFilter).toHaveBeenCalledOnce();
    });

    test('removes programmatic filters without rebuilding global search', () => {
        const customFilter = vi.fn();
        const params = { active: true };
        const result = { removed: true };
        const table = {
            removeFilter: vi.fn(() => result),
            getFilters: vi.fn(),
            setFilter: vi.fn(),
            addFilter: vi.fn(),
            clearFilter: vi.fn()
        };
        const searchController = {
            reapplySearchFilter: vi.fn(),
            setSearchQuery: vi.fn(),
            clearSearch: vi.fn(),
            getSearchState: vi.fn()
        };
        const methods = createFilterMethods({
            table,
            searchController
        });

        expect(methods.removeFilter('status', '=', 'active')).toBe(result);
        expect(table.removeFilter).toHaveBeenCalledOnce();
        expect(table.removeFilter).toHaveBeenLastCalledWith('status', '=', 'active');

        expect(methods.removeFilter(customFilter, params)).toBe(result);
        expect(table.removeFilter).toHaveBeenCalledTimes(2);
        expect(table.removeFilter).toHaveBeenLastCalledWith(customFilter, params);
        expect(table.getFilters).not.toHaveBeenCalled();
        expect(table.setFilter).not.toHaveBeenCalled();
        expect(table.addFilter).not.toHaveBeenCalled();
        expect(table.clearFilter).not.toHaveBeenCalled();
        expect(searchController.reapplySearchFilter).not.toHaveBeenCalled();
        expect(searchController.setSearchQuery).not.toHaveBeenCalled();
        expect(searchController.clearSearch).not.toHaveBeenCalled();
        expect(searchController.getSearchState).not.toHaveBeenCalled();
    });

    test('clears programmatic filters and reapplies global search after success', () => {
        const firstResult = { cleared: 'programmatic' };
        const secondResult = { cleared: 'headers-too' };
        const table = {
            clearFilter: vi.fn()
                .mockReturnValueOnce(firstResult)
                .mockReturnValueOnce(secondResult),
            getFilters: vi.fn(),
            setFilter: vi.fn(),
            addFilter: vi.fn(),
            removeFilter: vi.fn()
        };
        const searchController = {
            reapplySearchFilter: vi.fn(),
            clearSearch: vi.fn(),
            setSearchQuery: vi.fn(),
            getSearchState: vi.fn()
        };
        const methods = createFilterMethods({
            table,
            searchController
        });

        expect(methods.clearFilter()).toBe(firstResult);
        expect(table.clearFilter).toHaveBeenCalledOnce();
        expect(table.clearFilter).toHaveBeenLastCalledWith();
        expect(searchController.reapplySearchFilter).toHaveBeenCalledOnce();

        expect(methods.clearFilter(true)).toBe(secondResult);
        expect(table.clearFilter).toHaveBeenCalledTimes(2);
        expect(table.clearFilter).toHaveBeenLastCalledWith(true);
        expect(searchController.reapplySearchFilter).toHaveBeenCalledTimes(2);
        expect(table.getFilters).not.toHaveBeenCalled();
        expect(table.setFilter).not.toHaveBeenCalled();
        expect(table.addFilter).not.toHaveBeenCalled();
        expect(table.removeFilter).not.toHaveBeenCalled();
        expect(searchController.clearSearch).not.toHaveBeenCalled();
        expect(searchController.setSearchQuery).not.toHaveBeenCalled();
        expect(searchController.getSearchState).not.toHaveBeenCalled();
    });

    test('does not reapply global search when clearFilter fails', () => {
        const error = new Error('clear-filter-failed');
        const table = {
            clearFilter: vi.fn(() => {
                throw error;
            })
        };
        const searchController = {
            reapplySearchFilter: vi.fn()
        };
        const methods = createFilterMethods({
            table,
            searchController
        });

        expect(() => methods.clearFilter(true)).toThrow(error);
        expect(searchController.reapplySearchFilter).not.toHaveBeenCalled();
    });
});

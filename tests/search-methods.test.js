import { describe, expect, test, vi } from 'vitest';

import { createSearchMethods } from '../src/lib/table/controller/search-methods.js';

describe('AMB table controller search method group', () => {
    test('exposes exactly the flat global-search controller methods', () => {
        const methods = createSearchMethods({
            searchController: null
        });

        expect(Object.keys(methods).sort()).toEqual([
            'clearSearch',
            'getSearchState',
            'setSearchFields',
            'setSearchOptions',
            'setSearchQuery'
        ]);
        expect(Object.values(methods).every(method => typeof method === 'function')).toBe(true);
        expect(methods.isSearchFilter).toBeUndefined();
        expect(methods.excludeSearchFilter).toBeUndefined();
        expect(methods.reapplySearchFilter).toBeUndefined();
        expect(methods.destroy).toBeUndefined();
    });

    test('delegates to the configured search controller without transforming arguments', () => {
        const state = {
            query: 'Mario',
            selectedFields: ['name'],
            caseSensitive: true,
            wholeWord: false
        };
        const fields = ['name', 'city'];
        const options = { wholeWord: true };
        const searchController = {
            setSearchQuery: vi.fn(),
            clearSearch: vi.fn(),
            getSearchState: vi.fn(() => state),
            setSearchFields: vi.fn(),
            setSearchOptions: vi.fn(),
            isSearchFilter: vi.fn(),
            excludeSearchFilter: vi.fn(),
            reapplySearchFilter: vi.fn(),
            destroy: vi.fn()
        };
        const methods = createSearchMethods({ searchController });

        expect(methods.setSearchQuery('Mario')).toBe(true);
        expect(searchController.setSearchQuery).toHaveBeenCalledOnce();
        expect(searchController.setSearchQuery).toHaveBeenCalledWith('Mario');

        expect(methods.clearSearch()).toBe(true);
        expect(searchController.clearSearch).toHaveBeenCalledOnce();
        expect(searchController.clearSearch).toHaveBeenCalledWith();

        expect(methods.getSearchState()).toBe(state);
        expect(searchController.getSearchState).toHaveBeenCalledOnce();
        expect(searchController.getSearchState).toHaveBeenCalledWith();

        expect(methods.setSearchFields(fields)).toBe(true);
        expect(searchController.setSearchFields).toHaveBeenCalledOnce();
        expect(searchController.setSearchFields).toHaveBeenCalledWith(fields);

        expect(methods.setSearchOptions(options)).toBe(true);
        expect(searchController.setSearchOptions).toHaveBeenCalledOnce();
        expect(searchController.setSearchOptions).toHaveBeenCalledWith(options);

        expect(searchController.isSearchFilter).not.toHaveBeenCalled();
        expect(searchController.excludeSearchFilter).not.toHaveBeenCalled();
        expect(searchController.reapplySearchFilter).not.toHaveBeenCalled();
        expect(searchController.destroy).not.toHaveBeenCalled();
    });

    test('returns safe independent defaults when global search is unavailable', () => {
        const methods = createSearchMethods({
            searchController: null
        });
        const fields = ['name'];
        const options = { caseSensitive: true };

        expect(methods.setSearchQuery('Mario')).toBe(false);
        expect(methods.clearSearch()).toBe(false);
        expect(methods.setSearchFields(fields)).toBe(false);
        expect(methods.setSearchOptions(options)).toBe(false);

        const first = methods.getSearchState();
        const second = methods.getSearchState();

        expect(first).toEqual({
            query: '',
            selectedFields: [],
            caseSensitive: false,
            wholeWord: false
        });
        expect(second).toEqual(first);
        expect(first).not.toBe(second);
        expect(first.selectedFields).not.toBe(second.selectedFields);
    });
});

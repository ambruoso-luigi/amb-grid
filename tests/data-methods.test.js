import { describe, expect, test, vi } from 'vitest';

import { createDataMethods } from '../src/lib/table/controller/data-methods.js';

describe('AMB table controller data method group', () => {
    test('exposes exactly the flat data controller methods', () => {
        const methods = createDataMethods({
            table: {}
        });

        expect(Object.keys(methods).sort()).toEqual([
            'getData',
            'getDataCount',
            'searchData'
        ]);
        expect(Object.values(methods).every(method => typeof method === 'function')).toBe(true);
    });

    test('searches row data without changing persistent grid or CRUD state', () => {
        const firstRowData = { id: 1, status: 'active', _ambTempId: 'tmp-1' };
        const secondRowData = { id: 2, status: 'active' };
        const matchingData = [firstRowData, secondRowData];
        const emptyData = [];
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
            searchData: vi.fn()
                .mockReturnValueOnce(matchingData)
                .mockReturnValueOnce(matchingData)
                .mockReturnValueOnce(emptyData),
            getData: vi.fn(),
            getDataCount: vi.fn(),
            setFilter: vi.fn(),
            addFilter: vi.fn(),
            removeFilter: vi.fn(),
            clearFilter: vi.fn(),
            refreshFilter: vi.fn(),
            setHeaderFilterValue: vi.fn(),
            clearHeaderFilter: vi.fn(),
            setSort: vi.fn(),
            setPage: vi.fn(),
            getSavePayload: vi.fn()
        };
        const methods = createDataMethods({ table });

        expect(methods.searchData('age', '>', 18)).toBe(matchingData);
        expect(table.searchData).toHaveBeenCalledOnce();
        expect(table.searchData).toHaveBeenLastCalledWith('age', '>', 18);
        expect(matchingData[0]).toBe(firstRowData);
        expect(matchingData[1]).toBe(secondRowData);

        expect(methods.searchData(customFilter, params)).toBe(matchingData);
        expect(table.searchData).toHaveBeenCalledTimes(2);
        expect(table.searchData).toHaveBeenLastCalledWith(customFilter, params);
        expect(table.searchData.mock.calls[1][0]).toBe(customFilter);
        expect(table.searchData.mock.calls[1][1]).toBe(params);

        expect(methods.searchData(filterGroups)).toBe(emptyData);
        expect(table.searchData).toHaveBeenCalledTimes(3);
        expect(table.searchData).toHaveBeenLastCalledWith(filterGroups);
        expect(table.searchData.mock.calls[2][0]).toBe(filterGroups);
        expect(table.getData).not.toHaveBeenCalled();
        expect(table.getDataCount).not.toHaveBeenCalled();
        expect(table.setFilter).not.toHaveBeenCalled();
        expect(table.addFilter).not.toHaveBeenCalled();
        expect(table.removeFilter).not.toHaveBeenCalled();
        expect(table.clearFilter).not.toHaveBeenCalled();
        expect(table.refreshFilter).not.toHaveBeenCalled();
        expect(table.setHeaderFilterValue).not.toHaveBeenCalled();
        expect(table.clearHeaderFilter).not.toHaveBeenCalled();
        expect(table.setSort).not.toHaveBeenCalled();
        expect(table.setPage).not.toHaveBeenCalled();
        expect(table.getSavePayload).not.toHaveBeenCalled();
    });
});

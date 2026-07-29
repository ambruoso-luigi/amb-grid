import { describe, expect, test, vi } from 'vitest';

import { createDataMethods } from '../src/lib/table/controller/data-methods.js';

describe('AMB table controller data method group', () => {
    test('exposes exactly the flat data controller methods', () => {
        const methods = createDataMethods({
            table: {},
            crud: {}
        });

        expect(Object.keys(methods).sort()).toEqual([
            'addData',
            'clearData',
            'getAjaxUrl',
            'getData',
            'getDataCount',
            'replaceData',
            'searchData',
            'setData',
            'updateData'
        ]);
        expect(Object.values(methods).every(method => typeof method === 'function')).toBe(true);
    });

    test.each([
        {
            methodName: 'setData',
            args: [
                [{ id: 1, name: 'Ada' }],
                { source: 'runtime' },
                undefined
            ]
        },
        {
            methodName: 'replaceData',
            args: [
                [{ id: 1, name: 'Ada' }],
                { source: 'runtime' },
                undefined
            ]
        },
        {
            methodName: 'clearData',
            args: []
        }
    ])(
        '$methodName delegates by identity and rebases only after a successful data operation',
        async ({ methodName, args }) => {
            const resolvedValue = { loaded: true };
            const rejection = new Error(`${methodName} failed`);
            const synchronousError = new Error(`${methodName} threw`);
            const rebaseError = new Error(`${methodName} rebase failed`);
            let resolveOperation;
            const operation = new Promise(resolve => {
                resolveOperation = resolve;
            });
            const table = {
                setData: vi.fn(),
                replaceData: vi.fn(),
                clearData: vi.fn()
            };
            const otherMethodNames = [
                'setData',
                'replaceData',
                'clearData'
            ].filter(name => name !== methodName);
            const crud = {
                rebaseCurrentData: vi.fn(() => Promise.resolve())
            };
            const methods = createDataMethods({ table, crud });

            table[methodName].mockReturnValueOnce(operation);

            const resultPromise = methods[methodName](...args);

            expect(table[methodName]).toHaveBeenCalledOnce();
            expect(table[methodName]).toHaveBeenCalledWith(...args);
            args.forEach((arg, index) => {
                expect(table[methodName].mock.calls[0][index]).toBe(arg);
            });
            otherMethodNames.forEach(name => {
                expect(table[name]).not.toHaveBeenCalled();
            });
            expect(crud.rebaseCurrentData).not.toHaveBeenCalled();

            resolveOperation(resolvedValue);

            await expect(resultPromise).resolves.toBe(resolvedValue);
            expect(crud.rebaseCurrentData).toHaveBeenCalledOnce();

            table[methodName].mockReturnValueOnce(Promise.reject(rejection));

            await expect(methods[methodName](...args)).rejects.toBe(rejection);
            expect(crud.rebaseCurrentData).toHaveBeenCalledOnce();

            table[methodName].mockImplementationOnce(() => {
                throw synchronousError;
            });

            expect(() => methods[methodName](...args)).toThrow(synchronousError);
            expect(crud.rebaseCurrentData).toHaveBeenCalledOnce();

            table[methodName].mockReturnValueOnce(resolvedValue);
            crud.rebaseCurrentData.mockRejectedValueOnce(rebaseError);

            await expect(methods[methodName](...args)).rejects.toBe(rebaseError);
            expect(crud.rebaseCurrentData).toHaveBeenCalledTimes(2);

            const unavailableTableMethod = createDataMethods({
                table: {},
                crud
            });

            expect(unavailableTableMethod[methodName](...args)).toBe(false);

            const availableMethod = vi.fn();
            const unavailableRebase = createDataMethods({
                table: {
                    [methodName]: availableMethod
                },
                crud: {}
            });

            expect(unavailableRebase[methodName](...args)).toBe(false);
            expect(availableMethod).not.toHaveBeenCalled();
        }
    );

    test('addData resolves AMB positions and delegates all insertion arguments by identity', () => {
        const rowsData = [
            { id: null, name: 'First' },
            { id: null, name: 'Second' }
        ];
        const backendRow = { component: 'backend' };
        const temporaryRow = { component: 'temporary' };
        const zeroRow = { component: 'zero' };
        const unresolvedLookup = { lookup: 'internal' };
        const internalResult = Promise.resolve([backendRow, temporaryRow]);
        const crud = {
            addData: vi.fn(() => internalResult),
            findRowByKey: vi.fn(identifier => {
                if (identifier === 15) return backendRow;
                if (identifier === 'amb-temp-8') return temporaryRow;
                if (identifier === 0) return zeroRow;

                return null;
            })
        };
        const methods = createDataMethods({ table: {}, crud });

        expect(methods.addData(rowsData, false, 15)).toBe(internalResult);
        expect(crud.addData).toHaveBeenLastCalledWith(rowsData, false, backendRow);
        expect(crud.addData.mock.calls[0][0]).toBe(rowsData);
        expect(crud.addData.mock.calls[0][1]).toBe(false);

        methods.addData(rowsData, true, 'amb-temp-8');
        expect(crud.addData).toHaveBeenLastCalledWith(rowsData, true, temporaryRow);

        methods.addData(rowsData, 'before', unresolvedLookup);
        expect(crud.addData).toHaveBeenLastCalledWith(
            rowsData,
            'before',
            unresolvedLookup
        );
        expect(crud.addData.mock.calls[2][2]).toBe(unresolvedLookup);

        methods.addData(rowsData, undefined, 0);
        expect(crud.findRowByKey).toHaveBeenLastCalledWith(0);
        expect(crud.addData).toHaveBeenLastCalledWith(rowsData, undefined, zeroRow);

        methods.addData(rowsData, false);
        expect(crud.addData).toHaveBeenLastCalledWith(rowsData, false, undefined);
        expect(crud.findRowByKey).toHaveBeenCalledTimes(4);

        const unavailable = createDataMethods({
            table: {},
            crud: {
                findRowByKey: vi.fn()
            }
        });

        expect(unavailable.addData(rowsData, false, 15)).toBe(false);
    });

    test('updateData delegates the original patch array only through the CRUD helper', () => {
        const rowsData = [
            { id: 0, name: 'Updated' }
        ];
        const result = Promise.resolve();
        const table = {
            updateData: vi.fn()
        };
        const crud = {
            updateData: vi.fn(() => result)
        };
        const methods = createDataMethods({ table, crud });

        expect(methods.updateData(rowsData)).toBe(result);
        expect(crud.updateData).toHaveBeenCalledOnce();
        expect(crud.updateData).toHaveBeenCalledWith(rowsData);
        expect(crud.updateData.mock.calls[0][0]).toBe(rowsData);
        expect(table.updateData).not.toHaveBeenCalled();

        const unavailable = createDataMethods({
            table,
            crud: {}
        });

        expect(unavailable.updateData(rowsData)).toBe(false);
        expect(table.updateData).not.toHaveBeenCalled();
    });

    test('reads the runtime AJAX URL without loading data or building request parameters', () => {
        const crud = {
            getSavePayload: vi.fn(),
            getStateReport: vi.fn(),
            validateRow: vi.fn(),
            validateAll: vi.fn(),
            updateRowFields: vi.fn(),
            findRowByKey: vi.fn(),
            addRow: vi.fn(),
            deleteRow: vi.fn(),
            rollbackRow: vi.fn()
        };
        const table = {
            getAjaxUrl: vi.fn()
                .mockReturnValueOnce('https://example.test/api/people')
                .mockReturnValueOnce('/api/people?department=sales')
                .mockReturnValueOnce(''),
            getData: vi.fn(),
            getDataCount: vi.fn(),
            searchData: vi.fn(),
            setData: vi.fn(),
            replaceData: vi.fn(),
            updateData: vi.fn(),
            addData: vi.fn(),
            clearData: vi.fn(),
            getPage: vi.fn(),
            getPageSize: vi.fn(),
            getFilters: vi.fn(),
            getSorters: vi.fn(),
            setFilter: vi.fn(),
            clearFilter: vi.fn(),
            refreshFilter: vi.fn(),
            setSort: vi.fn(),
            clearSort: vi.fn(),
            setPage: vi.fn(),
            setPageSize: vi.fn(),
            selectRow: vi.fn(),
            deselectRow: vi.fn(),
            redraw: vi.fn(),
            recalc: vi.fn()
        };
        const methods = createDataMethods({ table });

        expect(methods.getAjaxUrl()).toBe('https://example.test/api/people');
        expect(table.getAjaxUrl).toHaveBeenCalledOnce();
        expect(table.getAjaxUrl).toHaveBeenCalledWith();

        expect(methods.getAjaxUrl()).toBe('/api/people?department=sales');
        expect(table.getAjaxUrl).toHaveBeenCalledTimes(2);
        expect(table.getAjaxUrl).toHaveBeenLastCalledWith();

        expect(methods.getAjaxUrl()).toBe('');
        expect(table.getAjaxUrl).toHaveBeenCalledTimes(3);
        expect(table.getAjaxUrl).toHaveBeenLastCalledWith();
        expect(table.getData).not.toHaveBeenCalled();
        expect(table.getDataCount).not.toHaveBeenCalled();
        expect(table.searchData).not.toHaveBeenCalled();
        expect(table.setData).not.toHaveBeenCalled();
        expect(table.replaceData).not.toHaveBeenCalled();
        expect(table.updateData).not.toHaveBeenCalled();
        expect(table.addData).not.toHaveBeenCalled();
        expect(table.clearData).not.toHaveBeenCalled();
        expect(table.getPage).not.toHaveBeenCalled();
        expect(table.getPageSize).not.toHaveBeenCalled();
        expect(table.getFilters).not.toHaveBeenCalled();
        expect(table.getSorters).not.toHaveBeenCalled();
        expect(table.setFilter).not.toHaveBeenCalled();
        expect(table.clearFilter).not.toHaveBeenCalled();
        expect(table.refreshFilter).not.toHaveBeenCalled();
        expect(table.setSort).not.toHaveBeenCalled();
        expect(table.clearSort).not.toHaveBeenCalled();
        expect(table.setPage).not.toHaveBeenCalled();
        expect(table.setPageSize).not.toHaveBeenCalled();
        expect(table.selectRow).not.toHaveBeenCalled();
        expect(table.deselectRow).not.toHaveBeenCalled();
        expect(table.redraw).not.toHaveBeenCalled();
        expect(table.recalc).not.toHaveBeenCalled();

        Object.values(crud).forEach(method => {
            expect(method).not.toHaveBeenCalled();
        });
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

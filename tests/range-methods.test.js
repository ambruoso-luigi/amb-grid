import { describe, expect, test, vi } from 'vitest';

import { createRangeMethods } from '../src/lib/table/controller/range-methods.js';

const forbiddenTableMethodNames = [
    'addRange',
    'getSelectedRows',
    'getSelectedData',
    'selectRow',
    'deselectRow',
    'getData',
    'getRows',
    'getColumns',
    'setData',
    'replaceData',
    'updateData',
    'addData',
    'setFilter',
    'clearFilter',
    'refreshFilter',
    'setSort',
    'clearSort',
    'setPage',
    'setPageSize',
    'redraw',
    'recalc'
];

const forbiddenCrudMethodNames = [
    'getSavePayload',
    'getStateReport',
    'validateRow',
    'validateAll',
    'updateRowFields',
    'findRowByKey',
    'addRow',
    'deleteRow',
    'rollbackRow'
];

const createForbiddenMethods = methodNames => Object.fromEntries(
    methodNames.map(name => [name, vi.fn()])
);

const expectMethodsNotCalled = (target, methodNames) => {
    methodNames.forEach(name => {
        expect(target[name]).not.toHaveBeenCalled();
    });
};

describe('AMB table controller cell-range reading method group', () => {
    test('exposes exactly the flat range controller methods', () => {
        const methods = createRangeMethods({
            table: {}
        });

        expect(Object.keys(methods).sort()).toEqual([
            'getRanges',
            'getRangesData'
        ]);
        expect(Object.values(methods).every(method => typeof method === 'function')).toBe(true);
    });

    test('getRanges returns range components without cloning or reading them', () => {
        const rangeA = {
            type: 'range-a',
            getBounds: vi.fn(),
            getCells: vi.fn(),
            getRows: vi.fn(),
            getColumns: vi.fn(),
            remove: vi.fn(),
            setBounds: vi.fn()
        };
        const rangeB = {
            type: 'range-b',
            getBounds: vi.fn(),
            getCells: vi.fn(),
            getRows: vi.fn(),
            getColumns: vi.fn(),
            remove: vi.fn(),
            setBounds: vi.fn()
        };
        const ranges = [rangeA, rangeB];
        const emptyRanges = [];
        const crud = createForbiddenMethods(forbiddenCrudMethodNames);
        const table = {
            ...createForbiddenMethods(forbiddenTableMethodNames),
            getRanges: vi.fn()
                .mockReturnValueOnce(ranges)
                .mockReturnValueOnce(emptyRanges),
            getRangesData: vi.fn()
        };
        const methods = createRangeMethods({ table });

        const returned = methods.getRanges();

        expect(returned).toBe(ranges);
        expect(returned[0]).toBe(rangeA);
        expect(returned[1]).toBe(rangeB);
        expect(table.getRanges).toHaveBeenCalledOnce();
        expect(table.getRanges).toHaveBeenCalledWith();
        expect(table.getRangesData).not.toHaveBeenCalled();

        [
            rangeA,
            rangeB
        ].forEach(range => {
            expect(range.getBounds).not.toHaveBeenCalled();
            expect(range.getCells).not.toHaveBeenCalled();
            expect(range.getRows).not.toHaveBeenCalled();
            expect(range.getColumns).not.toHaveBeenCalled();
            expect(range.remove).not.toHaveBeenCalled();
            expect(range.setBounds).not.toHaveBeenCalled();
        });

        expect(methods.getRanges()).toBe(emptyRanges);
        expect(table.getRanges).toHaveBeenCalledTimes(2);
        expectMethodsNotCalled(table, forbiddenTableMethodNames);
        expectMethodsNotCalled(crud, forbiddenCrudMethodNames);
    });

    test('getRangesData returns grouped range data without flattening or CRUD semantics', () => {
        const firstRow = {
            name: 'Mario',
            age: 42
        };
        const secondRow = {
            name: 'Anna',
            age: 35
        };
        const firstRangeData = [
            firstRow,
            secondRow
        ];
        const secondRangeData = [
            {
                status: 'active',
                enabled: false,
                count: 0,
                note: ''
            }
        ];
        const rangeData = [
            firstRangeData,
            secondRangeData
        ];
        const emptyRangeData = [];
        const crud = createForbiddenMethods(forbiddenCrudMethodNames);
        const table = {
            ...createForbiddenMethods(forbiddenTableMethodNames),
            getRanges: vi.fn(),
            getRangesData: vi.fn()
                .mockReturnValueOnce(rangeData)
                .mockReturnValueOnce(emptyRangeData)
        };
        const methods = createRangeMethods({ table });

        const returned = methods.getRangesData();

        expect(returned).toBe(rangeData);
        expect(returned[0]).toBe(firstRangeData);
        expect(returned[0][0]).toBe(firstRow);
        expect(returned[0][1]).toBe(secondRow);
        expect(returned[1]).toBe(secondRangeData);
        expect(returned[1][0]).toEqual({
            status: 'active',
            enabled: false,
            count: 0,
            note: ''
        });
        expect(table.getRangesData).toHaveBeenCalledOnce();
        expect(table.getRangesData).toHaveBeenCalledWith();
        expect(table.getRanges).not.toHaveBeenCalled();

        expect(methods.getRangesData()).toBe(emptyRangeData);
        expect(table.getRangesData).toHaveBeenCalledTimes(2);
        expectMethodsNotCalled(table, forbiddenTableMethodNames);
        expectMethodsNotCalled(crud, forbiddenCrudMethodNames);
    });
});

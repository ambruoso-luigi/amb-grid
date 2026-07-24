import { describe, expect, test, vi } from 'vitest';

import { createRangeMethods } from '../src/lib/table/controller/range-methods.js';

const forbiddenTableMethodNames = [
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
            'addRange',
            'getRangeBottomEdge',
            'getRangeBounds',
            'getRangeCells',
            'getRangeColumns',
            'getRangeData',
            'getRangeElement',
            'getRangeLeftEdge',
            'getRangeRightEdge',
            'getRangeRows',
            'getRangeStructuredCells',
            'getRangeTopEdge',
            'getRanges',
            'getRangesData',
            'removeRange',
            'setRangeBounds',
            'setRangeEndBound'
        ]);
        expect(Object.values(methods).every(method => typeof method === 'function')).toBe(true);
    });

    test('range component reads delegate once without arguments and preserve runtime results', () => {
        const element = {
            type: 'range-element'
        };
        const data = [{
            name: 'Mario'
        }];
        const cells = [{
            type: 'cell'
        }];
        const structuredCells = [[cells[0]]];
        const rows = [{
            type: 'row'
        }];
        const columns = [{
            type: 'column'
        }];
        const bounds = {
            start: cells[0],
            end: cells[0]
        };
        const cases = [
            ['getRangeElement', 'getElement', element],
            ['getRangeData', 'getData', data],
            ['getRangeCells', 'getCells', cells],
            ['getRangeStructuredCells', 'getStructuredCells', structuredCells],
            ['getRangeRows', 'getRows', rows],
            ['getRangeColumns', 'getColumns', columns],
            ['getRangeBounds', 'getBounds', bounds],
            ['getRangeTopEdge', 'getTopEdge', 0],
            ['getRangeBottomEdge', 'getBottomEdge', 4],
            ['getRangeLeftEdge', 'getLeftEdge', 0],
            ['getRangeRightEdge', 'getRightEdge', 3]
        ];
        const methods = createRangeMethods({
            table: {}
        });

        cases.forEach(([ambMethodName, rangeMethodName, result]) => {
            const rangeMethod = vi.fn(() => result);
            const range = {
                [rangeMethodName]: rangeMethod
            };

            expect(methods[ambMethodName](range)).toBe(result);
            expect(rangeMethod).toHaveBeenCalledOnce();
            expect(rangeMethod).toHaveBeenCalledWith();
            expect(methods[ambMethodName]()).toBe(false);
            expect(methods[ambMethodName]({})).toBe(false);
        });
    });

    test('range runtime actions delegate once with unchanged arguments and report availability', () => {
        const start = {
            type: 'start-cell'
        };
        const end = {
            type: 'end-cell'
        };
        const cases = [
            ['setRangeBounds', 'setBounds', [start, end]],
            ['setRangeEndBound', 'setEndBound', [end]],
            ['removeRange', 'remove', []]
        ];
        const methods = createRangeMethods({
            table: {}
        });

        cases.forEach(([ambMethodName, rangeMethodName, args]) => {
            const rangeMethod = vi.fn(() => false);
            const range = {
                [rangeMethodName]: rangeMethod
            };

            expect(methods[ambMethodName](range, ...args)).toBe(true);
            expect(rangeMethod).toHaveBeenCalledOnce();
            expect(rangeMethod).toHaveBeenCalledWith(...args);
            args.forEach((arg, index) => {
                expect(rangeMethod.mock.calls[0][index]).toBe(arg);
            });
            expect(methods[ambMethodName]()).toBe(false);
            expect(methods[ambMethodName]({})).toBe(false);
        });
    });

    test('addRange forwards cell components transparently and returns the table range component', () => {
        const topLeftCell = {
            type: 'top-left-cell',
            getRow: vi.fn(),
            getColumn: vi.fn(),
            getElement: vi.fn(),
            focus: vi.fn(),
            edit: vi.fn()
        };
        const bottomRightCell = {
            type: 'bottom-right-cell',
            getRow: vi.fn(),
            getColumn: vi.fn(),
            getElement: vi.fn(),
            focus: vi.fn(),
            edit: vi.fn()
        };
        const rangeComponent = {
            type: 'range-component'
        };
        const crud = createForbiddenMethods(forbiddenCrudMethodNames);
        const table = {
            ...createForbiddenMethods(forbiddenTableMethodNames),
            addRange: vi.fn().mockReturnValueOnce(rangeComponent),
            getRanges: vi.fn(),
            getRangesData: vi.fn()
        };
        const methods = createRangeMethods({ table });

        const returned = methods.addRange(
            topLeftCell,
            bottomRightCell
        );

        expect(returned).toBe(rangeComponent);
        expect(table.addRange).toHaveBeenCalledOnce();
        expect(table.addRange).toHaveBeenCalledWith(
            topLeftCell,
            bottomRightCell
        );
        expect(table.addRange.mock.calls[0][0]).toBe(topLeftCell);
        expect(table.addRange.mock.calls[0][1]).toBe(bottomRightCell);
        expect(table.getRanges).not.toHaveBeenCalled();
        expect(table.getRangesData).not.toHaveBeenCalled();
        expect(topLeftCell._cell).toBeUndefined();
        expect(bottomRightCell._cell).toBeUndefined();

        [
            topLeftCell,
            bottomRightCell
        ].forEach(cell => {
            expect(cell.getRow).not.toHaveBeenCalled();
            expect(cell.getColumn).not.toHaveBeenCalled();
            expect(cell.getElement).not.toHaveBeenCalled();
            expect(cell.focus).not.toHaveBeenCalled();
            expect(cell.edit).not.toHaveBeenCalled();
        });

        expectMethodsNotCalled(table, forbiddenTableMethodNames);
        expectMethodsNotCalled(crud, forbiddenCrudMethodNames);
    });

    test('addRange preserves missing and falsy arguments without fallback', () => {
        const topLeftCell = {
            type: 'top-left-cell'
        };
        const crud = createForbiddenMethods(forbiddenCrudMethodNames);
        const table = {
            ...createForbiddenMethods(forbiddenTableMethodNames),
            addRange: vi.fn()
                .mockReturnValueOnce(false)
                .mockReturnValueOnce(undefined)
                .mockReturnValueOnce(null),
            getRanges: vi.fn(),
            getRangesData: vi.fn()
        };
        const methods = createRangeMethods({ table });

        expect(methods.addRange()).toBe(false);
        expect(methods.addRange(topLeftCell)).toBeUndefined();
        expect(methods.addRange(0, '', false)).toBeNull();

        expect(table.addRange).toHaveBeenCalledTimes(3);
        expect(table.addRange.mock.calls[0]).toEqual([]);
        expect(table.addRange.mock.calls[1]).toEqual([topLeftCell]);
        expect(table.addRange.mock.calls[1][0]).toBe(topLeftCell);
        expect(table.addRange.mock.calls[2]).toEqual([0, '', false]);
        expect(table.getRanges).not.toHaveBeenCalled();
        expect(table.getRangesData).not.toHaveBeenCalled();
        expectMethodsNotCalled(table, forbiddenTableMethodNames);
        expectMethodsNotCalled(crud, forbiddenCrudMethodNames);
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
            addRange: vi.fn(),
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
        expect(table.addRange).not.toHaveBeenCalled();
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
            addRange: vi.fn(),
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
        expect(table.addRange).not.toHaveBeenCalled();
        expectMethodsNotCalled(table, forbiddenTableMethodNames);
        expectMethodsNotCalled(crud, forbiddenCrudMethodNames);
    });
});

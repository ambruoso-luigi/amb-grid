import { describe, expect, test, vi } from 'vitest';

import { createCalculationMethods } from '../src/lib/table/controller/calculation-methods.js';

describe('AMB table controller calculation method group', () => {
    test('exposes exactly the flat calculation controller methods', () => {
        const methods = createCalculationMethods({
            table: {}
        });

        expect(Object.keys(methods).sort()).toEqual([
            'getCalcCell',
            'getCalcCells',
            'getCalcData',
            'getCalcElement',
            'getCalcResults',
            'recalc'
        ]);
        expect(Object.values(methods).every(method => typeof method === 'function')).toBe(true);
    });

    test('calculation component reads delegate with unchanged arguments and preserve runtime results', () => {
        const transform = {
            type: 'transform'
        };
        const column = {
            type: 'column'
        };
        const data = {
            amount: 120
        };
        const element = {
            type: 'calc-element'
        };
        const cells = [];
        const cell = {
            type: 'cell'
        };
        const cases = [
            ['getCalcData', 'getData', [transform], data],
            ['getCalcElement', 'getElement', [], element],
            ['getCalcCells', 'getCells', [], cells],
            ['getCalcCell', 'getCell', [column], cell],
            ['getCalcCell', 'getCell', [column], false]
        ];
        const methods = createCalculationMethods({
            table: {}
        });

        cases.forEach(([ambMethodName, calcMethodName, args, result]) => {
            const calcMethod = vi.fn(() => result);
            const calc = {
                [calcMethodName]: calcMethod
            };

            expect(methods[ambMethodName](calc, ...args)).toBe(result);
            expect(calcMethod).toHaveBeenCalledOnce();
            expect(calcMethod).toHaveBeenCalledWith(...args);
            args.forEach((arg, index) => {
                expect(calcMethod.mock.calls[0][index]).toBe(arg);
            });
            expect(methods[ambMethodName]()).toBe(false);
            expect(methods[ambMethodName]({})).toBe(false);
        });
    });

    test('returns ungrouped calculation results without cloning or recalculating', () => {
        const top = {
            amount: 100,
            quantity: 5,
            zero: 0,
            empty: '',
            disabled: false,
            missing: null,
            unset: undefined
        };
        const bottom = {
            amount: 20,
            quantity: 1
        };
        const results = { top, bottom };
        const table = {
            getCalcResults: vi.fn(() => results),
            recalc: vi.fn(),
            getData: vi.fn(),
            getRows: vi.fn(),
            getColumns: vi.fn(),
            getColumnDefinitions: vi.fn(),
            getSavePayload: vi.fn()
        };
        const methods = createCalculationMethods({ table });
        const returned = methods.getCalcResults();

        expect(returned).toBe(results);
        expect(returned.top).toBe(top);
        expect(returned.bottom).toBe(bottom);
        expect(returned.top.zero).toBe(0);
        expect(returned.top.empty).toBe('');
        expect(returned.top.disabled).toBe(false);
        expect(returned.top.missing).toBeNull();
        expect(returned.top).toHaveProperty('unset', undefined);
        expect(table.getCalcResults).toHaveBeenCalledOnce();
        expect(table.getCalcResults).toHaveBeenCalledWith();
        expect(table.recalc).not.toHaveBeenCalled();
        expect(table.getData).not.toHaveBeenCalled();
        expect(table.getRows).not.toHaveBeenCalled();
        expect(table.getColumns).not.toHaveBeenCalled();
        expect(table.getColumnDefinitions).not.toHaveBeenCalled();
        expect(table.getSavePayload).not.toHaveBeenCalled();
    });

    test('returns grouped calculation results without flattening nested groups', () => {
        const nestedGroup = {
            top: {},
            bottom: {},
            groups: {}
        };
        const group = {
            top: { amount: 100 },
            bottom: { amount: 20 },
            groups: {
                child: nestedGroup
            }
        };
        const results = {
            groupA: group
        };
        const table = {
            getCalcResults: vi.fn(() => results),
            recalc: vi.fn(),
            getData: vi.fn(),
            getRows: vi.fn(),
            getColumns: vi.fn()
        };
        const methods = createCalculationMethods({ table });
        const returned = methods.getCalcResults();

        expect(returned).toBe(results);
        expect(returned.groupA).toBe(group);
        expect(returned.groupA.top).toBe(group.top);
        expect(returned.groupA.bottom).toBe(group.bottom);
        expect(returned.groupA.groups).toBe(group.groups);
        expect(returned.groupA.groups.child).toBe(nestedGroup);
        expect(returned.groupA.groups.child.top).toBe(nestedGroup.top);
        expect(returned.groupA.groups.child.bottom).toBe(nestedGroup.bottom);
        expect(returned.groupA.groups.child.groups).toBe(nestedGroup.groups);
        expect(table.getCalcResults).toHaveBeenCalledOnce();
        expect(table.getCalcResults).toHaveBeenCalledWith();
        expect(table.recalc).not.toHaveBeenCalled();
        expect(table.getData).not.toHaveBeenCalled();
        expect(table.getRows).not.toHaveBeenCalled();
        expect(table.getColumns).not.toHaveBeenCalled();
    });

    test('preserves empty calculation result objects', () => {
        const emptyResults = {
            top: {},
            bottom: {}
        };
        const table = {
            getCalcResults: vi.fn(() => emptyResults),
            recalc: vi.fn()
        };
        const methods = createCalculationMethods({ table });
        const returned = methods.getCalcResults();

        expect(returned).toBe(emptyResults);
        expect(returned.top).toBe(emptyResults.top);
        expect(returned.bottom).toBe(emptyResults.bottom);
        expect(table.recalc).not.toHaveBeenCalled();
    });

    test('recalculates through the grid without returning calculation results', () => {
        const result = { recalculated: true };
        const table = {
            recalc: vi.fn()
                .mockReturnValueOnce(undefined)
                .mockReturnValueOnce(result),
            getCalcResults: vi.fn(),
            getData: vi.fn(),
            getRows: vi.fn(),
            getColumns: vi.fn(),
            redraw: vi.fn(),
            setFilter: vi.fn(),
            addFilter: vi.fn(),
            removeFilter: vi.fn(),
            clearFilter: vi.fn(),
            setSort: vi.fn(),
            clearSort: vi.fn(),
            setPage: vi.fn(),
            nextPage: vi.fn(),
            previousPage: vi.fn(),
            selectRow: vi.fn(),
            deselectRow: vi.fn(),
            getSavePayload: vi.fn(),
            validateRow: vi.fn()
        };
        const methods = createCalculationMethods({ table });

        expect(methods.recalc()).toBeUndefined();
        expect(table.recalc).toHaveBeenCalledOnce();
        expect(table.recalc).toHaveBeenLastCalledWith();

        expect(methods.recalc()).toBe(result);
        expect(table.recalc).toHaveBeenCalledTimes(2);
        expect(table.recalc).toHaveBeenLastCalledWith();
        expect(table.getCalcResults).not.toHaveBeenCalled();
        expect(table.getData).not.toHaveBeenCalled();
        expect(table.getRows).not.toHaveBeenCalled();
        expect(table.getColumns).not.toHaveBeenCalled();
        expect(table.redraw).not.toHaveBeenCalled();
        expect(table.setFilter).not.toHaveBeenCalled();
        expect(table.addFilter).not.toHaveBeenCalled();
        expect(table.removeFilter).not.toHaveBeenCalled();
        expect(table.clearFilter).not.toHaveBeenCalled();
        expect(table.setSort).not.toHaveBeenCalled();
        expect(table.clearSort).not.toHaveBeenCalled();
        expect(table.setPage).not.toHaveBeenCalled();
        expect(table.nextPage).not.toHaveBeenCalled();
        expect(table.previousPage).not.toHaveBeenCalled();
        expect(table.selectRow).not.toHaveBeenCalled();
        expect(table.deselectRow).not.toHaveBeenCalled();
        expect(table.getSavePayload).not.toHaveBeenCalled();
        expect(table.validateRow).not.toHaveBeenCalled();
    });
});

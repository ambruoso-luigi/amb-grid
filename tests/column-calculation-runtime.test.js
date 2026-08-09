import { describe, expect, test, vi } from 'vitest';

import {
    bindDeletedRowCalculationRecalc,
    filterDeletedCalculationRows,
    prepareColumnCalculations
} from '../src/lib/table/column-calculation-runtime.js';

const createRuntime = (calculations = {}) => {
    const columnCalcs = {};

    Object.defineProperty(columnCalcs, 'constructor', {
        value: { calculations }
    });

    return {
        modules: { columnCalcs },
        recalc: vi.fn()
    };
};

describe('CRUD-aware column calculation runtime', () => {
    test('filters values and data in pairs without cloning rows or losing falsy values', () => {
        const rows = [
            { id: 1, value: 0, lifecycle: 'clean' },
            { id: 2, value: false, lifecycle: 'deleted' },
            { id: 3, value: '', lifecycle: 'modified' },
            { id: 4, value: null, lifecycle: 'new' }
        ];
        const values = rows.map(row => row.value);
        const filtered = filterDeletedCalculationRows(
            values,
            rows,
            () => ({ options: { stateField: 'lifecycle' } })
        );

        expect(filtered.values).toEqual([0, '', null]);
        expect(filtered.data).toEqual([rows[0], rows[2], rows[3]]);
        expect(filtered.data[0]).toBe(rows[0]);
        expect(filtered.data[1]).toBe(rows[2]);
        expect(filtered.data[2]).toBe(rows[3]);
        expect(rows).toHaveLength(4);
    });

    test.each([
        'count',
        'concat',
        'unique',
        'sum',
        'avg',
        'min',
        'max'
    ])(
        'delegates built-in %s with deleted rows and empty values filtered in pairs',
        name => {
            const registered = vi.fn(() => `${name}-result`);
            const table = createRuntime({ [name]: registered });
            const staticParams = { precision: false };
            const rows = [
                { id: 1, amount: 0, _state: 'clean' },
                { id: 2, amount: '', _state: 'clean' },
                { id: 3, amount: null, _state: 'modified' },
                { id: 4, amount: undefined, _state: 'new' },
                { id: 5, amount: false, _state: 'saved' },
                { id: 6, amount: 5, _state: 'clean' },
                { id: 7, amount: 20, _state: 'deleted' }
            ];
            const values = rows.map(row => row.amount);
            const [column] = prepareColumnCalculations(
                [{ field: 'amount', topCalc: name, topCalcParams: staticParams }],
                () => ({ options: { stateField: '_state' } }),
                () => table
            );

            expect(column.topCalcParams).toBe(staticParams);
            expect(column.topCalc(values, rows, staticParams))
                .toBe(`${name}-result`);
            expect(registered).toHaveBeenCalledWith(
                [0, false, 5],
                [rows[0], rows[4], rows[5]],
                staticParams
            );
            expect(registered.mock.calls[0][1][0]).toBe(rows[0]);
            expect(registered.mock.calls[0][1][1]).toBe(rows[4]);
            expect(registered.mock.calls[0][1][2]).toBe(rows[5]);
            expect(values).toEqual([0, '', null, undefined, false, 5, 20]);
            expect(rows).toHaveLength(7);
        }
    );

    test('preserves empty values for registered non-built-in calculations', () => {
        const registeredExtension = vi.fn();
        const table = createRuntime({ registeredExtension });
        const rows = [
            { id: 1, _state: 'clean' },
            { id: 2, _state: 'clean' },
            { id: 3, _state: 'modified' },
            { id: 4, _state: 'new' },
            { id: 5, _state: 'saved' },
            { id: 6, _state: 'clean' },
            { id: 7, _state: 'deleted' }
        ];
        const values = [0, '', null, undefined, false, 5, 20];
        const [column] = prepareColumnCalculations(
            [{ topCalc: 'registeredExtension' }],
            () => null,
            () => table
        );

        column.topCalc(values, rows);

        expect(registeredExtension).toHaveBeenCalledWith(
            [0, '', null, undefined, false, 5],
            rows.slice(0, 6),
            undefined
        );
        expect(values).toEqual([0, '', null, undefined, false, 5, 20]);
        expect(rows).toHaveLength(7);
    });

    test('preserves empty values for custom calculations', () => {
        const customCalculation = vi.fn();
        const rows = [
            { id: 1, _state: 'clean' },
            { id: 2, _state: 'clean' },
            { id: 3, _state: 'modified' },
            { id: 4, _state: 'new' },
            { id: 5, _state: 'saved' },
            { id: 6, _state: 'clean' },
            { id: 7, _state: 'deleted' }
        ];
        const values = [0, '', null, undefined, false, 5, 20];
        const [column] = prepareColumnCalculations([{
            topCalc: customCalculation
        }]);

        column.topCalc(values, rows);

        expect(customCalculation).toHaveBeenCalledWith(
            [0, '', null, undefined, false, 5],
            rows.slice(0, 6),
            undefined
        );
        expect(values).toEqual([0, '', null, undefined, false, 5, 20]);
        expect(rows).toHaveLength(7);
    });

    test('filters custom top and bottom calculations and dynamic params, including nested columns', () => {
        const params = vi.fn((values, data) => ({ values, data }));
        const topCalc = vi.fn((values, data, resolvedParams) => ({
            values,
            data,
            resolvedParams
        }));
        const bottomCalc = vi.fn(values => values.length);
        const rows = [
            { id: 1, score: 95, _state: 'modified' },
            { id: 2, score: 66, _state: 'deleted' },
            { id: 3, score: 80, _state: 'new' }
        ];
        const [group] = prepareColumnCalculations([{
            title: 'Scores',
            columns: [{
                field: 'score',
                topCalc,
                topCalcParams: params,
                bottomCalc
            }]
        }]);
        const column = group.columns[0];
        const resolvedParams = column.topCalcParams([95, 66, 80], rows);
        const result = column.topCalc([95, 66, 80], rows, resolvedParams);

        expect(params).toHaveBeenCalledWith(
            [95, 80],
            [rows[0], rows[2]]
        );
        expect(result.values).toEqual([95, 80]);
        expect(result.data).toEqual([rows[0], rows[2]]);
        expect(result.resolvedParams).toBe(resolvedParams);
        expect(column.bottomCalc([95, 66, 80], rows)).toBe(2);
        expect(bottomCalc).toHaveBeenCalledWith(
            [95, 80],
            [rows[0], rows[2]],
            undefined
        );
    });

    test('dynamic params use the same empty-value contract as their calculation', () => {
        const builtInParams = vi.fn();
        const extensionParams = vi.fn();
        const customParams = vi.fn();
        const customCalculation = vi.fn();
        const rows = [
            { id: 1, _state: 'clean' },
            { id: 2, _state: 'clean' },
            { id: 3, _state: 'deleted' },
            { id: 4, _state: 'saved' }
        ];
        const values = [0, '', 20, false];
        const columns = prepareColumnCalculations([
            { topCalc: 'sum', topCalcParams: builtInParams },
            { topCalc: 'registeredExtension', topCalcParams: extensionParams },
            { topCalc: customCalculation, topCalcParams: customParams }
        ]);

        columns[0].topCalcParams(values, rows);
        columns[1].topCalcParams(values, rows);
        columns[2].topCalcParams(values, rows);

        expect(builtInParams).toHaveBeenCalledWith(
            [0, false],
            [rows[0], rows[3]]
        );
        expect(extensionParams).toHaveBeenCalledWith(
            [0, '', false],
            [rows[0], rows[1], rows[3]]
        );
        expect(customParams).toHaveBeenCalledWith(
            [0, '', false],
            [rows[0], rows[1], rows[3]]
        );
    });

    test('does not wrap prepared calculations twice and preserves custom exceptions', () => {
        const failure = new Error('calculation failed');
        const calculation = vi.fn(() => {
            throw failure;
        });
        const getCrud = () => null;
        const first = prepareColumnCalculations([{ topCalc: calculation }], getCrud);
        const second = prepareColumnCalculations(first, getCrud);

        expect(second[0].topCalc).toBe(first[0].topCalc);
        expect(() => second[0].topCalc([], [], {})).toThrow(failure);
        expect(calculation).toHaveBeenCalledOnce();
    });

    test('preserves exceptions thrown by dynamic calculation params', () => {
        const failure = new Error('params failed');
        const [column] = prepareColumnCalculations([{
            topCalc: vi.fn(),
            topCalcParams() {
                throw failure;
            }
        }]);

        expect(() => column.topCalcParams([], [])).toThrow(failure);
    });

    test('recalculates only when CRUD state crosses the deleted boundary and unsubscribes', () => {
        let listener;
        const unsubscribe = vi.fn();
        const crud = {
            on: vi.fn((_eventName, callback) => {
                listener = callback;
                return unsubscribe;
            })
        };
        const table = createRuntime();
        const release = bindDeletedRowCalculationRecalc(table, crud);

        listener({ previousState: 'clean', nextState: 'modified' });
        listener({ previousState: 'modified', nextState: 'deleted' });
        listener({ previousState: 'deleted', nextState: 'clean' });
        listener({ previousState: 'new', nextState: 'saved' });

        expect(table.recalc).toHaveBeenCalledTimes(2);
        release();
        expect(unsubscribe).toHaveBeenCalledOnce();
    });
});

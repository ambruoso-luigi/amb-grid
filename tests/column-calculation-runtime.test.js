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
        'max',
        'registeredExtension'
    ])(
        'delegates named %s calculations to the registered engine function with filtered inputs',
        name => {
            const registered = vi.fn(() => `${name}-result`);
            const table = createRuntime({ [name]: registered });
            const staticParams = { precision: false };
            const rows = [
                { id: 1, amount: 0, _state: 'clean' },
                { id: 2, amount: 20, _state: 'deleted' },
                { id: 3, amount: 5, _state: 'saved' }
            ];
            const [column] = prepareColumnCalculations(
                [{ field: 'amount', topCalc: name, topCalcParams: staticParams }],
                () => ({ options: { stateField: '_state' } }),
                () => table
            );

            expect(column.topCalcParams).toBe(staticParams);
            expect(column.topCalc([0, 20, 5], rows, staticParams))
                .toBe(`${name}-result`);
            expect(registered).toHaveBeenCalledWith(
                [0, 5],
                [rows[0], rows[2]],
                staticParams
            );
        }
    );

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

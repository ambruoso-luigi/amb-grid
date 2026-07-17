import { describe, expect, test, vi } from 'vitest';

import { composeControllerMethods } from '../src/lib/table/controller/compose-controller-methods.js';

describe('AMB table controller method composition', () => {
    test('copies a single method group into a new result object', () => {
        const getData = vi.fn();
        const group = { getData };

        const composed = composeControllerMethods(group);

        expect(composed).toEqual({ getData });
        expect(composed).not.toBe(group);
        expect(Object.keys(composed)).toEqual(['getData']);
    });

    test('composes multiple distinct groups and preserves function identity', () => {
        const getData = vi.fn();
        const redraw = vi.fn();

        const composed = composeControllerMethods(
            { getData },
            { redraw }
        );

        expect(composed.getData).toBe(getData);
        expect(composed.redraw).toBe(redraw);
        expect(Object.keys(composed)).toEqual(['getData', 'redraw']);
    });

    test('does not mutate source groups and ignores missing groups', () => {
        const getData = vi.fn();
        const redraw = vi.fn();
        const first = { getData };
        const second = { redraw };

        const composed = composeControllerMethods(null, first, undefined, second);

        expect(composed).toEqual({ getData, redraw });
        expect(first).toEqual({ getData });
        expect(second).toEqual({ redraw });
    });

    test('throws on duplicate names without replacing the first method', () => {
        const firstGetData = vi.fn();
        const secondGetData = vi.fn();

        expect(() => {
            composeControllerMethods(
                { getData: firstGetData },
                { getData: secondGetData }
            );
        }).toThrow(/getData/);

        const composed = composeControllerMethods({ getData: firstGetData });

        expect(composed.getData).toBe(firstGetData);
        expect(composed.getData).not.toBe(secondGetData);
    });
});

import { describe, expect, test } from 'vitest';
import { validators } from '../src/lib/validators.js';

const createRow = data => ({
    getData: () => data
});

const createCell = (field, row) => ({
    getField: () => field,
    getRow: () => row
});

const createHelper = rows => ({
    table: {
        getRows: () => rows
    }
});

describe('validators.unique', () => {
    test('blocks duplicate values in the inferred current column', () => {
        const currentRow = createRow({ code: 'ABC' });
        const otherRow = createRow({ code: 'ABC' });
        const cell = createCell('code', currentRow);
        const helper = createHelper([currentRow, otherRow]);

        expect(validators.unique().validate('ABC', currentRow.getData(), cell, helper))
            .toBe(false);
    });

    test('does not compare the current row against itself', () => {
        const currentRow = createRow({ code: 'ABC' });
        const cell = createCell('code', currentRow);
        const helper = createHelper([currentRow]);

        expect(validators.unique().validate('ABC', currentRow.getData(), cell, helper))
            .toBe(true);
    });

    test('supports explicit field name as a string', () => {
        const currentRow = createRow({ code: 'ABC' });
        const otherRow = createRow({ code: 'ABC', other: 'XYZ' });
        const cell = createCell('other', currentRow);
        const helper = createHelper([currentRow, otherRow]);

        expect(validators.unique('code').validate('ABC', currentRow.getData(), cell, helper))
            .toBe(false);
    });

    test('supports explicit field name in options object', () => {
        const currentRow = createRow({ code: 'ABC' });
        const otherRow = createRow({ code: 'ABC', other: 'XYZ' });
        const cell = createCell('other', currentRow);
        const helper = createHelper([currentRow, otherRow]);

        expect(validators.unique({ field: 'code' }).validate('ABC', currentRow.getData(), cell, helper))
            .toBe(false);
    });

    test('is case-sensitive by default', () => {
        const currentRow = createRow({ code: 'ABC' });
        const otherRow = createRow({ code: 'abc' });
        const cell = createCell('code', currentRow);
        const helper = createHelper([currentRow, otherRow]);

        expect(validators.unique().validate('ABC', currentRow.getData(), cell, helper))
            .toBe(true);
    });

    test('can compare case-insensitively', () => {
        const currentRow = createRow({ code: 'ABC' });
        const otherRow = createRow({ code: 'abc' });
        const cell = createCell('code', currentRow);
        const helper = createHelper([currentRow, otherRow]);

        expect(validators.unique({ caseSensitive: false }).validate('ABC', currentRow.getData(), cell, helper))
            .toBe(false);
    });

    test('trims values by default', () => {
        const currentRow = createRow({ code: 'ABC' });
        const otherRow = createRow({ code: ' ABC ' });
        const cell = createCell('code', currentRow);
        const helper = createHelper([currentRow, otherRow]);

        expect(validators.unique().validate('ABC', currentRow.getData(), cell, helper))
            .toBe(false);
    });

    test('can compare without trimming values', () => {
        const currentRow = createRow({ code: 'ABC' });
        const otherRow = createRow({ code: ' ABC ' });
        const cell = createCell('code', currentRow);
        const helper = createHelper([currentRow, otherRow]);

        expect(validators.unique({ trim: false }).validate('ABC', currentRow.getData(), cell, helper))
            .toBe(true);
    });

    test('allows empty values', () => {
        const currentRow = createRow({ code: '' });
        const otherRow = createRow({ code: '' });
        const cell = createCell('code', currentRow);
        const helper = createHelper([currentRow, otherRow]);

        expect(validators.unique().validate('', currentRow.getData(), cell, helper))
            .toBe(true);
        expect(validators.unique().validate(null, currentRow.getData(), cell, helper))
            .toBe(true);
    });

    test('ignores rows without data or without the compared field', () => {
        const currentRow = createRow({ code: 'ABC' });
        const rowWithoutData = {};
        const rowWithoutField = createRow({ name: 'ABC' });
        const cell = createCell('code', currentRow);
        const helper = createHelper([currentRow, rowWithoutData, rowWithoutField]);

        expect(validators.unique().validate('ABC', currentRow.getData(), cell, helper))
            .toBe(true);
    });

    test('returns true when helper, table, getRows, or field are unavailable', () => {
        const currentRow = createRow({ code: 'ABC' });
        const cell = createCell('code', currentRow);

        expect(validators.unique().validate('ABC', currentRow.getData(), cell, null))
            .toBe(true);
        expect(validators.unique().validate('ABC', currentRow.getData(), cell, {}))
            .toBe(true);
        expect(validators.unique().validate('ABC', currentRow.getData(), cell, { table: {} }))
            .toBe(true);
        expect(validators.unique().validate('ABC', currentRow.getData(), {}, createHelper([currentRow])))
            .toBe(true);
    });
});

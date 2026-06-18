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
    options: {
        stateField: '_state'
    },
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

    test('blocks duplicates on clean or modified rows', () => {
        const currentRow = createRow({ code: 'ABC', _state: 'clean' });
        const cleanDuplicate = createRow({ code: 'ABC', _state: 'clean' });
        const modifiedDuplicate = createRow({ code: 'ABC', _state: 'modified' });
        const cell = createCell('code', currentRow);

        expect(validators.unique().validate('ABC', currentRow.getData(), cell, createHelper([currentRow, cleanDuplicate])))
            .toBe(false);
        expect(validators.unique().validate('ABC', currentRow.getData(), cell, createHelper([currentRow, modifiedDuplicate])))
            .toBe(false);
    });

    test('ignores deleted duplicate rows by default', () => {
        const currentRow = createRow({ code: 'ABC', _state: 'clean' });
        const deletedDuplicate = createRow({ code: 'ABC', _state: 'deleted' });
        const cell = createCell('code', currentRow);
        const helper = createHelper([currentRow, deletedDuplicate]);

        expect(validators.unique().validate('ABC', currentRow.getData(), cell, helper))
            .toBe(true);
    });

    test('can include deleted rows in duplicate checks', () => {
        const currentRow = createRow({ code: 'ABC', _state: 'clean' });
        const deletedDuplicate = createRow({ code: 'ABC', _state: 'deleted' });
        const cell = createCell('code', currentRow);
        const helper = createHelper([currentRow, deletedDuplicate]);

        expect(validators.unique({ includeDeleted: true }).validate('ABC', currentRow.getData(), cell, helper))
            .toBe(false);
    });

    test('detects a duplicate again after a deleted row is rolled back', () => {
        const currentRow = createRow({ code: 'ABC', _state: 'clean' });
        const restoredData = { code: 'ABC', _state: 'deleted' };
        const restoredRow = createRow(restoredData);
        const cell = createCell('code', currentRow);
        const helper = createHelper([currentRow, restoredRow]);
        const unique = validators.unique();

        expect(unique.validate('ABC', currentRow.getData(), cell, helper)).toBe(true);

        restoredData._state = 'clean';

        expect(unique.validate('ABC', currentRow.getData(), cell, helper)).toBe(false);
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

describe('validators.date', () => {
    test('accepts real dates with one or two digit day and month', () => {
        const validator = validators.date({
            format: 'dd/mm/yyyy'
        });

        expect(validator.validate('20/7/2026')).toEqual({ isValid: true });
        expect(validator.validate('5/6/2026')).toEqual({ isValid: true });
        expect(validator.validate('31/02/2026')).toEqual({
            isValid: false,
            code: 'calendar',
            message: 'Invalid date'
        });
    });

    test('respects minDate and maxDate', () => {
        const validator = validators.date({
            format: 'dd/mm/yyyy',
            minDate: '2026-01-01',
            maxDate: '2026-12-31',
            messages: {
                minDate: 'Too early',
                maxDate: 'Too late'
            }
        });

        expect(validator.validate('20/7/2026')).toEqual({ isValid: true });
        expect(validator.validate('31/12/2025')).toEqual({
            isValid: false,
            code: 'minDate',
            message: 'Too early'
        });
        expect(validator.validate('01/01/2027')).toEqual({
            isValid: false,
            code: 'maxDate',
            message: 'Too late'
        });
    });

    test('handles empty values according to allowEmpty', () => {
        expect(validators.date({ allowEmpty: true }).validate('')).toEqual({ isValid: true });
        expect(validators.date({
            allowEmpty: false,
            messages: {
                required: 'Date is required'
            }
        }).validate('')).toEqual({
            isValid: false,
            code: 'required',
            message: 'Date is required'
        });
    });

    test('distinguishes syntax errors from calendar errors', () => {
        const validator = validators.date({
            format: 'legacy',
            messages: {
                syntax: 'Use exactly YYYYMMDD',
                calendar: 'Date does not exist'
            }
        });

        expect(validator.validate('2026720')).toEqual({
            isValid: false,
            code: 'syntax',
            message: 'Use exactly YYYYMMDD'
        });
        expect(validator.validate('20260231')).toEqual({
            isValid: false,
            code: 'calendar',
            message: 'Date does not exist'
        });
    });
});

describe('validators.allowedValues', () => {
    test('accepts listed values and rejects unknown values', () => {
        const validator = validators.allowedValues(['HR', 'IT', 'FIN']);

        expect(validator.validate('IT')).toBe(true);
        expect(validator.validate('XXX')).toBe(false);
    });

    test('allows empty values', () => {
        const validator = validators.allowedValues(['HR']);

        expect(validator.validate('')).toBe(true);
        expect(validator.validate(null)).toBe(true);
    });

    test('trims by default and supports case-insensitive comparison', () => {
        expect(validators.allowedValues(['IT']).validate(' IT ')).toBe(true);
        expect(validators.allowedValues(
            ['IT'],
            { caseSensitive: false }
        ).validate('it')).toBe(true);
    });

    test('supports disabled trimming and case-sensitive comparison', () => {
        expect(validators.allowedValues(
            ['IT'],
            { trim: false }
        ).validate(' IT ')).toBe(false);
        expect(validators.allowedValues(
            ['IT'],
            { caseSensitive: true }
        ).validate('it')).toBe(false);
    });
});

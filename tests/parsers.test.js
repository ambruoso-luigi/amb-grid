import { describe, expect, test } from 'vitest';
import { parsers } from '../src/lib/parsers.js';

describe('parsers.decimalToPayload', () => {
    test('normalizes comma decimals and thousands to payload strings', () => {
        const parser = parsers.decimalToPayload();

        expect(parser.parse('123,45')).toBe('123.45');
        expect(parser.parse('1.234,56')).toBe('1234.56');
        expect(parser.parse('-123.123,01')).toBe('-123123.01');
    });

    test('accepts already normalized decimal strings when enabled', () => {
        expect(parsers.decimalToPayload().parse('123.45')).toBe('123.45');
        expect(parsers.decimalToPayload({ allowNormalized: false }).parse('123.45')).toBe(null);
    });

    test('rejects incoherent thousands and non-transformable values', () => {
        const parser = parsers.decimalToPayload();

        expect(parser.parse('12.34,56')).toBe(null);
        expect(parser.parse('1..234,56')).toBe(null);
        expect(parser.parse('abc')).toBe(null);
    });

    test('handles empty and negative options', () => {
        expect(parsers.decimalToPayload().parse('')).toBe('');
        expect(parsers.decimalToPayload({ emptyAs: null }).parse('   ')).toBe(null);
        expect(parsers.decimalToPayload({ allowEmpty: false }).parse('')).toBe(null);
        expect(parsers.decimalToPayload({ allowNegative: false }).parse('-123,45')).toBe(null);
    });
});

describe('parsers.integerToPayload', () => {
    test('normalizes integers and thousands to payload strings', () => {
        const parser = parsers.integerToPayload();

        expect(parser.parse('1234')).toBe('1234');
        expect(parser.parse('1.234')).toBe('1234');
        expect(parser.parse('-1.234')).toBe('-1234');
    });

    test('rejects decimals, bad thousands, and non-numeric input', () => {
        const parser = parsers.integerToPayload();

        expect(parser.parse('123,45')).toBe(null);
        expect(parser.parse('12.34')).toBe(null);
        expect(parser.parse('1..234')).toBe(null);
        expect(parser.parse('abc')).toBe(null);
    });

    test('handles empty and negative options', () => {
        expect(parsers.integerToPayload().parse('')).toBe('');
        expect(parsers.integerToPayload({ emptyAs: null }).parse('   ')).toBe(null);
        expect(parsers.integerToPayload({ allowEmpty: false }).parse('')).toBe(null);
        expect(parsers.integerToPayload({ allowNegative: false }).parse('-1234')).toBe(null);
    });
});

describe('parsers.dateToPayload', () => {
    test('normalizes supported date formats to YYYY-MM-DD', () => {
        const parser = parsers.dateToPayload();

        expect(parser.parse('16/06/2026')).toBe('2026-06-16');
        expect(parser.parse('16-06-2026')).toBe('2026-06-16');
        expect(parser.parse('16.06.2026')).toBe('2026-06-16');
        expect(parser.parse('2026-06-16')).toBe('2026-06-16');
        expect(parser.parse('2026/06/16')).toBe('2026-06-16');
        expect(parser.parse('20260616')).toBe('2026-06-16');
    });

    test('validates real calendar dates', () => {
        const parser = parsers.dateToPayload();

        expect(parser.parse('31/02/2026')).toBe(null);
        expect(parser.parse('29/02/2024')).toBe('2024-02-29');
        expect(parser.parse('29/02/2025')).toBe(null);
    });

    test('handles empty values and ambiguous format order', () => {
        expect(parsers.dateToPayload().parse('')).toBe('');
        expect(parsers.dateToPayload({ emptyAs: null }).parse('   ')).toBe(null);
        expect(parsers.dateToPayload({ allowEmpty: false }).parse('')).toBe(null);
        expect(parsers.dateToPayload({ inputFormats: ['mm/dd/yyyy', 'dd/mm/yyyy'] }).parse('06/07/2026'))
            .toBe('2026-06-07');
        expect(parsers.dateToPayload({ inputFormats: ['dd/mm/yyyy', 'mm/dd/yyyy'] }).parse('06/07/2026'))
            .toBe('2026-07-06');
    });
});

describe('parsers.dateTimeToPayload', () => {
    test('normalizes datetime values with and without seconds', () => {
        const parser = parsers.dateTimeToPayload();

        expect(parser.parse('16/06/2026 14:30')).toBe('2026-06-16 14:30:00');
        expect(parser.parse('16/06/2026 14:30:25')).toBe('2026-06-16 14:30:25');
        expect(parser.parse('16-06-2026 14:30')).toBe('2026-06-16 14:30:00');
        expect(parser.parse('20260616 14:30:25')).toBe('2026-06-16 14:30:25');
        expect(parser.parse('2026-06-16 14:30:25')).toBe('2026-06-16 14:30:25');
    });

    test('rejects impossible dates and times', () => {
        const parser = parsers.dateTimeToPayload();

        expect(parser.parse('31/02/2026 14:30')).toBe(null);
        expect(parser.parse('16/06/2026 24:00')).toBe(null);
        expect(parser.parse('16/06/2026 14:60')).toBe(null);
        expect(parser.parse('16/06/2026 14:30:60')).toBe(null);
    });

    test('handles empty values', () => {
        expect(parsers.dateTimeToPayload().parse('')).toBe('');
        expect(parsers.dateTimeToPayload({ emptyAs: null }).parse('   ')).toBe(null);
        expect(parsers.dateTimeToPayload({ allowEmpty: false }).parse('')).toBe(null);
    });
});

describe('string normalizer parsers', () => {
    test('normalizes text values', () => {
        expect(parsers.trim().parse('  value  ')).toBe('value');
        expect(parsers.emptyToNull().parse('   ')).toBe(null);
        expect(parsers.uppercase().parse('abc')).toBe('ABC');
        expect(parsers.removeSpaces().parse(' IT 60 X ')).toBe('IT60X');
        expect(parsers.digitsOnly().parse('A12-34 B')).toBe('1234');
        expect(parsers.ibanToPayload().parse(' it60 x054 2811 1010 0000 0123 456 ')).toBe('IT60X0542811101000000123456');
        expect(parsers.fiscalCodeToPayload().parse(' rss mra 80a01 h501u ')).toBe('RSSMRA80A01H501U');
    });
});

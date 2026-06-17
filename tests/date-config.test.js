import { describe, expect, test } from 'vitest';
import { date } from '../src/lib/date.js';

describe('date.createConfig', () => {
    test('derives formatter, editor, validator, and parser from a single format', () => {
        const config = date.createConfig({
            format: 'dd/mm/yyyy'
        });

        expect(config.formatter).toBe('dd/mm/yyyy');
        expect(config.editor).toEqual(expect.objectContaining({
            format: 'dd/mm/yyyy',
            mode: 'manualWithPickerButton',
            invalidBehavior: 'commitRaw'
        }));
        expect(config.validator).toEqual(expect.objectContaining({
            format: 'dd/mm/yyyy',
            allowEmpty: true
        }));
        expect(config.parser).toEqual(expect.objectContaining({
            inputFormats: ['dd/mm/yyyy'],
            outputFormat: 'yyyy-mm-dd',
            allowEmpty: true
        }));
    });

    test('propagates payload format, range, mode, and messages', () => {
        const messages = {
            syntax: 'Bad date'
        };
        const config = date.createConfig({
            format: 'iso',
            payloadFormat: 'yyyymmdd',
            minDate: '2025-01-01',
            maxDate: '2027-12-31',
            mode: 'manual',
            messages
        });

        expect(config.displayFormat).toBe('iso');
        expect(config.editFormat).toBe('iso');
        expect(config.inputFormats).toEqual(['yyyy-mm-dd']);
        expect(config.payloadFormat).toBe('yyyymmdd');
        expect(config.editor).toEqual(expect.objectContaining({
            format: 'iso',
            minDate: '2025-01-01',
            maxDate: '2027-12-31',
            mode: 'manual'
        }));
        expect(config.validator).toEqual(expect.objectContaining({
            format: 'iso',
            minDate: '2025-01-01',
            maxDate: '2027-12-31',
            messages
        }));
        expect(config.parser).toEqual(expect.objectContaining({
            inputFormats: ['yyyy-mm-dd'],
            outputFormat: 'yyyymmdd'
        }));
    });

    test('maps picker true to the stable picker-button mode', () => {
        const config = date.createConfig({
            format: 'dd/mm/yyyy',
            picker: true
        });

        expect(config.mode).toBe('manualWithPickerButton');
        expect(config.editor.mode).toBe('manualWithPickerButton');
    });

    test('supports separate display and edit formats without repeating range settings', () => {
        const config = date.createConfig({
            displayFormat: 'dd/mm/yyyy',
            editFormat: 'yyyy-mm-dd',
            minDate: '2025-01-01',
            maxDate: '2027-12-31'
        });

        expect(config.formatter).toBe('dd/mm/yyyy');
        expect(config.editor.format).toBe('yyyy-mm-dd');
        expect(config.validator.format).toBe('yyyy-mm-dd');
        expect(config.parser.inputFormats).toEqual(['yyyy-mm-dd']);
        expect(config.picker).toEqual(expect.objectContaining({
            mode: 'manualWithPickerButton',
            format: 'yyyy-mm-dd',
            minDate: '2025-01-01',
            maxDate: '2027-12-31'
        }));
    });
});

import { describe, expect, test } from 'vitest';
import {
    normalizeAutocompleteItems,
    normalizeAutocompleteOptions,
    resolveAutocompleteCommit
} from '../src/lib/editors/autocomplete-editor-utils.js';

describe('autocomplete editor options', () => {
    test('provides stable strict defaults', () => {
        expect(normalizeAutocompleteOptions()).toEqual(expect.objectContaining({
            allowEmpty: true,
            allowCustomValue: false,
            invalidBehavior: 'commitRaw',
            maxOptions: 20,
            dropdownWidth: 420
        }));
    });
});

describe('autocomplete lookup results', () => {
    test('normalizes simple string suggestions for Tom Select', () => {
        expect(normalizeAutocompleteItems([
            'Human Resources',
            'Finance'
        ])).toEqual([
            { value: 'Human Resources', label: 'Human Resources' },
            { value: 'Finance', label: 'Finance' }
        ]);
    });

    test('preserves object suggestions and supports custom field names', () => {
        const item = { code: 'HR', description: 'Human Resources' };

        expect(normalizeAutocompleteItems([item], 'code', 'description')).toEqual([item]);
        expect(normalizeAutocompleteItems(['Operations'], 'code', 'description')).toEqual([
            { code: 'Operations', description: 'Operations' }
        ]);
    });
});

describe('autocomplete commit behavior', () => {
    test('commits selected lookup values', () => {
        expect(resolveAutocompleteCommit({
            selectedValue: 'IT',
            typedValue: 'Information',
            options: {}
        })).toEqual({
            action: 'success',
            value: 'IT'
        });
    });

    test('allows custom typed values in free mode', () => {
        expect(resolveAutocompleteCommit({
            selectedValue: '',
            typedValue: 'custom-note',
            options: {
                allowCustomValue: true
            }
        })).toEqual({
            action: 'success',
            value: 'custom-note'
        });
    });

    test('commits raw unknown values in strict commitRaw mode', () => {
        expect(resolveAutocompleteCommit({
            selectedValue: '',
            typedValue: 'XXX',
            options: {
                allowCustomValue: false,
                invalidBehavior: 'commitRaw'
            }
        })).toEqual({
            action: 'success',
            value: 'XXX'
        });
    });

    test('cancels unknown values in strict cancel mode', () => {
        expect(resolveAutocompleteCommit({
            selectedValue: '',
            typedValue: 'XXX',
            options: {
                allowCustomValue: false,
                invalidBehavior: 'cancel'
            }
        })).toEqual({
            action: 'cancel'
        });
    });

    test('handles empty values according to options', () => {
        expect(resolveAutocompleteCommit({
            selectedValue: '',
            typedValue: '',
            options: {
                allowEmpty: true
            }
        })).toEqual({
            action: 'success',
            value: ''
        });
        expect(resolveAutocompleteCommit({
            selectedValue: '',
            typedValue: '',
            options: {
                allowEmpty: false,
                invalidBehavior: 'commitRaw'
            }
        })).toEqual({
            action: 'success',
            value: ''
        });
        expect(resolveAutocompleteCommit({
            selectedValue: '',
            typedValue: '',
            options: {
                allowEmpty: false,
                invalidBehavior: 'cancel'
            }
        })).toEqual({
            action: 'cancel'
        });
    });
});

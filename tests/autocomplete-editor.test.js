import { describe, expect, test } from 'vitest';
import {
    filterAutocompleteItems,
    getAutocompleteCursorPosition,
    getAutocompleteKeyAction,
    getAutocompleteSuggestionValues,
    getAwesompleteOptions,
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
            trimInput: true,
            maxOptions: 10,
            dropdownWidth: 420
        }));
    });

    test('supports a maxOptions override', () => {
        expect(normalizeAutocompleteOptions({
            maxOptions: 15
        }).maxOptions).toBe(15);
    });

    test('falls back to 10 for invalid maxOptions values', () => {
        expect(normalizeAutocompleteOptions({
            maxOptions: 0
        }).maxOptions).toBe(10);
    });
});

describe('autocomplete suggestions', () => {
    test('normalizes simple string suggestions', () => {
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

    test('returns only the first maxOptions matching values', () => {
        const values = Array.from({ length: 100 }, (_, index) => `Item ${index + 1}`);
        const matches = filterAutocompleteItems(values, 'Item', 7);

        expect(matches).toHaveLength(7);
        expect(matches.map(item => item.value)).toEqual([
            'Item 1',
            'Item 2',
            'Item 3',
            'Item 4',
            'Item 5',
            'Item 6',
            'Item 7'
        ]);
    });

    test('maps maxOptions to Awesomplete maxItems', () => {
        expect(getAwesompleteOptions(['Low', 'Medium'], {}).maxItems).toBe(10);
        expect(getAwesompleteOptions(['Low', 'Medium'], {
            maxOptions: 1
        }).maxItems).toBe(1);
    });

    test('passes plain text values to Awesomplete', () => {
        expect(getAutocompleteSuggestionValues([
            'urgent',
            10,
            null
        ])).toEqual([
            'urgent',
            '10'
        ]);
    });
});

describe('autocomplete native input behavior', () => {
    test('places the initial cursor at the end of the value', () => {
        expect(getAutocompleteCursorPosition('Finance')).toBe(7);
        expect(getAutocompleteCursorPosition('')).toBe(0);
    });

    test('leaves Delete and Backspace to the native input', () => {
        expect(getAutocompleteKeyAction('Delete')).toEqual({
            action: 'native',
            preventDefault: false
        });
        expect(getAutocompleteKeyAction('Backspace')).toEqual({
            action: 'native',
            preventDefault: false
        });
    });

    test('delegates ArrowDown and ArrowUp to Awesomplete', () => {
        expect(getAutocompleteKeyAction('ArrowDown')).toEqual({
            action: 'suggestions',
            preventDefault: false
        });
        expect(getAutocompleteKeyAction('ArrowUp')).toEqual({
            action: 'suggestions',
            preventDefault: false
        });
    });

    test('Enter commits the current input when Awesomplete did not select first', () => {
        expect(getAutocompleteKeyAction('Enter')).toEqual({
            action: 'commit',
            preventDefault: true
        });
    });

    test('Tab commits without blocking Tabulator navigation', () => {
        expect(getAutocompleteKeyAction('Tab')).toEqual({
            action: 'commit',
            preventDefault: false
        });
    });
});

describe('autocomplete commit behavior', () => {
    test('commits selected suggested values', () => {
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

    test('trims selected and custom values by default', () => {
        expect(resolveAutocompleteCommit({
            selectedValue: 'Finance ',
            typedValue: '',
            options: {}
        })).toEqual({
            action: 'success',
            value: 'Finance'
        });
        expect(resolveAutocompleteCommit({
            selectedValue: '',
            typedValue: 'custom-note ',
            options: {
                allowCustomValue: true
            }
        })).toEqual({
            action: 'success',
            value: 'custom-note'
        });
    });

    test('preserves whitespace when trimInput is false', () => {
        expect(resolveAutocompleteCommit({
            selectedValue: 'Finance ',
            typedValue: '',
            options: {
                trimInput: false
            }
        })).toEqual({
            action: 'success',
            value: 'Finance '
        });
        expect(resolveAutocompleteCommit({
            selectedValue: '',
            typedValue: 'custom-note ',
            options: {
                allowCustomValue: true,
                trimInput: false
            }
        })).toEqual({
            action: 'success',
            value: 'custom-note '
        });
    });
});

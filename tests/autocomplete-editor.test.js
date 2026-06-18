import { describe, expect, test, vi } from 'vitest';
import { CrudHelper, ROW_STATE } from '../src/lib/crud-helper.js';
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

const awesompleteMock = vi.hoisted(() => ({
    instances: []
}));

vi.mock('awesomplete', () => ({
    default: class AwesompleteMock {
        constructor(input, options) {
            this.input = input;
            this.options = options;
            this.container = {
                contains: target => target === input || target?.insideAutocomplete === true
            };
            this.destroy = vi.fn();
            this.evaluate = vi.fn();
            awesompleteMock.instances.push(this);
        }
    }
}));

const { autocomplete } = await import('../src/lib/editors/autocomplete-editor.js');

class EventTargetMock {
    constructor() {
        this.listeners = new Map();
    }

    addEventListener(type, listener, options) {
        if (!this.listeners.has(type)) {
            this.listeners.set(type, []);
        }

        this.listeners.get(type).push({ listener, options });
    }

    removeEventListener(type, listener, options) {
        const listeners = this.listeners.get(type) || [];

        this.listeners.set(type, listeners.filter(entry => {
            return entry.listener !== listener || entry.options !== options;
        }));
    }

    dispatch(type, event = {}) {
        const dispatchedEvent = {
            target: this,
            preventDefault: vi.fn(),
            ...event
        };

        [...(this.listeners.get(type) || [])].forEach(({ listener }) => {
            listener(dispatchedEvent);
        });

        return dispatchedEvent;
    }
}

class InputMock extends EventTargetMock {
    constructor() {
        super();
        this.className = '';
        this.placeholder = '';
        this.type = '';
        this.value = '';
        this.focus = vi.fn();
        this.setSelectionRange = vi.fn();
    }
}

const createClassList = () => {
    const values = new Set();

    return {
        add: vi.fn(value => values.add(value)),
        remove: vi.fn(value => values.delete(value)),
        contains: value => values.has(value)
    };
};

const createEditorHarness = (options = {}, initialValue = 'Finance') => {
    const originalDocument = globalThis.document;
    const documentMock = new EventTargetMock();
    const cellElement = {
        classList: createClassList(),
        dataset: {}
    };
    const cell = {
        getElement: () => cellElement,
        getValue: () => initialValue
    };
    const success = vi.fn();
    const cancel = vi.fn();
    let render = null;

    documentMock.createElement = vi.fn(() => new InputMock());
    globalThis.document = documentMock;
    awesompleteMock.instances.length = 0;

    const input = autocomplete(['Finance', 'Human Resources'], options)(
        cell,
        callback => {
            render = callback;
        },
        success,
        cancel
    );

    render();

    return {
        cancel,
        cell,
        cellElement,
        documentMock,
        input,
        restore: () => {
            globalThis.document = originalDocument;
        },
        success
    };
};

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

describe('autocomplete editor lifecycle', () => {
    test('commits the typed value on Enter', () => {
        const harness = createEditorHarness({ allowCustomValue: true });

        try {
            harness.input.value = 'Operations';
            const event = harness.input.dispatch('keydown', { key: 'Enter' });

            expect(event.preventDefault).toHaveBeenCalledOnce();
            expect(harness.success).toHaveBeenCalledWith('Operations');
            expect(harness.cancel).not.toHaveBeenCalled();
        } finally {
            harness.restore();
        }
    });

    test('commits on Tab without preventing Tabulator navigation', () => {
        const harness = createEditorHarness({ allowCustomValue: true });

        try {
            harness.input.value = 'Operations';
            const event = harness.input.dispatch('keydown', { key: 'Tab' });

            expect(event.preventDefault).not.toHaveBeenCalled();
            expect(harness.success).toHaveBeenCalledWith('Operations');
        } finally {
            harness.restore();
        }
    });

    test('commits synchronously on blur and before an outside cell mousedown', () => {
        const blurHarness = createEditorHarness({ allowCustomValue: true });

        try {
            blurHarness.input.value = 'Operations';
            blurHarness.input.dispatch('blur');

            expect(blurHarness.success).toHaveBeenCalledWith('Operations');
        } finally {
            blurHarness.restore();
        }

        const clickHarness = createEditorHarness({ allowCustomValue: true });

        try {
            clickHarness.input.value = 'Legal';
            clickHarness.documentMock.dispatch('mousedown', {
                target: { cell: 'next' }
            });

            expect(clickHarness.success).toHaveBeenCalledWith('Legal');
        } finally {
            clickHarness.restore();
        }
    });

    test('does not commit an Awesomplete menu mousedown before selection completes', () => {
        const harness = createEditorHarness();

        try {
            harness.input.value = 'Fin';
            harness.documentMock.dispatch('mousedown', {
                target: { insideAutocomplete: true }
            });

            expect(harness.success).not.toHaveBeenCalled();

            harness.input.dispatch('awesomplete-selectcomplete', {
                text: { value: 'Finance' }
            });

            expect(harness.success).toHaveBeenCalledWith('Finance');
        } finally {
            harness.restore();
        }
    });

    test('commits custom and commitRaw values according to options', () => {
        const customHarness = createEditorHarness({ allowCustomValue: true });

        try {
            customHarness.input.value = 'Custom department';
            customHarness.input.dispatch('blur');

            expect(customHarness.success).toHaveBeenCalledWith('Custom department');
        } finally {
            customHarness.restore();
        }

        const rawHarness = createEditorHarness({
            allowCustomValue: false,
            invalidBehavior: 'commitRaw'
        });

        try {
            rawHarness.input.value = 'Unknown department';
            rawHarness.input.dispatch('blur');

            expect(rawHarness.success).toHaveBeenCalledWith('Unknown department');
        } finally {
            rawHarness.restore();
        }
    });

    test('removes the temporary overflow class after commit', () => {
        const harness = createEditorHarness();

        try {
            expect(harness.cellElement.classList.contains(
                'amb-autocomplete-cell--editing'
            )).toBe(true);

            harness.input.dispatch('keydown', { key: 'Enter' });

            expect(harness.cellElement.classList.contains(
                'amb-autocomplete-cell--editing'
            )).toBe(false);
        } finally {
            harness.restore();
        }
    });

    test('a committed value is visible to CrudHelper through cellEdited', () => {
        const originalDocument = globalThis.document;
        const documentMock = new EventTargetMock();
        const handlers = new Map();
        const rowData = {
            id: 1,
            department: 'Finance'
        };
        const cellElement = {
            classList: createClassList(),
            dataset: {}
        };
        const rowElement = { dataset: {} };
        const row = {
            getCell: () => cell,
            getCells: () => [cell],
            getData: () => rowData,
            getElement: () => rowElement,
            update: patch => Object.assign(rowData, patch)
        };
        const cell = {
            getElement: () => cellElement,
            getField: () => 'department',
            getRow: () => row,
            getValue: () => rowData.department
        };
        const table = {
            getRows: () => [row],
            on: (eventName, handler) => handlers.set(eventName, handler)
        };

        documentMock.createElement = vi.fn(() => new InputMock());
        globalThis.document = documentMock;
        awesompleteMock.instances.length = 0;

        try {
            const crud = new CrudHelper(table, {
                rowNumbering: { enabled: false }
            });
            let render = null;
            const input = autocomplete(['Finance', 'Human Resources'])(
                cell,
                callback => {
                    render = callback;
                },
                value => {
                    rowData.department = value;
                    handlers.get('cellEdited')(cell);
                },
                vi.fn()
            );

            render();
            input.value = 'Human Resources';
            input.dispatch('awesomplete-selectcomplete', {
                text: { value: 'Human Resources' }
            });

            expect(rowData.department).toBe('Human Resources');
            expect(rowData._state).toBe(ROW_STATE.MODIFIED);
            expect(crud.modifiedCells.get(1)).toEqual(new Set(['department']));
        } finally {
            globalThis.document = originalDocument;
        }
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

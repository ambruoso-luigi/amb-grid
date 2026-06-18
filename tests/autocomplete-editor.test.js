import { describe, expect, test, vi } from 'vitest';
import { CrudHelper, ROW_STATE } from '../src/lib/crud-helper.js';
import {
    getAutocompleteCursorPosition,
    getAutocompleteKeyAction,
    getAutocompleteSuggestionValues,
    getAwesompleteOptions,
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
            this.index = -1;
            this.isOpened = false;
            this.suggestions = options.list.map(value => ({
                label: value,
                value
            }));
            this.container = {
                contains: target => target === input || target?.insideAutocomplete === true
            };
            this.destroy = vi.fn();
            this.evaluate = vi.fn(() => {
                this.isOpened = this.suggestions.length > 0;
            });
            awesompleteMock.instances.push(this);
        }

        get opened() {
            return this.isOpened;
        }

        get selected() {
            return this.index >= 0;
        }

        next() {
            if (this.suggestions.length === 0) return;

            this.index = this.index < this.suggestions.length - 1
                ? this.index + 1
                : 0;
            this.highlight();
        }

        previous() {
            if (this.suggestions.length === 0) return;

            this.index = this.index > 0
                ? this.index - 1
                : this.suggestions.length - 1;
            this.highlight();
        }

        highlight() {
            this.input.dispatch('awesomplete-highlight', {
                text: this.suggestions[this.index]
            });
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
            stopImmediatePropagation: vi.fn(),
            stopPropagation: vi.fn(),
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

const createEditorHarness = (
    options = {},
    initialValue = 'Finance',
    values = ['Finance', 'Human Resources']
) => {
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

    const input = autocomplete(values, options)(
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
        awesomplete: awesompleteMock.instances[0],
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
    test('Enter without a highlighted suggestion commits the raw typed value', () => {
        const harness = createEditorHarness({ allowCustomValue: true });

        try {
            harness.input.value = 'Mar';
            const event = harness.input.dispatch('keydown', { key: 'Enter' });

            expect(event.preventDefault).toHaveBeenCalledOnce();
            expect(harness.success).toHaveBeenCalledWith('Mar');
            expect(harness.cancel).not.toHaveBeenCalled();
        } finally {
            harness.restore();
        }
    });

    test('Tab without a highlighted suggestion commits raw text and stays unblocked', () => {
        const harness = createEditorHarness({ allowCustomValue: true });

        try {
            harness.input.value = 'Mar';
            const event = harness.input.dispatch('keydown', { key: 'Tab' });

            expect(event.preventDefault).not.toHaveBeenCalled();
            expect(harness.success).toHaveBeenCalledWith('Mar');
        } finally {
            harness.restore();
        }
    });

    test('Tab with a highlighted suggestion commits it and stays unblocked', () => {
        const harness = createEditorHarness(
            { allowCustomValue: true },
            '',
            ['Mario Rossi', 'Maria Bianchi']
        );

        try {
            harness.input.value = 'Mar';
            harness.awesomplete.index = 0;
            const event = harness.input.dispatch('keydown', { key: 'Tab' });

            expect(event.preventDefault).not.toHaveBeenCalled();
            expect(harness.success).toHaveBeenCalledWith('Mario Rossi');
        } finally {
            harness.restore();
        }
    });

    test('Enter with a highlighted suggestion commits it', () => {
        const harness = createEditorHarness(
            { allowCustomValue: true },
            '',
            ['Mario Rossi', 'Maria Bianchi']
        );

        try {
            harness.input.value = 'Mar';
            harness.awesomplete.index = 0;
            const event = harness.input.dispatch('keydown', { key: 'Enter' });

            expect(event.preventDefault).toHaveBeenCalledOnce();
            expect(harness.success).toHaveBeenCalledWith('Mario Rossi');
        } finally {
            harness.restore();
        }
    });

    test('uses the Awesomplete highlight event when selected state is unavailable', () => {
        const harness = createEditorHarness(
            { allowCustomValue: true },
            '',
            ['Mario Rossi']
        );

        try {
            harness.input.value = 'Mar';
            harness.input.dispatch('awesomplete-highlight', {
                text: { value: 'Mario Rossi' }
            });
            const event = harness.input.dispatch('keydown', { key: 'Tab' });

            expect(event.preventDefault).not.toHaveBeenCalled();
            expect(harness.success).toHaveBeenCalledWith('Mario Rossi');
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

    test('strict commitRaw commits text outside the suggestion list on Tab', () => {
        const harness = createEditorHarness({
            allowCustomValue: false,
            invalidBehavior: 'commitRaw'
        });

        try {
            harness.input.value = 'Pippo Pluto';
            const event = harness.input.dispatch('keydown', { key: 'Tab' });

            expect(event.preventDefault).not.toHaveBeenCalled();
            expect(harness.success).toHaveBeenCalledWith('Pippo Pluto');
            expect(harness.cancel).not.toHaveBeenCalled();
        } finally {
            harness.restore();
        }
    });

    test('strict cancel rejects raw text on Tab without blocking navigation', () => {
        const harness = createEditorHarness({
            allowCustomValue: false,
            invalidBehavior: 'cancel'
        });

        try {
            harness.input.value = 'Pippo Pluto';
            const event = harness.input.dispatch('keydown', { key: 'Tab' });

            expect(event.preventDefault).not.toHaveBeenCalled();
            expect(harness.cancel).toHaveBeenCalledOnce();
            expect(harness.success).not.toHaveBeenCalled();
        } finally {
            harness.restore();
        }
    });

    test('typing an exact suggestion is still raw unless it was highlighted', () => {
        const harness = createEditorHarness({
            allowCustomValue: false,
            invalidBehavior: 'cancel'
        });

        try {
            harness.input.value = 'Finance';
            harness.input.dispatch('keydown', { key: 'Enter' });

            expect(harness.cancel).toHaveBeenCalledOnce();
            expect(harness.success).not.toHaveBeenCalled();
        } finally {
            harness.restore();
        }
    });

    test('input clears a previously tracked highlighted suggestion', () => {
        const harness = createEditorHarness({ allowCustomValue: true });

        try {
            harness.input.dispatch('awesomplete-highlight', {
                text: { value: 'Finance' }
            });
            harness.input.value = 'Mar';
            harness.input.dispatch('input');
            harness.input.dispatch('keydown', { key: 'Tab' });

            expect(harness.success).toHaveBeenCalledWith('Mar');
        } finally {
            harness.restore();
        }
    });

    test('Delete and Backspace remain native input operations', () => {
        const harness = createEditorHarness({ allowCustomValue: true });

        try {
            harness.input.value = 'Mar';
            const deleteEvent = harness.input.dispatch('keydown', { key: 'Delete' });
            const backspaceEvent = harness.input.dispatch('keydown', { key: 'Backspace' });

            expect(deleteEvent.preventDefault).not.toHaveBeenCalled();
            expect(backspaceEvent.preventDefault).not.toHaveBeenCalled();
            expect(harness.input.value).toBe('Mar');
            expect(harness.success).not.toHaveBeenCalled();
            expect(harness.cancel).not.toHaveBeenCalled();
        } finally {
            harness.restore();
        }
    });

    test('ArrowUp and ArrowDown stay inside suggestions and update the highlight', () => {
        const harness = createEditorHarness(
            { allowCustomValue: true },
            '',
            ['Mario Rossi', 'Maria Bianchi']
        );

        try {
            const firstDownEvent = harness.input.dispatch('keydown', {
                key: 'ArrowDown'
            });
            expect(firstDownEvent.preventDefault).toHaveBeenCalledOnce();
            expect(firstDownEvent.stopPropagation).toHaveBeenCalledOnce();
            expect(harness.awesomplete.index).toBe(0);

            const secondDownEvent = harness.input.dispatch('keydown', {
                key: 'ArrowDown'
            });
            expect(secondDownEvent.preventDefault).toHaveBeenCalledOnce();
            expect(secondDownEvent.stopPropagation).toHaveBeenCalledOnce();
            expect(harness.awesomplete.index).toBe(1);

            const upEvent = harness.input.dispatch('keydown', { key: 'ArrowUp' });

            expect(upEvent.preventDefault).toHaveBeenCalledOnce();
            expect(upEvent.stopPropagation).toHaveBeenCalledOnce();
            expect(harness.awesomplete.index).toBe(0);
            expect(harness.success).not.toHaveBeenCalled();
            expect(harness.cancel).not.toHaveBeenCalled();

            const tabEvent = harness.input.dispatch('keydown', { key: 'Tab' });

            expect(tabEvent.preventDefault).not.toHaveBeenCalled();
            expect(tabEvent.stopPropagation).not.toHaveBeenCalled();
            expect(harness.success).toHaveBeenCalledWith('Mario Rossi');
        } finally {
            harness.restore();
        }
    });

    test('ArrowDown evaluates a closed dropdown before highlighting the first item', () => {
        const harness = createEditorHarness(
            { allowCustomValue: true },
            '',
            ['Mario Rossi']
        );

        try {
            harness.awesomplete.isOpened = false;
            harness.awesomplete.index = -1;
            harness.awesomplete.evaluate.mockClear();

            const event = harness.input.dispatch('keydown', { key: 'ArrowDown' });

            expect(event.preventDefault).toHaveBeenCalledOnce();
            expect(event.stopPropagation).toHaveBeenCalledOnce();
            expect(harness.awesomplete.evaluate).toHaveBeenCalledOnce();
            expect(harness.awesomplete.index).toBe(0);
        } finally {
            harness.restore();
        }
    });

    test('Escape cancels the edit', () => {
        const harness = createEditorHarness({ allowCustomValue: true });

        try {
            const event = harness.input.dispatch('keydown', { key: 'Escape' });

            expect(event.preventDefault).toHaveBeenCalledOnce();
            expect(event.stopPropagation).toHaveBeenCalledOnce();
            expect(harness.cancel).toHaveBeenCalledOnce();
            expect(harness.success).not.toHaveBeenCalled();
        } finally {
            harness.restore();
        }
    });

    test('commits custom values according to options', () => {
        const customHarness = createEditorHarness({ allowCustomValue: true });

        try {
            customHarness.input.value = 'Custom department';
            customHarness.input.dispatch('blur');

            expect(customHarness.success).toHaveBeenCalledWith('Custom department');
        } finally {
            customHarness.restore();
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
    test('passes a simple list of text suggestions to Awesomplete', () => {
        expect(getAutocompleteSuggestionValues([
            'Human Resources',
            'Finance'
        ])).toEqual([
            'Human Resources',
            'Finance'
        ]);
    });

    test('maps maxOptions to Awesomplete maxItems', () => {
        expect(getAwesompleteOptions(['Low', 'Medium'], {}).maxItems).toBe(10);
        expect(getAwesompleteOptions(['Low', 'Medium'], {
            maxOptions: 1
        }).maxItems).toBe(1);
    });

    test('stores suggestion text directly without a separate hidden value', () => {
        expect(getAutocompleteSuggestionValues([
            'urgent',
            'review'
        ])).toEqual([
            'urgent',
            'review'
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
            preventDefault: true,
            stopPropagation: true
        });
        expect(getAutocompleteKeyAction('ArrowUp')).toEqual({
            action: 'suggestions',
            preventDefault: true,
            stopPropagation: true
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

    test('Escape cancels without reaching Tabulator', () => {
        expect(getAutocompleteKeyAction('Escape')).toEqual({
            action: 'cancel',
            preventDefault: true,
            stopPropagation: true
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

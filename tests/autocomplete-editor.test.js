import { describe, expect, test, vi } from 'vitest';
import { CrudHelper, ROW_STATE } from '../src/lib/crud-helper.js';
import {
    findAutocompleteMatch,
    getAutocompleteCursorPosition,
    getAutocompleteKeyAction,
    getAutocompleteSuggestionValues,
    getAwesompleteOptions,
    normalizeAutocompleteComparableValue,
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
            this.list = [...options.list];
            this.suggestions = this.list.map(value => ({
                label: value,
                value
            }));
            this.container = new ElementMock('div');
            this.ul = new ElementMock('ul');
            this.ul.offsetHeight = 120;
            this.ul.scrollHeight = 120;
            this.ul.setAttribute('hidden', '');
            this.container.append(input, this.ul);
            this.destroy = vi.fn();
            this.evaluate = vi.fn(() => {
                this.suggestions = this.list
                    .filter(value => {
                        return typeof this.options.filter === 'function'
                            ? this.options.filter({ value, label: value }, this.input.value)
                            : true;
                    })
                    .slice(0, this.options.maxItems)
                    .map(value => ({
                        label: value,
                        value
                    }));
                this.isOpened = this.suggestions.length > 0;
                this.ul.children = this.suggestions.map(suggestion => {
                    const item = new ElementMock('li');

                    item.textContent = suggestion.value;
                    item.parentNode = this.ul;

                    return item;
                });

                if (this.isOpened) {
                    this.ul.removeAttribute('hidden');
                    this.input.dispatch('awesomplete-open');
                }
            });
            this.input.addEventListener('input', () => this.evaluate());
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

        close() {
            this.isOpened = false;
            this.ul.setAttribute('hidden', '');
            this.input.dispatch('awesomplete-close');
        }

        highlight() {
            this.input.dispatch('awesomplete-highlight', {
                text: this.suggestions[this.index]
            });
        }
    }
}));

const { autocomplete } = await import('../src/lib/editors/autocomplete-editor.js');

const autocompleteCities = [
    'Amsterdam',
    'Athens',
    'Bari',
    'Barcelona',
    'Berlin',
    'Bilbao',
    'Bologna',
    'Bordeaux',
    'Boston',
    'Bremen',
    'Brussels',
    'Budapest'
];

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

class ElementMock extends EventTargetMock {
    constructor(tagName = 'div') {
        super();
        this.tagName = tagName.toUpperCase();
        this.nodeName = this.tagName;
        this.attributes = {};
        this.children = [];
        this.className = '';
        this.dataset = {};
        this.parentNode = null;
        this.placeholder = '';
        this.style = {};
        this.textContent = '';
        this.type = '';
        this.value = '';
        this.focus = vi.fn();
        this.offsetHeight = 0;
        this.scrollHeight = 0;
        this.setSelectionRange = vi.fn();
    }

    append(...children) {
        children.forEach(child => this.appendChild(child));
    }

    appendChild(child) {
        if (child.parentNode) {
            child.parentNode.removeChild(child);
        }

        child.parentNode = this;
        this.children.push(child);
        return child;
    }

    insertBefore(child, nextSibling) {
        if (child.parentNode) {
            child.parentNode.removeChild(child);
        }

        child.parentNode = this;
        const index = nextSibling ? this.children.indexOf(nextSibling) : -1;

        if (index === -1) {
            this.children.push(child);
        } else {
            this.children.splice(index, 0, child);
        }

        return child;
    }

    removeChild(child) {
        this.children = this.children.filter(current => current !== child);
        child.parentNode = null;
        return child;
    }

    contains(target) {
        if (target === this) return true;

        return this.children.some(child => child.contains?.(target));
    }

    setAttribute(name, value) {
        this.attributes[name] = String(value);

        if (name === 'hidden') {
            this.hidden = true;
        }
    }

    removeAttribute(name) {
        delete this.attributes[name];

        if (name === 'hidden') {
            this.hidden = false;
        }

        if (name === 'style') {
            this.style = {};
        }
    }

    hasAttribute(name) {
        return Object.prototype.hasOwnProperty.call(this.attributes, name);
    }

    getAttribute(name) {
        return this.attributes[name] ?? null;
    }

    getBoundingClientRect() {
        return this.rect || {
            top: 20,
            left: 30,
            right: 150,
            bottom: 50,
            width: 120,
            height: 30
        };
    }
}

class InputMock extends ElementMock {
    constructor() {
        super('input');
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
    values = ['Finance', 'Human Resources'],
    harnessOptions = {}
) => {
    const originalDocument = globalThis.document;
    const originalWindow = globalThis.window;
    const documentMock = new EventTargetMock();
    const windowMock = new EventTargetMock();
    const body = new ElementMock('body');
    const cellElement = {
        classList: createClassList(),
        dataset: {},
        children: []
    };
    const previousCell = {
        edit: vi.fn(),
        getColumn: () => ({
            getDefinition: () => ({ editor: 'input' })
        })
    };
    const nextCell = {
        edit: vi.fn(),
        getColumn: () => ({
            getDefinition: () => ({ editor: 'input' })
        })
    };
    let cell;
    const row = {
        getCells: () => harnessOptions.withRowNavigation
            ? [previousCell, cell, nextCell]
            : []
    };
    const table = {
        navigateNext: vi.fn(),
        navigatePrev: vi.fn()
    };

    cell = {
        getElement: () => cellElement,
        getRow: () => row,
        getTable: () => table,
        getValue: () => initialValue,
        navigateNext: vi.fn(),
        navigatePrev: vi.fn()
    };
    const success = vi.fn();
    const cancel = vi.fn();
    let render = null;

    documentMock.body = body;
    documentMock.createElement = vi.fn(() => new InputMock());
    windowMock.innerHeight = harnessOptions.innerHeight ?? 720;
    windowMock.innerWidth = harnessOptions.innerWidth ?? 1024;
    globalThis.document = documentMock;
    globalThis.window = windowMock;
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
        body,
        documentMock,
        input,
        nextCell,
        previousCell,
        table,
        awesomplete: awesompleteMock.instances[0],
        restore: () => {
            globalThis.document = originalDocument;
            globalThis.window = originalWindow;
        },
        success
    };
};

const flushDeferred = () => new Promise(resolve => {
    globalThis.setTimeout(resolve, 0);
});

const getSuggestionValues = awesomplete => {
    return awesomplete.suggestions.map(item => item.value);
};

describe('autocomplete editor options', () => {
    test('provides stable strict defaults', () => {
        expect(normalizeAutocompleteOptions()).toEqual(expect.objectContaining({
            allowEmpty: true,
            allowCustomValue: false,
            invalidBehavior: 'commitRaw',
            trimInput: true,
            maxOptions: 10,
            dropdownWidth: 420,
            caseSensitive: false,
            commitMatchedValue: true
        }));
    });

    test('supports case matching and matched commit overrides', () => {
        expect(normalizeAutocompleteOptions({
            caseSensitive: true,
            commitMatchedValue: false
        })).toEqual(expect.objectContaining({
            caseSensitive: true,
            commitMatchedValue: false
        }));
        expect(normalizeAutocompleteOptions({
            caseSensitive: 'true',
            commitMatchedValue: 0
        })).toEqual(expect.objectContaining({
            caseSensitive: false,
            commitMatchedValue: true
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

    test('Tab without a highlighted suggestion commits raw text and navigates next', async () => {
        const harness = createEditorHarness(
            { allowCustomValue: true },
            'Finance',
            ['Finance', 'Human Resources'],
            { withRowNavigation: true }
        );

        try {
            harness.input.value = 'Mar';
            const event = harness.input.dispatch('keydown', { key: 'Tab' });

            expect(event.preventDefault).toHaveBeenCalledOnce();
            expect(event.stopPropagation).toHaveBeenCalledOnce();
            expect(harness.success).toHaveBeenCalledWith('Mar');
            await flushDeferred();
            expect(harness.nextCell.edit).toHaveBeenCalledOnce();
            expect(harness.previousCell.edit).not.toHaveBeenCalled();
        } finally {
            harness.restore();
        }
    });

    test('Tab with a highlighted suggestion commits it and navigates next', async () => {
        const harness = createEditorHarness(
            { allowCustomValue: true },
            '',
            ['Mario Rossi', 'Maria Bianchi'],
            { withRowNavigation: true }
        );

        try {
            harness.input.value = 'Mar';
            harness.awesomplete.index = 0;
            const event = harness.input.dispatch('keydown', { key: 'Tab' });

            expect(event.preventDefault).toHaveBeenCalledOnce();
            expect(event.stopPropagation).toHaveBeenCalledOnce();
            expect(harness.success).toHaveBeenCalledWith('Mario Rossi');
            await flushDeferred();
            expect(harness.nextCell.edit).toHaveBeenCalledOnce();
            expect(harness.previousCell.edit).not.toHaveBeenCalled();
        } finally {
            harness.restore();
        }
    });

    test('Shift+Tab with a highlighted suggestion commits it and navigates previous', async () => {
        const harness = createEditorHarness(
            { allowCustomValue: true },
            '',
            ['Mario Rossi', 'Maria Bianchi'],
            { withRowNavigation: true }
        );

        try {
            harness.input.value = 'Mar';
            harness.awesomplete.index = 0;
            const event = harness.input.dispatch('keydown', {
                key: 'Tab',
                shiftKey: true
            });

            expect(event.preventDefault).toHaveBeenCalledOnce();
            expect(event.stopPropagation).toHaveBeenCalledOnce();
            expect(harness.success).toHaveBeenCalledWith('Mario Rossi');
            await flushDeferred();
            expect(harness.previousCell.edit).toHaveBeenCalledOnce();
            expect(harness.nextCell.edit).not.toHaveBeenCalled();
        } finally {
            harness.restore();
        }
    });

    test('Shift+Tab without a highlighted suggestion commits raw text and navigates previous', async () => {
        const harness = createEditorHarness(
            { allowCustomValue: true },
            'Finance',
            ['Finance', 'Human Resources'],
            { withRowNavigation: true }
        );

        try {
            harness.input.value = 'Mar';
            const event = harness.input.dispatch('keydown', {
                key: 'Tab',
                shiftKey: true
            });

            expect(event.preventDefault).toHaveBeenCalledOnce();
            expect(event.stopPropagation).toHaveBeenCalledOnce();
            expect(harness.success).toHaveBeenCalledWith('Mar');
            await flushDeferred();
            expect(harness.previousCell.edit).toHaveBeenCalledOnce();
            expect(harness.nextCell.edit).not.toHaveBeenCalled();
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

            expect(event.preventDefault).toHaveBeenCalledOnce();
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
                target: harness.awesomplete.ul.children[0]
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

            expect(event.preventDefault).toHaveBeenCalledOnce();
            expect(event.stopPropagation).toHaveBeenCalledOnce();
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

            expect(event.preventDefault).toHaveBeenCalledOnce();
            expect(event.stopPropagation).toHaveBeenCalledOnce();
            expect(harness.cancel).toHaveBeenCalledOnce();
            expect(harness.success).not.toHaveBeenCalled();
        } finally {
            harness.restore();
        }
    });

    test('typing an exact suggestion commits the canonical value by default', () => {
        const harness = createEditorHarness({
            allowCustomValue: false,
            invalidBehavior: 'cancel'
        });

        try {
            harness.input.value = 'finance';
            harness.input.dispatch('keydown', { key: 'Enter' });

            expect(harness.success).toHaveBeenCalledWith('Finance');
            expect(harness.cancel).not.toHaveBeenCalled();
        } finally {
            harness.restore();
        }
    });

    test('commitMatchedValue false keeps the typed value when no suggestion was selected', () => {
        const harness = createEditorHarness({
            allowCustomValue: false,
            invalidBehavior: 'commitRaw',
            commitMatchedValue: false
        });

        try {
            harness.input.value = 'finance';
            harness.input.dispatch('keydown', { key: 'Enter' });

            expect(harness.success).toHaveBeenCalledWith('finance');
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

            expect(tabEvent.preventDefault).toHaveBeenCalledOnce();
            expect(tabEvent.stopPropagation).toHaveBeenCalledOnce();
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

    test('visually completes a typed prefix with the canonical suffix selected', () => {
        const harness = createEditorHarness({}, '', ['Finance', 'Human Resources']);
        const inputEvents = vi.fn();

        try {
            harness.input.addEventListener('input', inputEvents);
            harness.input.setSelectionRange.mockClear();
            harness.awesomplete.evaluate.mockClear();
            harness.input.value = 'fina';
            harness.input.dispatch('input', {
                inputType: 'insertText'
            });

            expect(harness.input.value).toBe('Finance');
            expect(harness.input.setSelectionRange).toHaveBeenCalledWith(4, 7);
            expect(inputEvents).toHaveBeenCalledOnce();
            expect(harness.awesomplete.evaluate).toHaveBeenCalledOnce();
        } finally {
            harness.restore();
        }
    });

    test.each([
        ['B'],
        ['b']
    ])('inline completion for %s keeps the dropdown filtered by typed prefix', typedValue => {
        const harness = createEditorHarness({
            maxOptions: 5,
            caseSensitive: false,
            commitMatchedValue: true
        }, '', autocompleteCities);

        try {
            harness.input.setSelectionRange.mockClear();
            harness.input.value = typedValue;
            harness.input.dispatch('input', {
                inputType: 'insertText'
            });

            expect(harness.input.value).toBe('Bari');
            expect(harness.input.setSelectionRange).toHaveBeenCalledWith(1, 4);
            expect(getSuggestionValues(harness.awesomplete)).toEqual([
                'Bari',
                'Barcelona',
                'Berlin',
                'Bilbao',
                'Bologna'
            ]);
            expect(getSuggestionValues(harness.awesomplete)).not.toEqual(['Bari']);
        } finally {
            harness.restore();
        }
    });

    test('progressive typing replaces the selected suffix and keeps all matching suggestions', () => {
        const harness = createEditorHarness({
            maxOptions: 5,
            caseSensitive: false,
            commitMatchedValue: true
        }, '', autocompleteCities);

        try {
            harness.input.value = 'B';
            harness.input.dispatch('input', {
                inputType: 'insertText'
            });
            harness.input.setSelectionRange.mockClear();

            harness.input.value = 'Bo';
            harness.input.dispatch('input', {
                inputType: 'insertText'
            });

            expect(harness.input.value).toBe('Bologna');
            expect(harness.input.setSelectionRange).toHaveBeenCalledWith(2, 7);
            expect(getSuggestionValues(harness.awesomplete)).toEqual([
                'Bologna',
                'Bordeaux',
                'Boston'
            ]);
        } finally {
            harness.restore();
        }
    });

    test('an explicitly selected suggestion wins over the first canonical completion', () => {
        const harness = createEditorHarness({
            maxOptions: 5,
            caseSensitive: false,
            commitMatchedValue: true
        }, '', autocompleteCities);

        try {
            harness.input.value = 'B';
            harness.input.dispatch('input', {
                inputType: 'insertText'
            });
            harness.input.dispatch('awesomplete-selectcomplete', {
                text: { value: 'Berlin' }
            });

            expect(harness.success).toHaveBeenCalledWith('Berlin');
            expect(harness.success).not.toHaveBeenCalledWith('Bari');
        } finally {
            harness.restore();
        }
    });

    test('ArrowDown can select a non-first suggestion from the full prefix dropdown', () => {
        const harness = createEditorHarness({
            maxOptions: 5,
            caseSensitive: false,
            commitMatchedValue: true
        }, '', autocompleteCities);

        try {
            harness.input.value = 'B';
            harness.input.dispatch('input', {
                inputType: 'insertText'
            });

            harness.input.dispatch('keydown', { key: 'ArrowDown' });
            harness.input.dispatch('keydown', { key: 'ArrowDown' });
            harness.input.dispatch('keydown', { key: 'ArrowDown' });
            harness.input.dispatch('keydown', { key: 'Enter' });

            expect(harness.success).toHaveBeenCalledWith('Berlin');
        } finally {
            harness.restore();
        }
    });

    test.each([
        ['Enter', false],
        ['Tab', false],
        ['Tab', true],
        ['blur', false]
    ])('B committed with %s saves the first canonical match', async (key, shiftKey) => {
        const harness = createEditorHarness({
            maxOptions: 5,
            caseSensitive: false,
            commitMatchedValue: true
        }, '', autocompleteCities, {
            withRowNavigation: key === 'Tab'
        });

        try {
            harness.input.value = 'B';
            harness.input.dispatch('input', {
                inputType: 'insertText'
            });

            if (key === 'blur') {
                harness.input.dispatch('blur');
            } else {
                harness.input.dispatch('keydown', { key, shiftKey });
            }

            expect(harness.success).toHaveBeenCalledWith('Bari');

            if (key === 'Tab') {
                await flushDeferred();
                const targetCell = shiftKey
                    ? harness.previousCell
                    : harness.nextCell;

                expect(targetCell.edit).toHaveBeenCalledOnce();
            }
        } finally {
            harness.restore();
        }
    });

    test('commitMatchedValue false preserves typed text while keeping the full dropdown', () => {
        const harness = createEditorHarness({
            maxOptions: 5,
            caseSensitive: false,
            commitMatchedValue: false
        }, '', autocompleteCities);

        try {
            harness.input.value = 'B';
            harness.input.dispatch('input', {
                inputType: 'insertText'
            });

            expect(harness.input.value).toBe('B');
            expect(getSuggestionValues(harness.awesomplete)).toEqual([
                'Bari',
                'Barcelona',
                'Berlin',
                'Bilbao',
                'Bologna'
            ]);

            harness.input.dispatch('keydown', { key: 'ArrowDown' });
            harness.input.dispatch('keydown', { key: 'ArrowDown' });
            harness.input.dispatch('keydown', { key: 'ArrowDown' });
            harness.input.dispatch('keydown', { key: 'Enter' });

            expect(harness.success).toHaveBeenCalledWith('Berlin');
        } finally {
            harness.restore();
        }
    });

    test('delete input updates the dropdown without reapplying inline completion', () => {
        const harness = createEditorHarness({
            maxOptions: 5,
            caseSensitive: false,
            commitMatchedValue: true
        }, '', autocompleteCities);

        try {
            harness.input.setSelectionRange.mockClear();
            harness.input.value = 'Bo';
            harness.input.dispatch('input', {
                inputType: 'deleteContentBackward'
            });

            expect(harness.input.value).toBe('Bo');
            expect(harness.input.setSelectionRange).not.toHaveBeenCalled();
            expect(getSuggestionValues(harness.awesomplete)).toEqual([
                'Bologna',
                'Bordeaux',
                'Boston'
            ]);
        } finally {
            harness.restore();
        }
    });

    test('case-sensitive autocomplete only completes matching case', () => {
        const matchingHarness = createEditorHarness({
            caseSensitive: true
        }, '', ['Finance']);

        try {
            matchingHarness.input.value = 'Fina';
            matchingHarness.input.dispatch('input', {
                inputType: 'insertText'
            });

            expect(matchingHarness.input.value).toBe('Finance');
        } finally {
            matchingHarness.restore();
        }

        const lowercaseHarness = createEditorHarness({
            caseSensitive: true
        }, '', ['Finance']);

        try {
            lowercaseHarness.input.value = 'fina';
            lowercaseHarness.input.dispatch('input', {
                inputType: 'insertText'
            });

            expect(lowercaseHarness.input.value).toBe('fina');
        } finally {
            lowercaseHarness.restore();
        }
    });

    test.each([
        ['fina', 'Enter', null],
        ['FINA', 'Enter', null],
        ['finance', 'Enter', null],
        ['fina', 'Tab', 'next'],
        ['FINA', 'Tab', 'prev'],
        ['finance', 'blur', null]
    ])('%s committed with %s saves the canonical autocomplete value', async (typedValue, key, direction) => {
        const harness = createEditorHarness(
            {},
            '',
            ['Finance', 'Human Resources'],
            { withRowNavigation: key === 'Tab' }
        );

        try {
            harness.input.value = typedValue;

            if (key === 'blur') {
                harness.input.dispatch('blur');
            } else {
                harness.input.dispatch('keydown', {
                    key,
                    shiftKey: direction === 'prev'
                });
            }

            expect(harness.success).toHaveBeenCalledWith('Finance');

            if (direction === 'next') {
                await flushDeferred();
                expect(harness.nextCell.edit).toHaveBeenCalledOnce();
            } else if (direction === 'prev') {
                await flushDeferred();
                expect(harness.previousCell.edit).toHaveBeenCalledOnce();
            }
        } finally {
            harness.restore();
        }
    });

    test('explicitly highlighted suggestions take precedence over automatic prefix matching', () => {
        const harness = createEditorHarness(
            { allowCustomValue: true },
            '',
            ['Finance', 'Facilities']
        );

        try {
            harness.input.value = 'F';
            harness.awesomplete.index = 1;
            harness.input.dispatch('keydown', { key: 'Enter' });

            expect(harness.success).toHaveBeenCalledWith('Facilities');
        } finally {
            harness.restore();
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

    test('renders the suggestions dropdown outside the cell under document body', () => {
        const harness = createEditorHarness();

        try {
            expect(harness.body.children).toContain(harness.awesomplete.ul);
            expect(harness.awesomplete.ul.parentNode).toBe(harness.body);
            expect(harness.awesomplete.ul.className).toContain('amb-autocomplete-dropdown');
            expect(harness.cellElement.children).not.toContain(harness.awesomplete.ul);
        } finally {
            harness.restore();
        }
    });

    test('positions the floating dropdown below the input when there is space', () => {
        const harness = createEditorHarness({}, '', ['Milano'], {
            innerHeight: 800
        });

        try {
            harness.input.rect = {
                top: 120,
                left: 40,
                right: 180,
                bottom: 150,
                width: 140,
                height: 30
            };
            harness.awesomplete.evaluate();

            expect(harness.awesomplete.ul.dataset.ambPlacement).toBe('bottom');
            expect(harness.awesomplete.ul.style.top).toBe('150px');
            expect(harness.awesomplete.ul.style.left).toBe('40px');
        } finally {
            harness.restore();
        }
    });

    test('positions the floating dropdown above the input when there is not enough space below', () => {
        const harness = createEditorHarness({}, '', ['Milano'], {
            innerHeight: 240
        });

        try {
            harness.input.rect = {
                top: 180,
                left: 40,
                right: 180,
                bottom: 210,
                width: 140,
                height: 30
            };
            harness.awesomplete.ul.offsetHeight = 120;
            harness.awesomplete.evaluate();

            expect(harness.awesomplete.ul.dataset.ambPlacement).toBe('top');
            expect(harness.awesomplete.ul.style.top).toBe('60px');
        } finally {
            harness.restore();
        }
    });

    test('keeps the floating dropdown at least as wide as the input', () => {
        const harness = createEditorHarness({ dropdownWidth: 80 });

        try {
            harness.input.rect = {
                top: 20,
                left: 20,
                right: 240,
                bottom: 50,
                width: 220,
                height: 30
            };
            harness.awesomplete.evaluate();

            expect(Number.parseFloat(harness.awesomplete.ul.style.width))
                .toBeGreaterThanOrEqual(220);
            expect(harness.awesomplete.ul.style.minWidth).toBe('220px');
        } finally {
            harness.restore();
        }
    });

    test('Escape removes the floating dropdown from document body', () => {
        const harness = createEditorHarness({ allowCustomValue: true });

        try {
            expect(harness.body.children).toContain(harness.awesomplete.ul);

            harness.input.dispatch('keydown', { key: 'Escape' });

            expect(harness.body.children).not.toContain(harness.awesomplete.ul);
            expect(harness.cancel).toHaveBeenCalledOnce();
        } finally {
            harness.restore();
        }
    });

    test('click selection removes the floating dropdown from document body', () => {
        const harness = createEditorHarness();

        try {
            harness.input.dispatch('awesomplete-selectcomplete', {
                text: { value: 'Human Resources' }
            });

            expect(harness.body.children).not.toContain(harness.awesomplete.ul);
            expect(harness.success).toHaveBeenCalledWith('Human Resources');
        } finally {
            harness.restore();
        }
    });

    test('Enter and Tab commits remove the floating dropdown from document body', () => {
        const enterHarness = createEditorHarness({ allowCustomValue: true });

        try {
            enterHarness.input.value = 'Operations';
            enterHarness.input.dispatch('keydown', { key: 'Enter' });

            expect(enterHarness.body.children).not.toContain(enterHarness.awesomplete.ul);
        } finally {
            enterHarness.restore();
        }

        const tabHarness = createEditorHarness({ allowCustomValue: true });

        try {
            tabHarness.input.value = 'Operations';
            tabHarness.input.dispatch('keydown', { key: 'Tab' });

            expect(tabHarness.body.children).not.toContain(tabHarness.awesomplete.ul);
        } finally {
            tabHarness.restore();
        }
    });

    test('blur commit removes the floating dropdown from document body', () => {
        const harness = createEditorHarness({ allowCustomValue: true });

        try {
            harness.input.value = 'Operations';
            harness.input.dispatch('blur');

            expect(harness.body.children).not.toContain(harness.awesomplete.ul);
            expect(harness.success).toHaveBeenCalledWith('Operations');
        } finally {
            harness.restore();
        }
    });

    test('scroll repositions and resize closes the floating dropdown cleanly', () => {
        const harness = createEditorHarness();

        try {
            harness.input.rect = {
                top: 80,
                left: 60,
                right: 200,
                bottom: 110,
                width: 140,
                height: 30
            };
            harness.documentMock.dispatch('scroll', { target: harness.documentMock });

            expect(harness.awesomplete.ul.style.top).toBe('110px');

            globalThis.window.dispatch('resize');

            expect(harness.awesomplete.isOpened).toBe(false);
            expect(harness.awesomplete.ul.hidden).toBe(true);
            expect(harness.body.children).toContain(harness.awesomplete.ul);
        } finally {
            harness.restore();
        }
    });

    test('opening another autocomplete editor removes the previous floating dropdown and listeners', () => {
        const firstHarness = createEditorHarness();
        const firstDropdown = firstHarness.awesomplete.ul;
        const firstResizeListeners = globalThis.window.listeners.get('resize') || [];

        try {
            expect(firstHarness.body.children).toContain(firstDropdown);
            expect(firstResizeListeners).toHaveLength(1);

            const secondHarness = createEditorHarness();

            try {
                expect(firstHarness.body.children).not.toContain(firstDropdown);
                expect(secondHarness.body.children).toContain(secondHarness.awesomplete.ul);
                expect((globalThis.window.listeners.get('resize') || []))
                    .toHaveLength(1);
            } finally {
                secondHarness.restore();
            }
        } finally {
            firstHarness.restore();
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

    test.each([
        ['fina', 'Finance'],
        ['FINA', 'Finance'],
        ['finance', 'Finance'],
        ['FINANCE', 'Finance']
    ])('finds a case-insensitive canonical prefix match for %s', (typedValue, expected) => {
        expect(findAutocompleteMatch([
            'Finance',
            'Human Resources',
            'Information Technology'
        ], typedValue)).toBe(expected);
    });

    test.each([
        ['Fina', 'Finance'],
        ['fina', null],
        ['FINA', null]
    ])('respects case-sensitive prefix matching for %s', (typedValue, expected) => {
        expect(findAutocompleteMatch(['Finance'], typedValue, {
            caseSensitive: true
        })).toBe(expected);
    });

    test('normalizes comparable values without changing the canonical suggestion', () => {
        expect(normalizeAutocompleteComparableValue('Finance')).toBe('finance');
        expect(normalizeAutocompleteComparableValue('Finance', {
            caseSensitive: true
        })).toBe('Finance');
        expect(findAutocompleteMatch(['Finance'], 'fina')).toBe('Finance');
    });

    test('filters Awesomplete suggestions with the configured case sensitivity', () => {
        const insensitiveOptions = getAwesompleteOptions(['Finance'], {});
        const sensitiveOptions = getAwesompleteOptions(['Finance'], {
            caseSensitive: true
        });

        expect(insensitiveOptions.filter({ value: 'Finance' }, 'fina')).toBe(true);
        expect(sensitiveOptions.filter({ value: 'Finance' }, 'fina')).toBe(false);
        expect(sensitiveOptions.filter({ value: 'Finance' }, 'Fina')).toBe(true);
    });

    test('keeps maxOptions limiting the rendered dropdown', () => {
        const harness = createEditorHarness({ maxOptions: 1 }, '', [
            'Finance',
            'Facilities',
            'Field Operations'
        ]);

        try {
            harness.input.value = 'F';
            harness.awesomplete.evaluate();

            expect(harness.awesomplete.suggestions.map(item => item.value))
                .toEqual(['Finance']);
        } finally {
            harness.restore();
        }
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
            values: ['Finance'],
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
            values: ['Finance'],
            options: {
                allowCustomValue: false,
                invalidBehavior: 'cancel'
            }
        })).toEqual({
            action: 'cancel'
        });
    });

    test('commits canonical exact and prefix matches by default', () => {
        expect(resolveAutocompleteCommit({
            selectedValue: '',
            typedValue: 'FINA',
            values: ['Finance']
        })).toEqual({
            action: 'success',
            value: 'Finance'
        });
        expect(resolveAutocompleteCommit({
            selectedValue: '',
            typedValue: 'finance',
            values: ['Finance']
        })).toEqual({
            action: 'success',
            value: 'Finance'
        });
    });

    test('commitMatchedValue false preserves the previous raw typed behavior', () => {
        expect(resolveAutocompleteCommit({
            selectedValue: '',
            typedValue: 'finance',
            values: ['Finance'],
            options: {
                commitMatchedValue: false,
                allowCustomValue: false,
                invalidBehavior: 'commitRaw'
            }
        })).toEqual({
            action: 'success',
            value: 'finance'
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

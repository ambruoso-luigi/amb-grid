import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import {
    decimal as createDecimalEditor,
    integer as createIntegerEditor
} from '../src/lib/editors/number-editors.js';

class InputMock {
    constructor() {
        this.className = '';
        this.inputMode = '';
        this.listeners = new Map();
        this.maxLength = undefined;
        this.selectionEnd = 0;
        this.selectionStart = 0;
        this.type = '';
        this.value = '';
        this.focus = vi.fn();
        this.select = vi.fn();
        this.setSelectionRange = vi.fn((start, end) => {
            this.selectionStart = start;
            this.selectionEnd = end;
        });
    }

    addEventListener(type, listener) {
        if (!this.listeners.has(type)) {
            this.listeners.set(type, []);
        }

        this.listeners.get(type).push(listener);
    }

    dispatch(type, event = {}) {
        const dispatchedEvent = {
            target: this,
            preventDefault: vi.fn(),
            stopPropagation: vi.fn(),
            ...event
        };

        (this.listeners.get(type) || []).forEach(listener => {
            listener(dispatchedEvent);
        });

        return dispatchedEvent;
    }
}

const createHarness = ({
    editorFactory,
    initialValue = 12,
    options = {}
}) => {
    const cell = {
        getValue: () => initialValue
    };
    const success = vi.fn();
    const cancel = vi.fn();
    const editor = editorFactory(options);
    const input = editor(cell, callback => callback(), success, cancel);

    return {
        cancel,
        input,
        success
    };
};

describe('numeric editors emptyValue option', () => {
    const originalDocument = globalThis.document;

    beforeEach(() => {
        globalThis.document = {
            createElement: () => new InputMock()
        };
    });

    afterEach(() => {
        globalThis.document = originalDocument;
        vi.restoreAllMocks();
    });

    test('integer with emptyValue 0 saves 0 when the field is cleared', () => {
        const harness = createHarness({
            editorFactory: createIntegerEditor,
            options: {
                allowEmpty: false,
                emptyValue: 0
            }
        });

        harness.input.value = '';
        harness.input.dispatch('blur');

        expect(harness.success).toHaveBeenCalledWith(0);
        expect(harness.cancel).not.toHaveBeenCalled();
    });

    test('decimal with emptyValue 0 saves 0 when the field is cleared', () => {
        const harness = createHarness({
            editorFactory: createDecimalEditor,
            options: {
                allowEmpty: false,
                emptyValue: 0
            }
        });

        harness.input.value = '';
        harness.input.dispatch('blur');

        expect(harness.success).toHaveBeenCalledWith(0);
        expect(harness.cancel).not.toHaveBeenCalled();
    });

    test('integer with emptyValue null saves null when the field is cleared', () => {
        const harness = createHarness({
            editorFactory: createIntegerEditor,
            options: {
                allowEmpty: true,
                emptyValue: null
            }
        });

        harness.input.value = '';
        harness.input.dispatch('blur');

        expect(harness.success).toHaveBeenCalledWith(null);
    });

    test('decimal with emptyValue null saves null when the field is cleared', () => {
        const harness = createHarness({
            editorFactory: createDecimalEditor,
            options: {
                allowEmpty: true,
                emptyValue: null
            }
        });

        harness.input.value = '';
        harness.input.dispatch('blur');

        expect(harness.success).toHaveBeenCalledWith(null);
    });

    test('integer without emptyValue keeps the existing allowEmpty false behavior', () => {
        const harness = createHarness({
            editorFactory: createIntegerEditor,
            options: {
                allowEmpty: false
            }
        });

        harness.input.value = '';
        harness.input.dispatch('blur');

        expect(harness.cancel).toHaveBeenCalledOnce();
        expect(harness.success).not.toHaveBeenCalled();
    });

    test('decimal without emptyValue keeps the existing allowEmpty false behavior', () => {
        const harness = createHarness({
            editorFactory: createDecimalEditor,
            options: {
                allowEmpty: false
            }
        });

        harness.input.value = '';
        harness.input.dispatch('blur');

        expect(harness.cancel).toHaveBeenCalledOnce();
        expect(harness.success).not.toHaveBeenCalled();
    });

    test('allowEmpty true without emptyValue still saves an empty string', () => {
        const integerHarness = createHarness({
            editorFactory: createIntegerEditor,
            options: {
                allowEmpty: true
            }
        });
        const decimalHarness = createHarness({
            editorFactory: createDecimalEditor,
            options: {
                allowEmpty: true
            }
        });

        integerHarness.input.value = '';
        decimalHarness.input.value = '';
        integerHarness.input.dispatch('blur');
        decimalHarness.input.dispatch('blur');

        expect(integerHarness.success).toHaveBeenCalledWith('');
        expect(decimalHarness.success).toHaveBeenCalledWith('');
    });

    test('valid numeric values continue to be saved as numbers', () => {
        const integerHarness = createHarness({
            editorFactory: createIntegerEditor
        });
        const decimalHarness = createHarness({
            editorFactory: createDecimalEditor
        });

        integerHarness.input.value = '42';
        decimalHarness.input.value = '12,50';
        integerHarness.input.dispatch('blur');
        decimalHarness.input.dispatch('blur');

        expect(integerHarness.success).toHaveBeenCalledWith(42);
        expect(decimalHarness.success).toHaveBeenCalledWith(12.5);
    });

    test('invalid values continue to cancel as before', () => {
        const integerHarness = createHarness({
            editorFactory: createIntegerEditor,
            options: {
                min: 10
            }
        });
        const decimalHarness = createHarness({
            editorFactory: createDecimalEditor,
            options: {
                max: 20
            }
        });

        integerHarness.input.value = '5';
        decimalHarness.input.value = '25';
        integerHarness.input.dispatch('blur');
        decimalHarness.input.dispatch('blur');

        expect(integerHarness.cancel).toHaveBeenCalledOnce();
        expect(decimalHarness.cancel).toHaveBeenCalledOnce();
        expect(integerHarness.success).not.toHaveBeenCalled();
        expect(decimalHarness.success).not.toHaveBeenCalled();
    });

    test('Escape continues to cancel the edit', () => {
        const harness = createHarness({
            editorFactory: createIntegerEditor,
            options: {
                emptyValue: 0
            }
        });

        harness.input.value = '';
        harness.input.dispatch('keydown', { key: 'Escape' });

        expect(harness.cancel).toHaveBeenCalledOnce();
        expect(harness.success).not.toHaveBeenCalled();
    });

    test('Enter continues to confirm the edit', () => {
        const harness = createHarness({
            editorFactory: createDecimalEditor,
            options: {
                emptyValue: 0
            }
        });

        harness.input.value = '';
        harness.input.dispatch('keydown', { key: 'Enter' });

        expect(harness.success).toHaveBeenCalledWith(0);
        expect(harness.cancel).not.toHaveBeenCalled();
    });
});

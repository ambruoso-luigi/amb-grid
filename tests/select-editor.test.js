import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { select } from '../src/lib/editors/select-editor.js';

class SelectMock {
    constructor() {
        this.className = '';
        this.children = [];
        this.listeners = new Map();
        this.value = '';
    }

    appendChild(child) { this.children.push(child); }
    addEventListener(type, listener) {
        this.listeners.set(type, [...(this.listeners.get(type) || []), listener]);
    }
    focus() {}
    dispatch(type, event = {}) {
        const result = {
            preventDefault: vi.fn(), stopPropagation: vi.fn(), stopImmediatePropagation: vi.fn(), ...event
        };
        (this.listeners.get(type) || []).forEach(listener => listener(result));
        return result;
    }
}

describe('select editor keyboard close actions', () => {
    const originalDocument = globalThis.document;

    beforeEach(() => {
        globalThis.document = {
            createElement: () => new SelectMock()
        };
    });

    afterEach(() => {
        globalThis.document = originalDocument;
        vi.restoreAllMocks();
    });

    const createHarness = () => {
        const success = vi.fn();
        const cancel = vi.fn();
        const editor = select({ options: ['one', 'two'] });
        const control = editor({ getValue: () => 'one' }, callback => callback(), success, cancel);
        return { control, success, cancel };
    };

    test('Enter commits exactly once even when followed by blur', () => {
        const { control, success, cancel } = createHarness();
        control.value = 'two';
        control.dispatch('keydown', { key: 'Enter' });
        control.dispatch('blur');
        expect(success).toHaveBeenCalledTimes(1);
        expect(success).toHaveBeenCalledWith('two');
        expect(cancel).not.toHaveBeenCalled();
    });

    test('Escape cancels exactly once and prevents later blur commit', () => {
        const { control, success, cancel } = createHarness();
        control.dispatch('keydown', { key: 'Escape' });
        control.dispatch('blur');
        expect(cancel).toHaveBeenCalledTimes(1);
        expect(success).not.toHaveBeenCalled();
    });

    test('change commits exactly once even when followed by blur', () => {
        const { control, success } = createHarness();
        control.value = 'two';
        control.dispatch('change');
        control.dispatch('blur');
        expect(success).toHaveBeenCalledOnce();
        expect(success).toHaveBeenCalledWith('two');
    });
});

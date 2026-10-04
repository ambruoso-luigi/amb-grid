import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { select } from '../src/lib/editors/select-editor.js';

class SelectMock {
    constructor({ showPicker } = {}) {
        this.className = '';
        this.children = [];
        this.listeners = new Map();
        this.value = '';
        this.focus = vi.fn();
        if (showPicker) this.showPicker = showPicker;
    }

    appendChild(child) { this.children.push(child); }
    addEventListener(type, listener) {
        this.listeners.set(type, [...(this.listeners.get(type) || []), listener]);
    }
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
    let pickerFactory;

    beforeEach(() => {
        pickerFactory = undefined;
        globalThis.document = {
            createElement: () => new SelectMock({ showPicker: pickerFactory?.() })
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

    test('focuses and opens the native picker when supported', () => {
        const showPicker = vi.fn();
        pickerFactory = () => showPicker;

        const { control } = createHarness();

        expect(control.focus).toHaveBeenCalledOnce();
        expect(showPicker).toHaveBeenCalledOnce();
    });

    test('keeps the focused native select usable when showPicker is unavailable or rejected', () => {
        pickerFactory = () => vi.fn(() => {
            throw new Error('NotAllowedError');
        });

        expect(() => createHarness()).not.toThrow();
        expect(createHarness().control.focus).toHaveBeenCalledOnce();
    });

    test('ArrowDown browses options without committing, then Enter commits once', async () => {
        const { control, success, cancel } = createHarness();
        const event = control.dispatch('keydown', { key: 'ArrowDown' });
        control.value = 'two';
        control.dispatch('change');

        expect(event.stopPropagation).toHaveBeenCalledOnce();
        expect(event.preventDefault).not.toHaveBeenCalled();
        expect(success).not.toHaveBeenCalled();

        control.dispatch('keydown', { key: 'Enter' });
        control.dispatch('blur');

        expect(success).toHaveBeenCalledOnce();
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

    test('Escape keyup cancels option navigation without a later lateral-key commit', () => {
        const { control, success, cancel } = createHarness();
        control.dispatch('keydown', { key: 'ArrowDown' });
        control.value = 'two';
        control.dispatch('change');
        control.dispatch('keyup', { key: 'Escape' });
        const lateralEvent = control.dispatch('keydown', { key: 'ArrowLeft' });
        control.dispatch('blur');

        expect(cancel).toHaveBeenCalledOnce();
        expect(success).not.toHaveBeenCalled();
        expect(lateralEvent.preventDefault).toHaveBeenCalledOnce();
    });

    test('a mouse selection commits after keyboard option navigation and a later blur does not duplicate it', () => {
        const { control, success } = createHarness();
        control.dispatch('keydown', { key: 'ArrowDown' });
        control.value = 'two';
        control.dispatch('change');
        expect(success).not.toHaveBeenCalled();

        control.dispatch('pointerdown');
        control.value = 'two';
        control.dispatch('change');
        control.dispatch('blur');
        expect(success).toHaveBeenCalledOnce();
        expect(success).toHaveBeenCalledWith('two');
    });
});

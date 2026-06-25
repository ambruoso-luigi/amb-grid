import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { largeText } from '../src/lib/editors/large-text-editor.js';

const createElement = tagName => {
    const listeners = new Map();
    const element = {
        tagName,
        children: [],
        parentNode: null,
        style: {},
        value: '',
        append(...children) {
            children.forEach(child => this.appendChild(child));
        },
        appendChild(child) {
            child.parentNode = this;
            this.children.push(child);
        },
        addEventListener(type, listener) {
            listeners.set(type, listener);
        },
        dispatch(type, event = {}) {
            return listeners.get(type)?.({
                target: this,
                preventDefault: vi.fn(),
                stopPropagation: vi.fn(),
                ...event
            });
        },
        focus() {},
        setSelectionRange() {},
        remove() {
            if (!this.parentNode) return;

            this.parentNode.children = this.parentNode.children.filter(child => child !== this);
            this.parentNode = null;
        }
    };

    return element;
};

const createHarness = (options = {}) => {
    const success = vi.fn();
    const cancel = vi.fn();
    const editor = largeText(options);
    const placeholder = editor(
        { getValue: () => 'Original notes' },
        callback => callback(),
        success,
        cancel
    );
    const overlay = globalThis.document.body.children[0];
    const panel = overlay.children[0];

    return {
        cancel,
        cancelButton: panel.children[2].children[0],
        overlay,
        panel,
        placeholder,
        saveButton: panel.children[2].children[1],
        success,
        textarea: panel.children[1]
    };
};

describe('large text editor', () => {
    const originalDocument = globalThis.document;

    beforeEach(() => {
        globalThis.document = {
            body: createElement('body'),
            createElement
        };
    });

    afterEach(() => {
        globalThis.document = originalDocument;
        vi.restoreAllMocks();
    });

    test('closes with cancel when the backdrop is clicked by default', () => {
        const harness = createHarness();

        harness.overlay.dispatch('mousedown');

        expect(harness.cancel).toHaveBeenCalledOnce();
        expect(harness.success).not.toHaveBeenCalled();
        expect(globalThis.document.body.children).toHaveLength(0);
    });

    test('does not close when backdrop closing is disabled', () => {
        const harness = createHarness({
            closeOnBackdropClick: false
        });
        const preventDefault = vi.fn();
        const stopPropagation = vi.fn();

        harness.overlay.dispatch('mousedown', {
            preventDefault,
            stopPropagation
        });

        expect(preventDefault).toHaveBeenCalledOnce();
        expect(stopPropagation).toHaveBeenCalledOnce();
        expect(harness.cancel).not.toHaveBeenCalled();
        expect(harness.success).not.toHaveBeenCalled();
        expect(globalThis.document.body.children).toContain(harness.overlay);
    });

    test('Escape still cancels the editor', () => {
        const harness = createHarness({
            closeOnBackdropClick: false
        });

        harness.textarea.dispatch('keydown', { key: 'Escape' });

        expect(harness.cancel).toHaveBeenCalledOnce();
        expect(harness.success).not.toHaveBeenCalled();
    });

    test('Save and Ctrl+Enter still commit the edited text', () => {
        const saveHarness = createHarness();

        saveHarness.textarea.value = 'Saved with button';
        saveHarness.saveButton.dispatch('click');

        expect(saveHarness.success).toHaveBeenCalledWith('Saved with button');
        expect(saveHarness.cancel).not.toHaveBeenCalled();

        const keyboardHarness = createHarness();

        keyboardHarness.textarea.value = 'Saved with keyboard';
        keyboardHarness.textarea.dispatch('keydown', {
            key: 'Enter',
            ctrlKey: true
        });

        expect(keyboardHarness.success).toHaveBeenCalledWith('Saved with keyboard');
        expect(keyboardHarness.cancel).not.toHaveBeenCalled();
    });

    test('Cancel still discards the edited text', () => {
        const harness = createHarness();

        harness.textarea.value = 'Discard me';
        harness.cancelButton.dispatch('click');

        expect(harness.cancel).toHaveBeenCalledOnce();
        expect(harness.success).not.toHaveBeenCalled();
    });
});

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { largeText } from '../src/lib/editors/large-text-editor.js';

const createElement = tagName => {
    const listeners = new Map();
    return {
        tagName,
        children: [],
        parentNode: null,
        style: {},
        attributes: {},
        value: '',
        append(...children) { children.forEach(child => this.appendChild(child)); },
        appendChild(child) { child.parentNode = this; this.children.push(child); },
        setAttribute(name, value) { this.attributes[name] = value; },
        addEventListener(type, listener) { listeners.set(type, listener); },
        removeEventListener() {},
        dispatch(type, event = {}) {
            return listeners.get(type)?.({
                target: this,
                preventDefault: vi.fn(),
                stopPropagation: vi.fn(),
                ...event
            });
        },
        focus() { globalThis.document.activeElement = this; },
        setSelectionRange() {},
        remove() {
            if (!this.parentNode) return;
            this.parentNode.children = this.parentNode.children.filter(child => child !== this);
            this.parentNode = null;
        }
    };
};

const createHarness = (options = {}) => {
    const success = vi.fn();
    const cancel = vi.fn();
    const cellElement = createElement('cell');
    const cell = {
        edit: vi.fn(),
        getValue: () => 'Original notes',
        getField: () => 'notes',
        getElement: () => cellElement
    };
    const row = { getCell: () => cell };
    cell.getRow = () => row;
    const editor = largeText(options);
    const placeholder = editor(cell, callback => callback(), success, cancel);
    const overlay = globalThis.document.body.children[0];
    const panel = overlay.children[0];

    return {
        cancel,
        cancelButton: panel.children[2].children[0],
        cell,
        cellElement,
        editor,
        overlay,
        panel,
        placeholder,
        saveButton: panel.children[2].children[1],
        success,
        textarea: panel.children[1]
    };
};

const flush = async () => {
    for (let index = 0; index < 3; index += 1) await Promise.resolve();
};

describe('large text editor', () => {
    const originalDocument = globalThis.document;

    beforeEach(() => {
        globalThis.document = {
            activeElement: null,
            body: createElement('body'),
            createElement
        };
    });

    afterEach(() => {
        globalThis.document = originalDocument;
        vi.restoreAllMocks();
    });

    test('exposes focus-only editor metadata and dialog semantics', () => {
        const harness = createHarness();

        expect(harness.editor._ambEditorType).toBe('largeText');
        expect(harness.editor._ambKeyboardFocusOnly).toBe(true);
        expect(harness.overlay.attributes).toMatchObject({
            role: 'dialog',
            'aria-modal': 'true'
        });
        expect(harness.overlay.attributes['aria-labelledby']).toBeTruthy();
        expect(globalThis.document.activeElement).toBe(harness.textarea);
    });

    test('focus trap cycles forward and backward through textarea and actions', () => {
        const harness = createHarness();

        harness.overlay.dispatch('keydown', { key: 'Tab' });
        expect(globalThis.document.activeElement).toBe(harness.cancelButton);
        harness.overlay.dispatch('keydown', { key: 'Tab' });
        expect(globalThis.document.activeElement).toBe(harness.saveButton);
        harness.overlay.dispatch('keydown', { key: 'Tab' });
        expect(globalThis.document.activeElement).toBe(harness.textarea);
        harness.overlay.dispatch('keydown', { key: 'Tab', shiftKey: true });
        expect(globalThis.document.activeElement).toBe(harness.saveButton);
        harness.overlay.dispatch('keydown', { key: 'Tab', shiftKey: true });
        expect(globalThis.document.activeElement).toBe(harness.cancelButton);
    });

    test('Save commits once, removes the dialog and restores cell focus without editing', async () => {
        const harness = createHarness();
        harness.textarea.value = 'Saved notes';

        harness.saveButton.dispatch('click');
        await flush();

        expect(harness.success).toHaveBeenCalledOnce();
        expect(harness.success).toHaveBeenCalledWith('Saved notes');
        expect(harness.cancel).not.toHaveBeenCalled();
        expect(globalThis.document.body.children).not.toContain(harness.overlay);
        expect(globalThis.document.activeElement).toBe(harness.cellElement);
        expect(harness.cell.edit).not.toHaveBeenCalled();
    });

    test('Ctrl+Enter saves from the dialog', async () => {
        const harness = createHarness();
        harness.textarea.value = 'Keyboard save';

        harness.overlay.dispatch('keydown', { key: 'Enter', ctrlKey: true });
        await flush();

        expect(harness.success).toHaveBeenCalledWith('Keyboard save');
        expect(globalThis.document.activeElement).toBe(harness.cellElement);
    });

    test('Escape cancels from any dialog control and restores cell focus', async () => {
        const harness = createHarness();
        harness.saveButton.focus();

        harness.overlay.dispatch('keydown', { key: 'Escape', target: harness.saveButton });
        await flush();

        expect(harness.cancel).toHaveBeenCalledOnce();
        expect(harness.success).not.toHaveBeenCalled();
        expect(globalThis.document.activeElement).toBe(harness.cellElement);
    });

    test.each([
        ['Cancel button', harness => harness.cancelButton.dispatch('click')],
        ['backdrop', harness => harness.overlay.dispatch('mousedown')]
    ])('%s cancels and restores cell focus', async (_label, close) => {
        const harness = createHarness();

        close(harness);
        await flush();

        expect(harness.cancel).toHaveBeenCalledOnce();
        expect(harness.success).not.toHaveBeenCalled();
        expect(globalThis.document.activeElement).toBe(harness.cellElement);
    });

    test('disabled backdrop closing keeps the dialog open', () => {
        const harness = createHarness({ closeOnBackdropClick: false });

        harness.overlay.dispatch('mousedown');

        expect(harness.cancel).not.toHaveBeenCalled();
        expect(globalThis.document.body.children).toContain(harness.overlay);
    });

    test.each(['ArrowUp', 'ArrowDown'])('does not intercept Alt+%s in the textarea', key => {
        const harness = createHarness();
        const preventDefault = vi.fn();

        harness.overlay.dispatch('keydown', { key, altKey: true, preventDefault });

        expect(preventDefault).not.toHaveBeenCalled();
        expect(harness.success).not.toHaveBeenCalled();
        expect(globalThis.document.body.children).toContain(harness.overlay);
    });
});

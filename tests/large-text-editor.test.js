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

const createHarness = (options = {}, { withRowNavigation = false } = {}) => {
    const success = vi.fn();
    const cancel = vi.fn();
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
    const table = {
        navigateNext: vi.fn(),
        navigatePrev: vi.fn()
    };
    const cell = {
        getValue: () => 'Original notes',
        getTable: () => table,
        navigateNext: vi.fn(),
        navigatePrev: vi.fn()
    };

    cell.getRow = () => ({
        getCells: () => withRowNavigation
            ? [previousCell, cell, nextCell]
            : []
    });
    const editor = largeText(options);
    const placeholder = editor(
        cell,
        callback => callback(),
        success,
        cancel
    );
    const overlay = globalThis.document.body.children[0];
    const panel = overlay.children[0];

    return {
        cancel,
        cancelButton: panel.children[2].children[0],
        cell,
        nextCell,
        overlay,
        panel,
        placeholder,
        previousCell,
        saveButton: panel.children[2].children[1],
        success,
        table,
        textarea: panel.children[1]
    };
};

const flushDeferred = () => new Promise(resolve => {
    globalThis.setTimeout(resolve, 0);
});

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

    test('keeps the normal textarea Tab behavior by default', () => {
        const harness = createHarness();
        const preventDefault = vi.fn();
        const stopPropagation = vi.fn();

        harness.textarea.dispatch('keydown', {
            key: 'Tab',
            preventDefault,
            stopPropagation
        });

        expect(preventDefault).not.toHaveBeenCalled();
        expect(stopPropagation).not.toHaveBeenCalled();
        expect(harness.success).not.toHaveBeenCalled();
        expect(harness.cancel).not.toHaveBeenCalled();
        expect(globalThis.document.body.children).toContain(harness.overlay);
    });

    test('Tab saves and opens the next editable cell when configured', async () => {
        const harness = createHarness({
            tabBehavior: 'save-and-navigate'
        }, {
            withRowNavigation: true
        });
        const preventDefault = vi.fn();
        const stopPropagation = vi.fn();

        harness.textarea.value = 'Saved with Tab';
        harness.textarea.dispatch('keydown', {
            key: 'Tab',
            preventDefault,
            stopPropagation
        });
        await flushDeferred();

        expect(preventDefault).toHaveBeenCalledOnce();
        expect(stopPropagation).toHaveBeenCalledOnce();
        expect(harness.success).toHaveBeenCalledWith('Saved with Tab');
        expect(harness.nextCell.edit).toHaveBeenCalledOnce();
        expect(harness.previousCell.edit).not.toHaveBeenCalled();
        expect(harness.cell.navigateNext).not.toHaveBeenCalled();
    });

    test('Shift+Tab saves and opens the previous editable cell when configured', async () => {
        const harness = createHarness({
            tabBehavior: 'save-and-navigate'
        }, {
            withRowNavigation: true
        });

        harness.textarea.value = 'Saved with Shift+Tab';
        harness.textarea.dispatch('keydown', {
            key: 'Tab',
            shiftKey: true
        });
        await flushDeferred();

        expect(harness.success).toHaveBeenCalledWith('Saved with Shift+Tab');
        expect(harness.previousCell.edit).toHaveBeenCalledOnce();
        expect(harness.nextCell.edit).not.toHaveBeenCalled();
        expect(harness.cell.navigatePrev).not.toHaveBeenCalled();
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

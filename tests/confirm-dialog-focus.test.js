import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { ConfirmDialog } from '../src/ui/confirm-dialog.js';

class ElementMock {
    constructor(tagName, ownerDocument) {
        this.tagName = tagName.toUpperCase();
        this.ownerDocument = ownerDocument;
        this.attributes = {};
        this.children = [];
        this.className = '';
        this.disabled = false;
        this.listeners = {};
        this.parentNode = null;
        this.removed = false;
        this.tabIndex = 0;
        this.textContent = '';
        this.type = '';
        const classes = new Set();

        this.classList = {
            add: className => {
                classes.add(className);
                this.className = [...classes].join(' ');
            },
            remove: className => {
                classes.delete(className);
                this.className = [...classes].join(' ');
            },
            contains: className => classes.has(className)
        };
    }

    append(...children) {
        children.forEach(child => {
            child.parentNode = this;
            this.children.push(child);
        });
    }

    appendChild(child) {
        this.append(child);
        return child;
    }

    addEventListener(type, listener) {
        this.listeners[type] = listener;
    }

    dispatch(type, event = {}) {
        const dispatchedEvent = {
            key: undefined,
            preventDefault: vi.fn(),
            shiftKey: false,
            target: this,
            ...event
        };

        this.listeners[type]?.(dispatchedEvent);
        return dispatchedEvent;
    }

    focus() {
        this.ownerDocument.activeElement = this;
    }

    remove() {
        this.removed = true;
    }

    setAttribute(name, value) {
        this.attributes[name] = String(value);
    }

    getAttribute(name) {
        return this.attributes[name] ?? null;
    }
}

const createHarness = () => {
    const listeners = {};
    const originalDocument = globalThis.document;
    const originalWindow = globalThis.window;
    const removeAllRanges = vi.fn();
    const documentMock = {
        activeElement: null,
        addEventListener: (type, listener) => {
            listeners[type] = listener;
        },
        removeEventListener: (type, listener) => {
            if (listeners[type] === listener) {
                delete listeners[type];
            }
        },
        createElement: tagName => new ElementMock(tagName, documentMock),
        listeners
    };

    documentMock.body = new ElementMock('body', documentMock);
    globalThis.document = documentMock;
    globalThis.window = {
        getSelection: () => ({
            removeAllRanges
        })
    };

    return {
        documentMock,
        removeAllRanges,
        keydown(event = {}) {
            const dispatchedEvent = {
                key: undefined,
                preventDefault: vi.fn(),
                shiftKey: false,
                ...event
            };

            listeners.keydown?.(dispatchedEvent);
            return dispatchedEvent;
        },
        restore() {
            globalThis.document = originalDocument;
            globalThis.window = originalWindow;
        }
    };
};

describe('ConfirmDialog focus management', () => {
    let harness;

    beforeEach(() => {
        harness = createHarness();
    });

    afterEach(() => {
        harness.restore();
    });

    test('moves initial focus into the dialog on the cancel button', () => {
        const opener = new ElementMock('button', harness.documentMock);
        const dialog = new ConfirmDialog();

        harness.documentMock.activeElement = opener;
        dialog.confirm({ message: 'Delete row?' });

        expect(harness.documentMock.activeElement).toBe(dialog.cancelButton);
    });

    test('cycles Tab and Rtab inside the dialog buttons', () => {
        const outside = new ElementMock('button', harness.documentMock);
        const dialog = new ConfirmDialog();

        harness.documentMock.activeElement = outside;
        dialog.confirm({ message: 'Delete row?' });

        const tabFromCancel = harness.keydown({ key: 'Tab' });

        expect(tabFromCancel.preventDefault).toHaveBeenCalledOnce();
        expect(harness.documentMock.activeElement).toBe(dialog.confirmButton);

        harness.keydown({ key: 'Tab' });
        expect(harness.documentMock.activeElement).toBe(dialog.cancelButton);

        harness.keydown({ key: 'Tab', shiftKey: true });
        expect(harness.documentMock.activeElement).toBe(dialog.confirmButton);
        expect(harness.documentMock.activeElement).not.toBe(outside);
    });

    test('dialog buttons are marked as non-editable and clear text selection on focus', () => {
        const dialog = new ConfirmDialog();

        dialog.confirm({ message: 'Delete row?' });
        dialog.confirmButton.dispatch('focus');

        expect(dialog.cancelButton.getAttribute('contenteditable')).toBe('false');
        expect(dialog.confirmButton.getAttribute('contenteditable')).toBe('false');
        expect(dialog.cancelButton.getAttribute('unselectable')).toBe('on');
        expect(dialog.confirmButton.getAttribute('unselectable')).toBe('on');
        expect(harness.removeAllRanges).toHaveBeenCalled();
    });

    test.each([
        'ArrowLeft',
        'ArrowRight',
        'ArrowUp',
        'ArrowDown',
        'Home',
        'End'
    ])('prevents %s from moving a caret inside dialog button text', key => {
        const dialog = new ConfirmDialog();

        dialog.confirm({ message: 'Delete row?' });
        const event = dialog.confirmButton.dispatch('keydown', { key });

        expect(event.preventDefault).toHaveBeenCalledOnce();
        expect(harness.removeAllRanges).toHaveBeenCalled();
    });

    test('Escape cancels and restores focus to the opener', async () => {
        const opener = new ElementMock('button', harness.documentMock);
        const dialog = new ConfirmDialog();

        harness.documentMock.activeElement = opener;
        const result = dialog.confirm({ message: 'Delete row?' });

        const escapeEvent = harness.keydown({ key: 'Escape' });

        await expect(result).resolves.toBe(false);
        expect(escapeEvent.preventDefault).toHaveBeenCalledOnce();
        expect(harness.documentMock.activeElement).toBe(opener);
    });

    test('clicking confirm resolves true and restores focus to the opener', async () => {
        const opener = new ElementMock('button', harness.documentMock);
        const dialog = new ConfirmDialog();

        harness.documentMock.activeElement = opener;
        const result = dialog.confirm({ message: 'Delete row?' });

        dialog.confirmButton.dispatch('click');

        await expect(result).resolves.toBe(true);
        expect(harness.documentMock.activeElement).toBe(opener);
    });
});

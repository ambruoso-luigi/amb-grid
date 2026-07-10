import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { checkbox as createCheckboxEditor } from '../src/lib/editors/checkbox-editor.js';

class ElementMock {
    constructor(tagName) {
        this.tagName = tagName;
        this.children = [];
        this.className = '';
        this.type = '';
        this.checked = false;
        this.textContent = '';
        this.listeners = new Map();
        this.focus = vi.fn();
    }

    append(...children) {
        this.children.push(...children);
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
            stopImmediatePropagation: vi.fn(),
            stopPropagation: vi.fn(),
            shiftKey: false,
            ...event
        };

        (this.listeners.get(type) || []).forEach(listener => {
            listener(dispatchedEvent);
        });

        return dispatchedEvent;
    }
}

const createHarness = ({
    initialValue = false,
    options = {},
    withRowNavigation = false
} = {}) => {
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
        getCells: () => withRowNavigation
            ? [previousCell, cell, nextCell]
            : []
    };
    const table = {
        navigateNext: vi.fn(),
        navigatePrev: vi.fn()
    };

    cell = {
        getRow: () => row,
        getTable: () => table,
        getValue: () => initialValue,
        navigateNext: vi.fn(),
        navigatePrev: vi.fn()
    };
    const success = vi.fn();
    const cancel = vi.fn();
    const editor = createCheckboxEditor(options);
    const container = editor(cell, callback => callback(), success, cancel);
    const input = container.children[0];
    const label = container.children[1] || null;

    return {
        cancel,
        cell,
        container,
        input,
        label,
        nextCell,
        previousCell,
        table,
        success
    };
};

const flushDeferred = () => new Promise(resolve => {
    globalThis.setTimeout(resolve, 0);
});

describe('checkbox editor keyboard behavior', () => {
    const originalDocument = globalThis.document;

    beforeEach(() => {
        globalThis.document = {
            createElement: tagName => new ElementMock(tagName)
        };
    });

    afterEach(() => {
        globalThis.document = originalDocument;
        vi.restoreAllMocks();
    });

    test('does not create a label node by default', () => {
        const harness = createHarness();

        expect(harness.container.children).toHaveLength(1);
        expect(harness.input.className).toBe('amb-checkbox-editor__input');
        expect(harness.label).toBeNull();
    });

    test('creates and updates a label only when labels are explicitly configured', () => {
        const harness = createHarness({
            options: {
                checkedLabel: 'Yes',
                uncheckedLabel: 'No'
            }
        });

        expect(harness.container.children).toHaveLength(2);
        expect(harness.label.className).toBe('amb-checkbox-editor__label');
        expect(harness.label.textContent).toBe('No');

        harness.input.dispatch('keydown', { key: '1' });

        expect(harness.label.textContent).toBe('Yes');
    });

    test('supports partial explicit labels', () => {
        const checkedOnly = createHarness({
            options: {
                checkedLabel: 'Checked'
            }
        });

        expect(checkedOnly.label.textContent).toBe('');
        checkedOnly.input.dispatch('keydown', { key: '1' });
        expect(checkedOnly.label.textContent).toBe('Checked');

        const uncheckedOnly = createHarness({
            initialValue: true,
            options: {
                uncheckedLabel: 'Unchecked'
            }
        });

        expect(uncheckedOnly.label.textContent).toBe('');
        uncheckedOnly.input.dispatch('keydown', { key: '0' });
        expect(uncheckedOnly.label.textContent).toBe('Unchecked');
    });

    test('Space toggles the checkbox without committing immediately', () => {
        const harness = createHarness();
        const event = harness.input.dispatch('keydown', { key: ' ' });

        expect(harness.input.checked).toBe(true);
        expect(event.preventDefault).toHaveBeenCalledOnce();
        expect(harness.success).not.toHaveBeenCalled();
        expect(harness.cancel).not.toHaveBeenCalled();
    });

    test('1 sets the checkbox to checked', () => {
        const harness = createHarness();

        harness.input.dispatch('keydown', { key: '1' });

        expect(harness.input.checked).toBe(true);
    });

    test('0 sets the checkbox to unchecked', () => {
        const harness = createHarness({ initialValue: true });

        harness.input.dispatch('keydown', { key: '0' });

        expect(harness.input.checked).toBe(false);
    });

    test.each(['y', 'Y'])('%s sets the checkbox to checked', key => {
        const harness = createHarness();

        harness.input.dispatch('keydown', { key });

        expect(harness.input.checked).toBe(true);
    });

    test.each(['n', 'N'])('%s sets the checkbox to unchecked', key => {
        const harness = createHarness({ initialValue: true });

        harness.input.dispatch('keydown', { key });

        expect(harness.input.checked).toBe(false);
    });

    test.each(['s', 'S'])('%s sets the checkbox to checked', key => {
        const harness = createHarness();

        harness.input.dispatch('keydown', { key });

        expect(harness.input.checked).toBe(true);
    });

    test('Enter confirms the current value', () => {
        const harness = createHarness({ initialValue: true });
        const event = harness.input.dispatch('keydown', { key: 'Enter' });

        expect(harness.success).toHaveBeenCalledWith(true);
        expect(harness.cancel).not.toHaveBeenCalled();
        expect(event.preventDefault).toHaveBeenCalledOnce();
    });

    test('Escape cancels and restores the previous value', () => {
        const harness = createHarness();

        harness.input.dispatch('keydown', { key: '1' });
        const event = harness.input.dispatch('keydown', { key: 'Escape' });

        expect(harness.input.checked).toBe(false);
        expect(harness.cancel).toHaveBeenCalledOnce();
        expect(harness.success).not.toHaveBeenCalled();
        expect(event.preventDefault).toHaveBeenCalledOnce();
    });

    test('Tab confirms without changing value and navigates next', async () => {
        const harness = createHarness({ withRowNavigation: true });
        const event = harness.input.dispatch('keydown', { key: 'Tab' });

        expect(harness.input.checked).toBe(false);
        expect(harness.success).toHaveBeenCalledWith(false);
        expect(event.preventDefault).toHaveBeenCalledOnce();
        expect(event.stopPropagation).toHaveBeenCalledOnce();
        await flushDeferred();
        expect(harness.nextCell.edit).toHaveBeenCalledOnce();
        expect(harness.previousCell.edit).not.toHaveBeenCalled();
    });

    test('Shift+Tab confirms without changing value and navigates previous', async () => {
        const harness = createHarness({
            initialValue: true,
            withRowNavigation: true
        });
        const event = harness.input.dispatch('keydown', {
            key: 'Tab',
            shiftKey: true
        });

        expect(harness.input.checked).toBe(true);
        expect(harness.success).toHaveBeenCalledWith(true);
        expect(event.preventDefault).toHaveBeenCalledOnce();
        expect(event.stopPropagation).toHaveBeenCalledOnce();
        await flushDeferred();
        expect(harness.previousCell.edit).toHaveBeenCalledOnce();
        expect(harness.nextCell.edit).not.toHaveBeenCalled();
    });

    test('custom checkedKeys, uncheckedKeys, and toggleKeys replace the defaults', () => {
        const harness = createHarness({
            options: {
                checkedKeys: ['+'],
                uncheckedKeys: ['-'],
                toggleKeys: ['t']
            }
        });

        harness.input.dispatch('keydown', { key: '1' });
        expect(harness.input.checked).toBe(false);

        harness.input.dispatch('keydown', { key: '+' });
        expect(harness.input.checked).toBe(true);

        harness.input.dispatch('keydown', { key: '-' });
        expect(harness.input.checked).toBe(false);

        harness.input.dispatch('keydown', { key: 't' });
        expect(harness.input.checked).toBe(true);
    });

    test('custom checkedValue and uncheckedValue continue to be saved', () => {
        const harness = createHarness({
            initialValue: 'N',
            options: {
                checkedValue: 'Y',
                uncheckedValue: 'N'
            }
        });

        harness.input.dispatch('keydown', { key: 'y' });
        harness.input.dispatch('keydown', { key: 'Enter' });

        expect(harness.success).toHaveBeenCalledWith('Y');
    });

    test('change event still commits the current value for mouse interaction', () => {
        const harness = createHarness();

        harness.input.checked = true;
        harness.input.dispatch('change');

        expect(harness.success).toHaveBeenCalledWith(true);
    });

    test('exposes AMB checkbox metadata for table-level cbox behavior', () => {
        const editor = createCheckboxEditor({
            checkedValue: 'Y',
            uncheckedValue: 'N'
        });

        expect(editor._ambEditorType).toBe('checkbox');
        expect(editor._ambCheckboxConfig).toEqual({
            checkedValue: 'Y',
            uncheckedValue: 'N'
        });
    });
});

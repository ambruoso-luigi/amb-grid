import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { lookup as createLookupEditor } from '../src/lib/editors/lookup-editor.js';
import { getLookupMetadata } from '../src/lib/lookup-metadata.js';

const records = [
    { id: 'ACTIVE', description: 'Active' },
    { id: 'REPAIR', description: 'Under repair' },
    { id: 'DOCKED', description: 'Docked' }
];

const createElement = tagName => {
    const listeners = new Map();

    return {
        tagName,
        children: [],
        dataset: {},
        value: '',
        selectionStart: 0,
        selectionEnd: 0,
        appendChild(child) {
            this.children.push(child);
        },
        addEventListener(type, listener) {
            listeners.set(type, listener);
        },
        async dispatch(type, event = {}) {
            return listeners.get(type)?.({
                preventDefault() {},
                stopPropagation() {},
                ...event
            });
        },
        focus() {},
        select() {},
        setSelectionRange(start, end) {
            this.selectionStart = start;
            this.selectionEnd = end;
        }
    };
};

const createHarness = ({
    initialValue = 'ACTIVE',
    options = {},
    load = ({ query }) => records.filter(record => record.id.includes(query))
} = {}) => {
    const rowData = { id: 1, status: initialValue };
    const cellElement = { dataset: {} };
    const row = {
        getData: () => rowData,
        update: patch => Object.assign(rowData, patch)
    };
    const table = {
        navigateNext: vi.fn(),
        navigatePrev: vi.fn()
    };
    const cell = {
        getValue: () => rowData.status,
        getField: () => 'status',
        getRow: () => row,
        getElement: () => cellElement,
        getTable: () => table
    };
    const lookupInstance = {
        valueField: 'id',
        labelField: 'description',
        load
    };
    const success = vi.fn();
    const cancel = vi.fn();
    const markInvalid = vi.fn();
    const clearInvalid = vi.fn();
    const editor = createLookupEditor(lookupInstance, {
        uppercase: true,
        trim: true,
        validateOnBlur: true,
        ...options
    });

    editor._ambSetLookupErrorHandlers({
        markInvalid,
        clearInvalid,
        applyRecord: vi.fn()
    });

    const container = editor(cell, () => {}, success, cancel);

    return {
        cancel,
        cell,
        clearInvalid,
        container,
        input: container.children[0],
        load: lookupInstance.load,
        markInvalid,
        rowData,
        success,
        table
    };
};

const flushNavigation = () => new Promise(resolve => {
    globalThis.setTimeout(resolve, 0);
});

describe('lookup editor blur commits', () => {
    const originalDocument = globalThis.document;

    beforeEach(() => {
        globalThis.document = { createElement };
    });

    afterEach(() => {
        globalThis.document = originalDocument;
        vi.restoreAllMocks();
    });

    test('cancels an unchanged valid value without marking it invalid', async () => {
        const harness = createHarness();

        await harness.input.dispatch('blur');

        expect(harness.cancel).toHaveBeenCalledOnce();
        expect(harness.success).not.toHaveBeenCalled();
        expect(harness.markInvalid).not.toHaveBeenCalled();
        expect(harness.clearInvalid).toHaveBeenCalledWith(harness.cell);
        expect(getLookupMetadata(harness.rowData, 'status')).toEqual({
            initial: {
                value: 'ACTIVE',
                description: 'Active'
            },
            current: {
                value: 'ACTIVE',
                description: 'Active'
            }
        });
    });

    test('treats trim and uppercase normalization as an unchanged value', async () => {
        const harness = createHarness();

        harness.input.value = ' active ';
        await harness.input.dispatch('blur');

        expect(harness.input.value).toBe('ACTIVE');
        expect(harness.cancel).toHaveBeenCalledOnce();
        expect(harness.success).not.toHaveBeenCalled();
        expect(harness.markInvalid).not.toHaveBeenCalled();
        expect(harness.clearInvalid).toHaveBeenCalledOnce();
    });

    test('commits a different valid code and updates lookup metadata', async () => {
        const harness = createHarness();

        harness.input.value = 'repair';
        await harness.input.dispatch('blur');

        expect(harness.success).toHaveBeenCalledWith('REPAIR');
        expect(harness.cancel).not.toHaveBeenCalled();
        expect(harness.clearInvalid).toHaveBeenCalledWith(harness.cell);
        expect(harness.markInvalid).not.toHaveBeenCalled();
        expect(getLookupMetadata(harness.rowData, 'status').current).toEqual({
            value: 'REPAIR',
            description: 'Under repair'
        });
    });

    test('keeps the existing invalid commit behavior for an unknown code', async () => {
        const harness = createHarness();

        harness.input.value = 'unknown';
        await harness.input.dispatch('blur');

        expect(harness.success).toHaveBeenCalledWith('UNKNOWN');
        expect(harness.markInvalid).toHaveBeenCalledWith(
            harness.cell,
            'Invalid lookup code'
        );
        expect(harness.cancel).not.toHaveBeenCalled();
    });

    test('keeps manual autocomplete working with normalized lookup values', async () => {
        const harness = createHarness({
            options: {
                autoComplete: true
            }
        });

        harness.input.value = 'rep';
        await harness.input.dispatch('input');
        await Promise.resolve();

        expect(harness.input.value).toBe('REPAIR');
        expect(harness.input.selectionStart).toBe(3);
        expect(harness.input.selectionEnd).toBe(6);
    });

    test.each([
        ['Backspace', 'deleteContentBackward'],
        ['Delete', 'deleteContentForward'],
        ['Cut', 'deleteByCut']
    ])('%s input does not trigger manual autocomplete', async (key, inputType) => {
        const load = vi.fn(({ query }) => {
            return records.filter(record => record.id.includes(query));
        });
        const harness = createHarness({
            options: {
                autoComplete: true
            },
            load
        });

        await Promise.resolve();
        load.mockClear();
        harness.input.value = 'ACTIV';

        if (key !== 'Cut') {
            await harness.input.dispatch('keydown', { key });
        }
        await harness.input.dispatch('input', { inputType });
        await Promise.resolve();

        expect(harness.input.value).toBe('ACTIV');
        expect(load).not.toHaveBeenCalled();
    });

    test('deleting invalidates a pending autocomplete request', async () => {
        let resolveAutoComplete;
        const load = vi.fn(({ query }) => {
            if (query === 'REP') {
                return new Promise(resolve => {
                    resolveAutoComplete = resolve;
                });
            }

            return records.filter(record => record.id.includes(query));
        });
        const harness = createHarness({
            options: {
                autoComplete: true
            },
            load
        });

        await Promise.resolve();
        harness.input.value = 'rep';
        const pendingInput = harness.input.dispatch('input', {
            inputType: 'insertText'
        });
        await Promise.resolve();

        harness.input.value = 're';
        await harness.input.dispatch('input', {
            inputType: 'deleteContentBackward'
        });
        resolveAutoComplete([records[1]]);
        await pendingInput;

        expect(harness.input.value).toBe('RE');
        expect(harness.input.selectionStart).toBe(0);
        expect(harness.input.selectionEnd).toBe(0);
    });

    test('commits an empty value after clearing all text when empty is allowed', async () => {
        const harness = createHarness({
            options: {
                allowEmpty: true,
                autoComplete: true
            }
        });

        harness.input.value = '';
        await harness.input.dispatch('input', {
            inputType: 'deleteContentBackward'
        });
        await harness.input.dispatch('blur');

        expect(harness.input.value).toBe('');
        expect(harness.success).toHaveBeenCalledWith('');
        expect(harness.clearInvalid).toHaveBeenCalledWith(harness.cell);
        expect(harness.markInvalid).not.toHaveBeenCalled();
        expect(getLookupMetadata(harness.rowData, 'status').current).toEqual({
            value: '',
            description: ''
        });
    });

    test('select-all delete stays empty and commits the empty value', async () => {
        const load = vi.fn(({ query }) => {
            return records.filter(record => record.id.includes(query));
        });
        const harness = createHarness({
            options: {
                allowEmpty: true,
                autoComplete: true
            },
            load
        });

        await Promise.resolve();
        load.mockClear();
        harness.input.selectionStart = 0;
        harness.input.selectionEnd = harness.input.value.length;
        harness.input.value = '';

        await harness.input.dispatch('keydown', { key: 'Delete' });
        await harness.input.dispatch('input', {
            inputType: 'deleteContentForward'
        });
        await Promise.resolve();

        expect(harness.input.value).toBe('');
        expect(load).not.toHaveBeenCalled();

        await harness.input.dispatch('blur');

        expect(harness.success).toHaveBeenCalledWith('');
        expect(getLookupMetadata(harness.rowData, 'status').current).toEqual({
            value: '',
            description: ''
        });
    });

    test('Tab accepts and commits a manual autocomplete suggestion, then navigates next', async () => {
        const harness = createHarness({
            options: {
                autoComplete: true
            }
        });
        const preventDefault = vi.fn();

        harness.input.value = 'rep';
        await harness.input.dispatch('input', {
            inputType: 'insertText'
        });
        await Promise.resolve();
        await harness.input.dispatch('keydown', {
            key: 'Tab',
            preventDefault
        });
        await flushNavigation();

        expect(preventDefault).toHaveBeenCalledOnce();
        expect(harness.input.value).toBe('REPAIR');
        expect(harness.input.selectionStart).toBe(6);
        expect(harness.input.selectionEnd).toBe(6);
        expect(harness.success).toHaveBeenCalledOnce();
        expect(harness.success).toHaveBeenCalledWith('REPAIR');
        expect(harness.cancel).not.toHaveBeenCalled();
        expect(harness.table.navigateNext).toHaveBeenCalledOnce();
        expect(harness.table.navigatePrev).not.toHaveBeenCalled();
        expect(getLookupMetadata(harness.rowData, 'status').current).toEqual({
            value: 'REPAIR',
            description: 'Under repair'
        });

        await harness.input.dispatch('blur');

        expect(harness.success).toHaveBeenCalledOnce();
    });

    test('Shift+Tab accepts and commits a manual autocomplete suggestion, then navigates previous', async () => {
        const harness = createHarness({
            options: {
                autoComplete: true
            }
        });
        const preventDefault = vi.fn();

        harness.input.value = 'rep';
        await harness.input.dispatch('input', {
            inputType: 'insertText'
        });
        await Promise.resolve();
        await harness.input.dispatch('keydown', {
            key: 'Tab',
            shiftKey: true,
            preventDefault
        });
        await flushNavigation();

        expect(preventDefault).toHaveBeenCalledOnce();
        expect(harness.input.value).toBe('REPAIR');
        expect(harness.success).toHaveBeenCalledOnce();
        expect(harness.success).toHaveBeenCalledWith('REPAIR');
        expect(harness.table.navigatePrev).toHaveBeenCalledOnce();
        expect(harness.table.navigateNext).not.toHaveBeenCalled();
    });

    test('Tab without an autocomplete suggestion commits the current value and navigates next', async () => {
        const harness = createHarness({
            initialValue: 'REPAIR',
            options: {
                autoComplete: true
            }
        });
        const preventDefault = vi.fn();

        harness.input.value = 'docked';
        await harness.input.dispatch('keydown', {
            key: 'Tab',
            preventDefault
        });
        await flushNavigation();

        expect(preventDefault).toHaveBeenCalledOnce();
        expect(harness.success).toHaveBeenCalledOnce();
        expect(harness.success).toHaveBeenCalledWith('DOCKED');
        expect(harness.table.navigateNext).toHaveBeenCalledOnce();
        expect(harness.table.navigatePrev).not.toHaveBeenCalled();
    });

    test('Enter still commits a manual autocomplete suggestion without navigating', async () => {
        const harness = createHarness({
            options: {
                autoComplete: true
            }
        });

        harness.input.value = 'rep';
        await harness.input.dispatch('input', {
            inputType: 'insertText'
        });
        await Promise.resolve();
        await harness.input.dispatch('keydown', {
            key: 'Enter'
        });

        expect(harness.success).toHaveBeenCalledOnce();
        expect(harness.success).toHaveBeenCalledWith('REPAIR');
        expect(harness.cancel).not.toHaveBeenCalled();
        expect(harness.table.navigateNext).not.toHaveBeenCalled();
        expect(harness.table.navigatePrev).not.toHaveBeenCalled();
    });
});

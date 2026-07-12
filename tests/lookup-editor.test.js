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
    load = ({ query }) => records.filter(record => record.id.includes(query)),
    withRowNavigation = false
} = {}) => {
    const rowData = { id: 1, status: initialValue };
    const cellElement = { dataset: {} };
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
        getData: () => rowData,
        update: patch => Object.assign(rowData, patch),
        getCells: () => withRowNavigation
            ? [previousCell, cell, nextCell]
            : []
    };
    const table = {
        navigateNext: vi.fn(),
        navigatePrev: vi.fn()
    };
    cell = {
        getValue: () => rowData.status,
        getField: () => 'status',
        getRow: () => row,
        getElement: () => cellElement,
        getTable: () => table,
        navigateNext: vi.fn(),
        navigatePrev: vi.fn()
    };
    const lookupInstance = {
        valueField: 'id',
        labelField: 'description',
        load
    };
    const clearRenderedError = () => {
        delete cellElement.dataset.cellError;
        delete cellElement.title;
    };
    const success = vi.fn(clearRenderedError);
    const cancel = vi.fn(clearRenderedError);
    const markInvalid = vi.fn((_cell, message) => {
        cellElement.dataset.cellError = 'true';
        cellElement.title = message;
    });
    const clearInvalid = vi.fn(clearRenderedError);
    const applyRecord = vi.fn((_cell, patch) => {
        Object.assign(rowData, patch);
        return true;
    });
    const editor = createLookupEditor(lookupInstance, {
        uppercase: true,
        trim: true,
        validateOnBlur: true,
        ...options
    });

    editor._ambSetLookupErrorHandlers({
        markInvalid,
        clearInvalid,
        applyRecord
    });

    const container = editor(cell, () => {}, success, cancel);

    return {
        cancel,
        cell,
        cellElement,
        clearInvalid,
        container,
        input: container.children[0],
        load: lookupInstance.load,
        markInvalid,
        nextCell,
        previousCell,
        rowData,
        applyRecord,
        success,
        table
    };
};

const flushDeferred = () => new Promise(resolve => {
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
        await flushDeferred();

        expect(harness.success).toHaveBeenCalledWith('UNKNOWN');
        expect(harness.markInvalid).toHaveBeenCalledWith(
            harness.cell,
            'Invalid lookup code'
        );
        expect(harness.cancel).not.toHaveBeenCalled();
        expect(harness.cellElement.dataset.cellError).toBe('true');
        expect(harness.cellElement.title).toBe('Invalid lookup code');
    });

    test('keeps an unchanged invalid lookup value marked as an error', async () => {
        const harness = createHarness({
            initialValue: 'INVALID'
        });

        await harness.input.dispatch('blur');
        await flushDeferred();

        expect(harness.cancel).toHaveBeenCalledOnce();
        expect(harness.success).not.toHaveBeenCalled();
        expect(harness.markInvalid).toHaveBeenCalledWith(
            harness.cell,
            'Invalid lookup code'
        );
        expect(harness.clearInvalid).not.toHaveBeenCalled();
        expect(harness.cellElement.dataset.cellError).toBe('true');
    });

    test('a valid changed lookup value clears a previous invalid error', async () => {
        const harness = createHarness({
            initialValue: 'INVALID'
        });

        harness.cellElement.dataset.cellError = 'true';
        harness.cellElement.title = 'Invalid lookup code';
        harness.input.value = 'repair';
        await harness.input.dispatch('blur');

        expect(harness.success).toHaveBeenCalledWith('REPAIR');
        expect(harness.clearInvalid).toHaveBeenCalledWith(harness.cell);
        expect(harness.markInvalid).not.toHaveBeenCalled();
        expect(harness.cellElement.dataset.cellError).toBeUndefined();
        expect(getLookupMetadata(harness.rowData, 'status').current).toEqual({
            value: 'REPAIR',
            description: 'Under repair'
        });
    });

    test('a valid mapped lookup value applies the full row patch', async () => {
        const harness = createHarness({
            options: {
                mapToRow: {
                    status: 'id',
                    statusDescription: 'description'
                }
            }
        });

        harness.input.value = 'repair';
        await harness.input.dispatch('blur');

        expect(harness.applyRecord).toHaveBeenCalledWith(
            harness.cell,
            {
                status: 'REPAIR',
                statusDescription: 'Under repair'
            },
            records[1]
        );
        expect(harness.rowData.statusDescription).toBe('Under repair');
        expect(harness.success).toHaveBeenCalledWith('REPAIR');
    });

    test('an invalid mapped lookup value clears stale dependent fields', async () => {
        const harness = createHarness({
            options: {
                mapToRow: {
                    status: 'id',
                    statusDescription: 'description'
                },
                clearMappedFieldsOnInvalid: true,
                buildInvalidPatch: () => ({
                    statusDescription: ''
                })
            }
        });

        harness.rowData.statusDescription = 'Active';
        harness.input.value = 'unknown';
        await harness.input.dispatch('blur');
        await flushDeferred();

        expect(harness.applyRecord).toHaveBeenCalledWith(
            harness.cell,
            { statusDescription: '' },
            null
        );
        expect(harness.rowData.statusDescription).toBe('');
        expect(harness.success).toHaveBeenCalledWith('UNKNOWN');
        expect(harness.markInvalid).toHaveBeenCalledWith(
            harness.cell,
            'Invalid lookup code'
        );
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

    test('Tab accepting a mapped autocomplete suggestion applies the full row patch', async () => {
        const harness = createHarness({
            withRowNavigation: true,
            options: {
                autoComplete: true,
                mapToRow: {
                    status: 'id',
                    statusDescription: 'description'
                }
            }
        });

        harness.input.value = 'rep';
        await harness.input.dispatch('input');
        await Promise.resolve();
        await harness.input.dispatch('keydown', { key: 'Tab' });
        await flushDeferred();

        expect(harness.applyRecord).toHaveBeenCalledWith(
            harness.cell,
            {
                status: 'REPAIR',
                statusDescription: 'Under repair'
            },
            records[1]
        );
        expect(harness.rowData.statusDescription).toBe('Under repair');
        expect(harness.nextCell.edit).toHaveBeenCalledOnce();
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
            initialValue: 'INVALID',
            options: {
                allowEmpty: true,
                autoComplete: true
            }
        });

        harness.cellElement.dataset.cellError = 'true';
        harness.cellElement.title = 'Invalid lookup code';
        harness.input.value = '';
        await harness.input.dispatch('input', {
            inputType: 'deleteContentBackward'
        });
        await harness.input.dispatch('blur');

        expect(harness.input.value).toBe('');
        expect(harness.success).toHaveBeenCalledWith('');
        expect(harness.clearInvalid).toHaveBeenCalledWith(harness.cell);
        expect(harness.markInvalid).not.toHaveBeenCalled();
        expect(harness.cellElement.dataset.cellError).toBeUndefined();
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

    test('Tab resolves a matching suggestion before a pending autocomplete request updates the input', async () => {
        let resolveAutoComplete;
        let repRequests = 0;
        const load = vi.fn(({ query }) => {
            if (query === 'REP' && repRequests === 0) {
                repRequests += 1;
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
            load,
            withRowNavigation: true
        });
        const preventDefault = vi.fn();
        const stopPropagation = vi.fn();

        harness.input.value = 'rep';
        await harness.input.dispatch('input', {
            inputType: 'insertText'
        });
        await Promise.resolve();

        await harness.input.dispatch('keydown', {
            key: 'Tab',
            preventDefault,
            stopPropagation
        });
        resolveAutoComplete([records[1]]);
        await Promise.resolve();
        await flushDeferred();

        expect(preventDefault).toHaveBeenCalledOnce();
        expect(stopPropagation).toHaveBeenCalledOnce();
        expect(harness.input.value).toBe('REPAIR');
        expect(harness.input.selectionStart).toBe(6);
        expect(harness.input.selectionEnd).toBe(6);
        expect(harness.success).toHaveBeenCalledOnce();
        expect(harness.success).toHaveBeenCalledWith('REPAIR');
        expect(harness.cancel).not.toHaveBeenCalled();
        expect(harness.markInvalid).not.toHaveBeenCalled();
        expect(harness.nextCell.edit).toHaveBeenCalledOnce();
        expect(harness.table.navigateNext).not.toHaveBeenCalled();
        expect(harness.table.navigatePrev).not.toHaveBeenCalled();
    });

    test('a stale autocomplete response does not modify the input after a Tab commit', async () => {
        let resolveAutoComplete;
        let repRequests = 0;
        const load = vi.fn(({ query }) => {
            if (query === 'REP' && repRequests === 0) {
                repRequests += 1;
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

        harness.input.value = 'rep';
        const pendingInput = harness.input.dispatch('input', {
            inputType: 'insertText'
        });
        await Promise.resolve();

        await harness.input.dispatch('keydown', { key: 'Tab' });
        harness.input.value = 'CLOSED';
        resolveAutoComplete([records[1]]);
        await pendingInput;
        await flushDeferred();

        expect(harness.input.value).toBe('CLOSED');
        expect(harness.success).toHaveBeenCalledOnce();
        expect(harness.success).toHaveBeenCalledWith('REPAIR');
        expect(harness.cell.navigateNext).toHaveBeenCalledOnce();
    });

    test('Tab accepts a visible autocomplete suggestion and navigates next', async () => {
        const harness = createHarness({
            options: {
                autoComplete: true
            },
            withRowNavigation: true
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
        await flushDeferred();

        expect(preventDefault).toHaveBeenCalledOnce();
        expect(harness.input.value).toBe('REPAIR');
        expect(harness.input.selectionStart).toBe(6);
        expect(harness.input.selectionEnd).toBe(6);
        expect(harness.success).toHaveBeenCalledOnce();
        expect(harness.success).toHaveBeenCalledWith('REPAIR');
        expect(harness.cancel).not.toHaveBeenCalled();
        expect(harness.nextCell.edit).toHaveBeenCalledOnce();
        expect(harness.table.navigateNext).not.toHaveBeenCalled();
        expect(harness.table.navigatePrev).not.toHaveBeenCalled();
        expect(getLookupMetadata(harness.rowData, 'status').current).toEqual({
            value: 'REPAIR',
            description: 'Under repair'
        });

        await harness.input.dispatch('blur');

        expect(harness.success).toHaveBeenCalledOnce();
    });

    test('Tab can conservatively keep the typed prefix when autocomplete acceptance is disabled', async () => {
        const harness = createHarness({
            options: {
                autoComplete: true,
                autoCompleteOnTab: false
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
        await flushDeferred();

        expect(preventDefault).toHaveBeenCalledOnce();
        expect(harness.input.value).toBe('REP');
        expect(harness.success).toHaveBeenCalledOnce();
        expect(harness.success).toHaveBeenCalledWith('REP');
        expect(harness.markInvalid).toHaveBeenCalledOnce();
        expect(harness.cell.navigateNext).toHaveBeenCalledOnce();
        expect(harness.table.navigatePrev).not.toHaveBeenCalled();
    });

    test('Tab does not search for a pending suggestion when autocomplete acceptance is disabled', async () => {
        let resolveAutoComplete;
        let repRequests = 0;
        const load = vi.fn(({ query }) => {
            if (query === 'REP' && repRequests === 0) {
                repRequests += 1;
                return new Promise(resolve => {
                    resolveAutoComplete = resolve;
                });
            }

            return records.filter(record => record.id.includes(query));
        });
        const harness = createHarness({
            options: {
                autoComplete: true,
                autoCompleteOnTab: false
            },
            load
        });

        harness.input.value = 'rep';
        const pendingInput = harness.input.dispatch('input', {
            inputType: 'insertText'
        });
        await Promise.resolve();

        await harness.input.dispatch('keydown', { key: 'Tab' });
        await flushDeferred();

        expect(load).toHaveBeenCalledTimes(2);
        expect(harness.success).toHaveBeenCalledWith('REP');
        expect(harness.markInvalid).toHaveBeenCalledOnce();

        resolveAutoComplete([records[1]]);
        await pendingInput;

        expect(harness.input.value).toBe('REP');
    });

    test('Tab commits a complete valid value once and navigates next', async () => {
        const harness = createHarness();
        const preventDefault = vi.fn();

        harness.input.value = 'repair';
        await harness.input.dispatch('keydown', {
            key: 'Tab',
            preventDefault
        });
        await harness.input.dispatch('blur');
        await flushDeferred();

        expect(preventDefault).toHaveBeenCalledOnce();
        expect(harness.success).toHaveBeenCalledOnce();
        expect(harness.success).toHaveBeenCalledWith('REPAIR');
        expect(harness.cell.navigateNext).toHaveBeenCalledOnce();
        expect(harness.table.navigatePrev).not.toHaveBeenCalled();
    });

    test('Shift+Tab commits a complete valid value and navigates previous', async () => {
        const harness = createHarness();
        const preventDefault = vi.fn();

        harness.input.value = 'repair';
        await harness.input.dispatch('keydown', {
            key: 'Tab',
            shiftKey: true,
            preventDefault
        });
        await flushDeferred();

        expect(preventDefault).toHaveBeenCalledOnce();
        expect(harness.success).toHaveBeenCalledOnce();
        expect(harness.success).toHaveBeenCalledWith('REPAIR');
        expect(harness.cell.navigatePrev).toHaveBeenCalledOnce();
        expect(harness.table.navigateNext).not.toHaveBeenCalled();
    });

    test('Tab with an invalid value keeps the existing invalid commit behavior', async () => {
        const harness = createHarness({
            options: {
                autoComplete: true
            }
        });

        harness.input.value = 'xyz';
        await harness.input.dispatch('keydown', {
            key: 'Tab'
        });
        await flushDeferred();

        expect(harness.input.value).toBe('XYZ');
        expect(harness.success).toHaveBeenCalledOnce();
        expect(harness.success).toHaveBeenCalledWith('XYZ');
        expect(harness.markInvalid).toHaveBeenCalledWith(
            harness.cell,
            'Invalid lookup code'
        );
        expect(harness.cancel).not.toHaveBeenCalled();
        expect(harness.cell.navigateNext).toHaveBeenCalledOnce();
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

    test('Enter opens the configured lookup dialog and applies the selected record', async () => {
        const dialog = {
            open: vi.fn(async () => records[1])
        };
        const harness = createHarness({
            options: {
                dialog,
                dialogTitle: 'Search status',
                dialogColumns: [
                    { field: 'id', title: 'Code' },
                    { field: 'description', title: 'Description' }
                ]
            }
        });
        const preventDefault = vi.fn();
        const stopPropagation = vi.fn();

        await harness.input.dispatch('keydown', {
            key: 'Enter',
            preventDefault,
            stopPropagation
        });

        expect(preventDefault).toHaveBeenCalledOnce();
        expect(stopPropagation).toHaveBeenCalledOnce();
        expect(dialog.open).toHaveBeenCalledOnce();
        expect(harness.success).toHaveBeenCalledWith('REPAIR');
        expect(getLookupMetadata(harness.rowData, 'status').current).toEqual({
            value: 'REPAIR',
            description: 'Under repair'
        });
    });

    test('forwards dialogOptions while preserving editor-calculated dialog fields', async () => {
        const dialog = {
            open: vi.fn(async () => records[2])
        };
        const harness = createHarness({
            options: {
                dialog,
                dialogTitle: 'Search status',
                dialogColumns: [
                    { field: 'id', title: 'Code' },
                    { field: 'description', title: 'Description' }
                ],
                dialogOptions: {
                    closeOnBackdropClick: false,
                    destroyOnClose: true,
                    pagination: {
                        enabled: true,
                        pageSize: 10,
                        controls: 'full'
                    },
                    title: 'Ignored title',
                    columns: [{ field: 'ignored' }],
                    data: [{ id: 'IGNORED' }],
                    searchFields: ['ignored']
                }
            }
        });

        await harness.container.children[1].dispatch('click');

        expect(dialog.open).toHaveBeenCalledOnce();
        expect(dialog.open).toHaveBeenCalledWith({
            closeOnBackdropClick: false,
            destroyOnClose: true,
            pagination: {
                enabled: true,
                pageSize: 10,
                controls: 'full'
            },
            title: 'Search status',
            columns: [
                { field: 'id', title: 'Code' },
                { field: 'description', title: 'Description' }
            ],
            data: records,
            valueField: 'id',
            searchFields: ['id', 'description'],
            searchPlaceholder: 'Search...'
        });
        expect(harness.success).toHaveBeenCalledWith('DOCKED');
    });
});

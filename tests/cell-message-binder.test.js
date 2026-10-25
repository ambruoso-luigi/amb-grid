import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { CellMessageBinder } from '../src/ui/cell-message-binder.js';
import { setLookupMetadata } from '../src/lib/lookup-metadata.js';
import { normalizeFloatingMessageOptions } from '../src/lib/table/table-factory.js';
import { prepareColumnPipeline } from '../src/lib/table/column-pipeline.js';

const createNode = (className = '', parent = null) => {
    const classes = new Set(className.split(' ').filter(Boolean));
    const node = {
        className,
        parentNode: parent,
        dataset: {},
        attributes: {},
        contains: candidate => candidate === node,
        getAttribute: name => node.attributes[name],
        removeAttribute: vi.fn(name => delete node.attributes[name]),
        closest(selector) {
            if (selector === '.tabulator-cell' && classes.has('tabulator-cell')) return node;
            if (selector === '.tabulator-row' && classes.has('tabulator-row')) return node;
            if (selector === '.tabulator-calcs, .amb-calc-row'
                && (classes.has('tabulator-calcs') || classes.has('amb-calc-row'))) return node;
            if (selector.includes('[role="dialog"]') && node.attributes.role === 'dialog') return node;
            return parent?.closest?.(selector) || null;
        }
    };
    return node;
};

const createHarness = (options = {}) => {
    const tableListeners = new Map();
    const documentListeners = new Map();
    const crudHandlers = new Map();
    const cellErrors = [];
    const unsubscribes = [];
    const tableElement = {
        addEventListener: vi.fn((name, handler) => tableListeners.set(name, handler)),
        removeEventListener: vi.fn((name, handler) => {
            if (tableListeners.get(name) === handler) tableListeners.delete(name);
        }),
        contains: target => target?.insideTable === true,
        dispatch(name, event) { tableListeners.get(name)?.(event); }
    };
    globalThis.document = {
        addEventListener: vi.fn((name, handler) => documentListeners.set(name, handler)),
        removeEventListener: vi.fn((name, handler) => {
            if (documentListeners.get(name) === handler) documentListeners.delete(name);
        }),
        dispatch(name, event) { documentListeners.get(name)?.(event); }
    };
    const rows = [];
    const table = {
        element: tableElement,
        getRow: vi.fn(() => { throw new Error('getRow does not accept DOM elements'); }),
        getRows: vi.fn(() => rows)
    };
    const crudHelper = {
        options: { idField: 'id', tempIdField: '_ambTempId' },
        getCellErrors: () => cellErrors,
        on: vi.fn((name, handler) => {
            crudHandlers.set(name, handler);
            const unsubscribe = vi.fn();
            unsubscribes.push(unsubscribe);
            return unsubscribe;
        })
    };
    const floatingMessage = {
        show: vi.fn(),
        scheduleShow: vi.fn(),
        hide: vi.fn()
    };
    const binder = new CellMessageBinder({ table, tableElement, crudHelper, floatingMessage, ...options });

    const makeCell = (data, dataset = {}, { rowClass = 'tabulator-row', registered = true } = {}) => {
        const rowElement = createNode(rowClass);
        const cellElement = createNode('tabulator-cell', rowElement);
        cellElement.insideTable = true;
        Object.assign(cellElement.dataset, dataset);
        cellElement.attributes['tabulator-field'] = dataset.field
            || dataset.lookupField
            || dataset.largeTextField
            || 'value';
        const row = { getData: () => data, getElement: () => rowElement };
        const cell = { getElement: () => cellElement };
        if (registered) rows.push(row);
        return { cell, cellElement, row, rowElement };
    };

    return {
        binder,
        crudHandlers,
        cellErrors,
        documentListeners,
        floatingMessage,
        makeCell,
        table,
        tableElement,
        tableListeners,
        unsubscribes
    };
};

describe('CellMessageBinder', () => {
    const originalDocument = globalThis.document;

    beforeEach(() => vi.restoreAllMocks());
    afterEach(() => { globalThis.document = originalDocument; });

    test('resolves data cells through RowComponents without passing DOM elements to getRow', () => {
        const harness = createHarness();
        const target = harness.makeCell({ id: 7, notes: 'Complete note' }, { largeTextField: 'notes' });

        harness.tableElement.dispatch('pointermove', { target: target.cellElement });
        expect(harness.floatingMessage.scheduleShow).toHaveBeenCalledWith(
            target.cellElement,
            expect.objectContaining({ message: 'Complete note' })
        );
        harness.tableElement.dispatch('focusin', { target: target.cellElement });
        expect(harness.floatingMessage.show).toHaveBeenCalledWith(
            target.cellElement,
            expect.objectContaining({ message: 'Complete note' })
        );
        expect(harness.table.getRows).toHaveBeenCalled();
        expect(harness.table.getRow).not.toHaveBeenCalled();
    });

    test.each(['tabulator-row tabulator-calcs', 'tabulator-row amb-calc-row'])(
        'ignores calculation cells in %s for pointer and keyboard messages', rowClass => {
            const harness = createHarness();
            const target = harness.makeCell({ id: 4, notes: 'Calculation' },
                { largeTextField: 'notes' }, { rowClass });
            harness.cellErrors.push({ key: 4, field: 'notes', message: 'Invalid calculation' });

            harness.tableElement.dispatch('pointermove', { target: target.cellElement });
            harness.tableElement.dispatch('focusin', { target: target.cellElement });

            expect(harness.binder.resolveCellMessage(target.cellElement)).toBeNull();
            expect(harness.floatingMessage.show).not.toHaveBeenCalled();
            expect(harness.floatingMessage.scheduleShow).not.toHaveBeenCalled();
            expect(harness.table.getRows).not.toHaveBeenCalled();
            expect(harness.table.getRow).not.toHaveBeenCalled();
        }
    );

    test('ignores a data-shaped row without a RowComponent', () => {
        const harness = createHarness();
        const target = harness.makeCell({ status: 'A' }, { lookupField: 'status' }, { registered: false });
        setLookupMetadata(target.row.getData(), 'status', 'A', 'Unregistered');
        harness.cellErrors.push({ key: undefined, field: 'status', message: 'Stale error' });

        harness.tableElement.dispatch('pointermove', { target: target.cellElement });
        harness.tableElement.dispatch('focusin', { target: target.cellElement });

        expect(harness.binder.resolveCellMessage(target.cellElement)).toBeNull();
        expect(harness.floatingMessage.show).not.toHaveBeenCalled();
        expect(harness.floatingMessage.scheduleShow).not.toHaveBeenCalled();
        expect(harness.table.getRow).not.toHaveBeenCalled();
    });

    test('the most recent real pointer or keyboard interaction owns lookup messages', () => {
        const harness = createHarness();
        const a = harness.makeCell({ status: 'A' }, { lookupField: 'status' });
        const b = harness.makeCell({ status: 'B' }, { lookupField: 'status' });
        const c = harness.makeCell({ status: 'C' }, { lookupField: 'status' });
        setLookupMetadata(a.row.getData(), 'status', 'A', 'Description A');
        setLookupMetadata(b.row.getData(), 'status', 'B', 'Description B');
        setLookupMetadata(c.row.getData(), 'status', 'C', 'Description C');

        harness.tableElement.dispatch('pointermove', { target: a.cellElement });
        expect(harness.floatingMessage.scheduleShow).toHaveBeenLastCalledWith(
            a.cellElement,
            expect.objectContaining({ message: 'Description A' })
        );

        harness.tableElement.dispatch('focusin', { target: b.cellElement });
        expect(harness.floatingMessage.show).toHaveBeenLastCalledWith(
            b.cellElement,
            expect.objectContaining({ message: 'Description B' })
        );

        harness.tableElement.dispatch('pointerleave', {});
        expect(harness.binder.activeSource).toBe('keyboard');
        expect(harness.floatingMessage.show).toHaveBeenLastCalledWith(
            b.cellElement,
            expect.objectContaining({ message: 'Description B' })
        );

        harness.tableElement.dispatch('pointermove', { target: c.cellElement });
        expect(harness.binder.activeSource).toBe('mouse');
        expect(harness.floatingMessage.scheduleShow).toHaveBeenLastCalledWith(
            c.cellElement,
            expect.objectContaining({ message: 'Description C' })
        );
    });

    test('does not restart the lookup hover delay for pointer movement within one cell', () => {
        const harness = createHarness();
        const target = harness.makeCell({ status: 'A' }, { lookupField: 'status' });
        setLookupMetadata(target.row.getData(), 'status', 'A', 'Description A');

        harness.tableElement.dispatch('pointermove', { target: target.cellElement });
        harness.tableElement.dispatch('pointermove', { target: target.cellElement });
        harness.tableElement.dispatch('pointermove', { target: target.cellElement });

        expect(harness.floatingMessage.scheduleShow).toHaveBeenCalledTimes(1);
        expect(harness.floatingMessage.scheduleShow).toHaveBeenCalledWith(
            target.cellElement,
            expect.objectContaining({ message: 'Description A' })
        );
    });

    test('schedules once per lookup cell when the pointer changes cells', () => {
        const harness = createHarness();
        const a = harness.makeCell({ status: 'A' }, { lookupField: 'status' });
        const b = harness.makeCell({ status: 'B' }, { lookupField: 'status' });
        setLookupMetadata(a.row.getData(), 'status', 'A', 'Description A');
        setLookupMetadata(b.row.getData(), 'status', 'B', 'Description B');

        harness.tableElement.dispatch('pointermove', { target: a.cellElement });
        harness.tableElement.dispatch('pointermove', { target: a.cellElement });
        harness.tableElement.dispatch('pointermove', { target: b.cellElement });

        expect(harness.floatingMessage.scheduleShow).toHaveBeenCalledTimes(2);
        expect(harness.floatingMessage.scheduleShow).toHaveBeenLastCalledWith(
            b.cellElement,
            expect.objectContaining({ message: 'Description B' })
        );
    });

    test('refreshes the active lookup cell when its metadata becomes available', () => {
        const harness = createHarness();
        const target = harness.makeCell({ status: 'A' }, { lookupField: 'status' });

        harness.tableElement.dispatch('pointermove', { target: target.cellElement });
        expect(harness.floatingMessage.scheduleShow).not.toHaveBeenCalled();

        setLookupMetadata(target.row.getData(), 'status', 'A', 'Description A');
        harness.binder._handleLookupMetadataInitialized();

        expect(harness.floatingMessage.scheduleShow).toHaveBeenCalledWith(
            target.cellElement,
            expect.objectContaining({ message: 'Description A' })
        );
    });

    test('focus without a provider hides stale content and focusout falls back to pointer', () => {
        const harness = createHarness();
        const pointer = harness.makeCell({ status: 'A' }, { lookupField: 'status' });
        const plain = harness.makeCell({ stock: 1 });
        setLookupMetadata(pointer.row.getData(), 'status', 'A', 'Pointer description');

        harness.tableElement.dispatch('pointermove', { target: pointer.cellElement });
        harness.tableElement.dispatch('focusin', { target: plain.cellElement });
        expect(harness.floatingMessage.hide).toHaveBeenCalled();

        harness.tableElement.dispatch('focusout', { target: plain.cellElement, relatedTarget: null });
        expect(harness.floatingMessage.scheduleShow).toHaveBeenLastCalledWith(
            pointer.cellElement,
            expect.objectContaining({ message: 'Pointer description' })
        );
    });

    test.each([
        ['lookup', { status: 'A' }, { lookupField: 'status' }, 'Description A'],
        ['large text', { notes: 'Full note' }, { largeTextField: 'notes' }, 'Full note']
    ])('validation overrides %s and clearing restores the lower provider', (_label, data, dataset, lowerMessage) => {
        const harness = createHarness();
        const target = harness.makeCell(data, dataset);
        if (dataset.lookupField) setLookupMetadata(data, 'status', 'A', lowerMessage);

        harness.tableElement.dispatch('focusin', { target: target.cellElement });
        harness.cellErrors.push({ key: undefined, field: dataset.lookupField || dataset.largeTextField, message: 'Required' });
        harness.crudHandlers.get('cell-error')({ cell: target.cell, message: 'Required' });
        expect(harness.floatingMessage.show).toHaveBeenLastCalledWith(
            target.cellElement,
            expect.objectContaining({ type: 'error', message: 'Required' })
        );

        harness.cellErrors.length = 0;
        harness.crudHandlers.get('cell-error-cleared')({ cell: target.cell });
        expect(harness.floatingMessage.show).toHaveBeenLastCalledWith(
            target.cellElement,
            expect.objectContaining({ message: lowerMessage })
        );
    });

    test('resolves CRUD validation after a rerender replaces both row and cell components', () => {
        const harness = createHarness();
        const first = harness.makeCell({ id: 4, type: '' }, { field: 'type' });

        harness.cellErrors.push({ key: 4, field: 'type', message: 'Type is required' });
        expect(harness.binder.resolveValidationMessage(first.cellElement))
            .toMatchObject({ type: 'error', message: 'Type is required' });

        const rerendered = harness.makeCell({ id: 4, type: '' }, { field: 'type' });

        expect(harness.binder.resolveValidationMessage(rerendered.cellElement))
            .toMatchObject({ type: 'error', message: 'Type is required' });
        harness.tableElement.dispatch('pointermove', { target: rerendered.cellElement });
        expect(harness.floatingMessage.scheduleShow).toHaveBeenLastCalledWith(
            rerendered.cellElement,
            expect.objectContaining({ message: 'Type is required' })
        );

        harness.cellErrors.length = 0;
        harness.crudHandlers.get('cell-error-cleared')({ cell: rerendered.cell });
        expect(harness.binder.resolveValidationMessage(rerendered.cellElement)).toBeNull();
    });

    test('dialog focus hides messages and destroy removes delegated listeners', () => {
        const harness = createHarness();
        const dialog = createNode('amb-large-text-editor');
        dialog.attributes.role = 'dialog';
        const control = createNode('', dialog);

        globalThis.document.dispatch('focusin', { target: control });
        expect(harness.floatingMessage.hide).toHaveBeenCalled();

        harness.binder.destroy();
        expect(harness.tableListeners.size).toBe(0);
        expect(harness.documentListeners.size).toBe(0);
        harness.unsubscribes.forEach(unsubscribe => expect(unsubscribe).toHaveBeenCalledOnce());
    });

    const allProviders = harness => {
        const target = harness.makeCell({ id: 8, notes: '<b>Full text</b>' }, {
            field: 'notes', lookupField: 'notes', largeTextField: 'notes'
        });
        setLookupMetadata(target.row.getData(), 'notes', 'value', '<b>Lookup description</b>');
        harness.cellErrors.push({ key: 8, field: 'notes', message: '<b>Required</b>' });
        return target.cellElement;
    };

    test.each([
        [{}, 'error', 'Validation error', '<b>Required</b>'],
        [{ validationErrors: { enabled: false } }, 'info', 'Description', '<b>Lookup description</b>'],
        [{ validationErrors: { enabled: false }, lookupDescriptions: { enabled: false } }, 'info', 'Text', '<b>Full text</b>']
    ])('preserves provider priority and falls through disabled channels: %j', (configuration, type, title, message) => {
        const harness = createHarness({ floatingMessagesByField: new Map([['notes', configuration]]) });
        const target = allProviders(harness);
        expect(harness.binder.resolveCellMessage(target)).toEqual({ type, title, message });
        harness.tableElement.dispatch('focusin', { target });
        expect(harness.floatingMessage.show).toHaveBeenLastCalledWith(target, { type, title, message });
    });

    test.each([
        ['validationErrors', 'error', '<b>Required</b>'],
        ['lookupDescriptions', 'info', '<b>Lookup description</b>'],
        ['largeTextPreviews', 'info', '<b>Full text</b>']
    ])('locally reenables %s and passes its title and classes as presentation only', (channel, type, message) => {
        const harness = createHarness({
            validationErrors: false, lookupDescriptions: false, largeTextPreviews: false,
            floatingMessagesByField: new Map([['notes', {
                [channel]: { enabled: true, title: '<b>Custom title</b>', className: 'custom-theme wide-tooltip' }
            }]])
        });
        const target = allProviders(harness);
        harness.tableElement.dispatch('pointermove', { target });
        expect(harness.floatingMessage.scheduleShow).toHaveBeenLastCalledWith(target, {
            type, title: '<b>Custom title</b>', message, className: 'custom-theme wide-tooltip'
        });
    });

    test.each(['validationErrors', 'lookupDescriptions', 'largeTextPreviews'])('inherits the global disabled default for %s when enabled is omitted', channel => {
        const harness = createHarness({
            validationErrors: false, lookupDescriptions: false, largeTextPreviews: false,
            floatingMessagesByField: new Map([['notes', { [channel]: { title: 'Custom', className: 'custom' } }]])
        });
        expect(harness.binder.resolveCellMessage(allProviders(harness))).toBeNull();
    });

    test.each([false, { enabled: false }])('cannot override a disabled global master: %j', configuration => {
        const globalOptions = normalizeFloatingMessageOptions(configuration);
        const local = Object.fromEntries(['validationErrors', 'lookupDescriptions', 'largeTextPreviews']
            .map(channel => [channel, { enabled: true, title: 'Custom', className: 'custom' }]));
        const harness = createHarness({ ...globalOptions, floatingMessagesByField: new Map([['notes', local]]) });
        const target = allProviders(harness);
        harness.tableElement.dispatch('pointermove', { target });
        harness.tableElement.dispatch('focusin', { target });
        expect(harness.binder.resolveCellMessage(target)).toBeNull();
        expect(harness.floatingMessage.show).not.toHaveBeenCalled();
        expect(harness.floatingMessage.scheduleShow).not.toHaveBeenCalled();
        expect(globalOptions.searchFilterStatus).toBe(false);
    });

    test('resolves column presentation independently of editors and returns standard presentation on another column', () => {
        const pipeline = prepareColumnPipeline({ columns: [
            { field: 'notes', floatingMessages: { largeTextPreviews: { title: 'Historical notes', className: 'antique-notes-tooltip' } } },
            { field: 'other', floatingMessages: { largeTextPreviews: { title: 'Other notes', className: 'other-tooltip' } } },
            { field: 'standard' }
        ] });
        const harness = createHarness({ floatingMessagesByField: pipeline.floatingMessagesByField });
        const custom = harness.makeCell({ id: 1, notes: 'First' }, { largeTextField: 'notes' });
        const other = harness.makeCell({ id: 1, other: 'Second' }, { largeTextField: 'other' });
        const standard = harness.makeCell({ id: 1, standard: 'Third' }, { largeTextField: 'standard' });
        harness.tableElement.dispatch('focusin', { target: custom.cellElement });
        expect(harness.floatingMessage.show).toHaveBeenLastCalledWith(custom.cellElement, {
            type: 'info', title: 'Historical notes', message: 'First', className: 'antique-notes-tooltip'
        });
        harness.tableElement.dispatch('focusin', { target: other.cellElement });
        expect(harness.floatingMessage.show).toHaveBeenLastCalledWith(other.cellElement, {
            type: 'info', title: 'Other notes', message: 'Second', className: 'other-tooltip'
        });
        harness.tableElement.dispatch('focusin', { target: standard.cellElement });
        expect(harness.floatingMessage.show).toHaveBeenLastCalledWith(standard.cellElement, {
            type: 'info', title: 'Text', message: 'Third'
        });
    });

    test('hides messages when all three local channels are disabled', () => {
        const local = Object.fromEntries(['validationErrors', 'lookupDescriptions', 'largeTextPreviews']
            .map(channel => [channel, { enabled: false }]));
        const harness = createHarness({ floatingMessagesByField: new Map([['notes', local]]) });
        const target = allProviders(harness);
        harness.tableElement.dispatch('focusin', { target });
        expect(harness.binder.resolveCellMessage(target)).toBeNull();
        expect(harness.floatingMessage.show).not.toHaveBeenCalled();
        expect(harness.floatingMessage.hide).toHaveBeenCalled();
    });

    test('keeps the same field isolated between grids and includes classes in the hover identity', () => {
        const create = className => {
            const pipeline = prepareColumnPipeline({ columns: [{ field: 'notes', floatingMessages: {
                largeTextPreviews: { className }
            } }] });
            const harness = createHarness({ floatingMessagesByField: pipeline.floatingMessagesByField });
            const target = harness.makeCell({ id: 1, notes: 'Same text' }, { largeTextField: 'notes' });
            return harness.binder.resolveCellMessage(target.cellElement);
        };
        const a = create('theme-a');
        const b = create('theme-b');
        expect(a).toEqual({ type: 'info', title: 'Text', message: 'Same text', className: 'theme-a' });
        expect(b).toEqual({ ...a, className: 'theme-b' });
        const { binder } = createHarness();
        expect(binder._getMessageKey(a)).not.toBe(binder._getMessageKey(b));
    });
});

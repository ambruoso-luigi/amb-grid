import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { CellMessageBinder } from '../src/ui/cell-message-binder.js';
import { setLookupMetadata } from '../src/lib/lookup-metadata.js';

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
            if (selector.includes('[role="dialog"]') && node.attributes.role === 'dialog') return node;
            return parent?.closest?.(selector) || null;
        }
    };
    return node;
};

const createHarness = () => {
    const tableListeners = new Map();
    const documentListeners = new Map();
    const crudHandlers = new Map();
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
    const rows = new Map();
    const table = {
        element: tableElement,
        getRow: vi.fn(element => rows.get(element) || null)
    };
    const crudHelper = {
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
    const binder = new CellMessageBinder({ table, tableElement, crudHelper, floatingMessage });

    const makeCell = (data, dataset = {}) => {
        const rowElement = createNode('tabulator-row');
        const cellElement = createNode('tabulator-cell', rowElement);
        cellElement.insideTable = true;
        Object.assign(cellElement.dataset, dataset);
        const row = { getData: () => data };
        const cell = { getElement: () => cellElement };
        rows.set(rowElement, row);
        return { cell, cellElement, row, rowElement };
    };

    return {
        binder,
        crudHandlers,
        documentListeners,
        floatingMessage,
        makeCell,
        tableElement,
        tableListeners,
        unsubscribes
    };
};

describe('CellMessageBinder', () => {
    const originalDocument = globalThis.document;

    beforeEach(() => vi.restoreAllMocks());
    afterEach(() => { globalThis.document = originalDocument; });

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
        harness.crudHandlers.get('cell-error')({ cell: target.cell, message: 'Required' });
        expect(harness.floatingMessage.show).toHaveBeenLastCalledWith(
            target.cellElement,
            expect.objectContaining({ type: 'error', message: 'Required' })
        );

        harness.crudHandlers.get('cell-error-cleared')({ cell: target.cell });
        expect(harness.floatingMessage.show).toHaveBeenLastCalledWith(
            target.cellElement,
            expect.objectContaining({ message: lowerMessage })
        );
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
});

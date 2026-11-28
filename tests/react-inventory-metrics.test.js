import { expect, test, vi } from 'vitest';
import { inventorySnapshot, LOW_STOCK_THRESHOLD } from '../examples/react-demo/src/inventory-metrics.ts';
import { inventoryRows } from '../examples/react-demo/src/data/inventory.ts';
import { createSaveGate, excludedRows, reviewChanges, sendValidChanges, summarizeReport } from '../examples/react-demo/src/inventory-save.ts';
import { CrudHelper } from '../src/lib/crud-helper.js';

const row = (stockQuantity, status = 'ACTIVE', state = 'clean', cellErrors = []) => ({ state, after: { stockQuantity, status }, cellErrors });
const report = (rows, changedRowsCount = 0, validChangedRowsCount = 0) => ({ rows, changedRowsCount, validChangedRowsCount });

test('counts current inventory from the complete CRUD report and distinguishes valid changes', () => {
    const rows = [row(0), row(19, 'HOLD', 'modified', [{ field: 'notes' }, { field: 'notes' }, { field: 'stockQuantity' }]), row(20), row(0, 'HOLD', 'deleted', [{ field: 'notes' }])];
    expect(inventorySnapshot(report(rows, 5, 3))).toEqual({ products: 3, modified: 5, errors: 2, ready: 3, lowStock: 2, onHold: 1 });
    expect(LOW_STOCK_THRESHOLD).toBe(20);
});

test('low stock excludes empty, nonnumeric, fractional and negative quantities', () => {
    const values = [0, 19, 20, 21, null, undefined, '', '  ', 'abc', -1, 1.5, '19'];
    expect(inventorySnapshot(report(values.map(value => row(value)))).lowStock).toBe(3);
});

test('snapshots follow insertion, deletion, rollback and saved or reloaded data', () => {
    const initial = [row(24), row(12, 'HOLD')];
    expect(inventorySnapshot(report(initial))).toMatchObject({ products: 2, lowStock: 1, onHold: 1 });
    expect(inventorySnapshot(report([...initial, row(0, 'ACTIVE', 'new')], 1, 1))).toMatchObject({ products: 3, modified: 1, ready: 1, lowStock: 2 });
    expect(inventorySnapshot(report([initial[0], row(12, 'HOLD', 'deleted')], 1, 1))).toMatchObject({ products: 1, modified: 1, ready: 1, lowStock: 0, onHold: 0 });
    expect(inventorySnapshot(report(initial))).toMatchObject({ products: 2, modified: 0, ready: 0, lowStock: 1, onHold: 1 });
});

test('initial dataset supplies the expected native aggregate inputs', () => {
    expect(inventoryRows.reduce((sum, item) => sum + item.stockQuantity, 0)).toBe(296);
    expect(inventoryRows.reduce((sum, item) => sum + item.stockQuantity * item.unitPrice, 0)).toBeCloseTo(22131.6);
    expect(inventoryRows.filter(item => item.requiresInspection)).toHaveLength(4);
    const snapshot = inventorySnapshot(report(inventoryRows.map(item => ({ state: 'clean', after: item, cellErrors: [] }))));
    expect(snapshot).toMatchObject({ products: 8, lowStock: 4, onHold: 1 });
});

test('validates before reviewing and describes all excluded row errors without internal identifiers', () => {
    const invalid = { after: { itemCode: '' }, cellErrors: [{ field: 'productName', message: 'This field is required' }, { field: 'stockQuantity', message: 'Cannot be negative' }], rowError: null };
    const state = { invalidChangedRows: [invalid], validChangedRows: [], invalidChangedRowsCount: 1 };
    const payload = { changes: { inserted: [], updated: [], deleted: [] }, canSave: false };
    const order = [];
    const grid = { validateChanges: () => order.push('validate'), getStateReport: () => (order.push('report'), state), getSavePayload: () => (order.push('payload'), payload) };
    const review = reviewChanges(grid);
    expect(order).toEqual(['validate', 'report', 'payload']);
    expect(excludedRows(review.report, 'it')).toEqual([{ label: 'Nuovo prodotto 1', errors: ['Product name: Campo obbligatorio', 'Stock quantity: Il valore non può essere negativo'] }]);
    expect(excludedRows(review.report, 'en')[0].label).toBe('New product 1');
    invalid.after.itemCode = 'ITM-1010';
    expect(reviewChanges(grid).signature).not.toBe(review.signature);
});

test('sends only reviewed changes and reconciles accepted rows after backend success', async () => {
    const changes = { inserted: [{ _ambTempId: 'temp-1', itemCode: 'ITM-1009' }], updated: [{ id: 2 }], deleted: [{ id: 3 }] };
    const current = { payload: { changes }, report: { validChangedRows: [{ key: 'temp-1', tempId: 'temp-1', state: 'new' }, { key: 2, state: 'modified' }, { key: 3, state: 'deleted' }] } };
    let resolveResponse;
    const send = vi.fn(() => new Promise(resolve => { resolveResponse = resolve; }));
    const grid = { applyBackendIds: vi.fn(mappings => ({ applied: mappings, notFound: [], invalid: [], duplicates: [] })), markRowsSaved: vi.fn(() => true) };
    const pending = sendValidChanges(grid, current, send);
    expect(JSON.parse(send.mock.calls[0][1].body)).toEqual(changes);
    expect(grid.markRowsSaved).not.toHaveBeenCalled();
    resolveResponse({ ok: true, json: async () => ({ insertedIds: [{ tempId: 'temp-1', id: 9 }] }) });
    await pending;
    expect(grid.applyBackendIds).toHaveBeenCalledWith([{ tempId: 'temp-1', id: 9 }]);
    expect(grid.markRowsSaved).toHaveBeenCalledWith([9, 2, 3]);
});

test('HTTP and network failures preserve all local rows without reconciliation', async () => {
    const current = { payload: { changes: { inserted: [], updated: [{ id: 2 }], deleted: [] } }, report: { validChangedRows: [{ key: 2, state: 'modified' }] } };
    const grid = { applyBackendIds: vi.fn(), markRowsSaved: vi.fn() };
    await expect(sendValidChanges(grid, current, async () => ({ ok: false, status: 503 }))).rejects.toThrow('503');
    await expect(sendValidChanges(grid, current, async () => { throw new Error('offline'); })).rejects.toThrow('offline');
    expect(grid.applyBackendIds).not.toHaveBeenCalled();
    expect(grid.markRowsSaved).not.toHaveBeenCalled();
});

test('save gate rejects concurrent submissions until the first operation completes', () => {
    const gate = createSaveGate();
    expect(gate.begin()).toBe(true);
    expect(gate.begin()).toBe(false);
    gate.end();
    expect(gate.begin()).toBe(true);
});

test('partial save keeps the invalid row and updates actual CRUD and KPI counts', async () => {
    const rows = [];
    const makeRow = data => {
        const element = { dataset: {}, removeAttribute() {} };
        const cells = new Map();
        const row = {
            getData: () => data, getElement: () => element,
            getCell: field => {
                if (!cells.has(field)) cells.set(field, { getField: () => field, getRow: () => row, getValue: () => data[field], getElement: () => ({ dataset: {}, removeAttribute() {} }) });
                return cells.get(field);
            },
            getCells: () => Object.keys(data).map(field => row.getCell(field)),
            update: patch => { Object.assign(data, patch); return row; },
            delete: () => { const index = rows.indexOf(row); if (index >= 0) rows.splice(index, 1); },
        };
        return row;
    };
    [1, 2, 3].forEach(id => rows.push(makeRow({ id, itemCode: `ITM-100${id}`, productName: 'Valid product', stockQuantity: 20, status: 'ACTIVE' })));
    const crud = new CrudHelper({ on: vi.fn(), off: vi.fn(), getRows: () => rows });
    crud.addCellValidator('productName', 'This field is required', value => Boolean(String(value ?? '').trim()));
    crud.updateRowFields(1, { productName: 'Updated first' });
    crud.updateRowFields(2, { productName: 'Updated second' });
    crud.updateRowFields(3, { productName: '' });
    const current = reviewChanges(crud);
    expect(inventorySnapshot(current.report)).toMatchObject({ modified: 3, errors: 1, ready: 2 });
    expect(summarizeReport(current.report)).toEqual({ pending: 3, ready: 2, invalidRows: 1, errors: 1 });
    expect(current.payload.changes.updated.map(change => change.id)).toEqual([1, 2]);
    await sendValidChanges(crud, current, async () => ({ ok: true, json: async () => ({ insertedIds: [] }) }));
    const after = crud.getStateReport();
    expect(inventorySnapshot(after)).toMatchObject({ modified: 1, errors: 1, ready: 0 });
    expect(summarizeReport(after)).toEqual({ pending: 1, ready: 0, invalidRows: 1, errors: 1 });
    expect(after.invalidChangedRows[0]).toMatchObject({ id: 3, state: 'modified', after: { productName: '' } });
    crud.updateRowFields(3, { productName: 'Corrected' });
    const corrected = reviewChanges(crud);
    expect(inventorySnapshot(corrected.report)).toMatchObject({ modified: 1, errors: 0, ready: 1 });
    await sendValidChanges(crud, corrected, async () => ({ ok: true, json: async () => ({ insertedIds: [] }) }));
    expect(inventorySnapshot(crud.getStateReport())).toMatchObject({ modified: 0, errors: 0, ready: 0 });
    expect(summarizeReport(crud.getStateReport())).toEqual({ pending: 0, ready: 0, invalidRows: 0, errors: 0 });
    rows.push(makeRow({ _state: 'new', _ambTempId: 'amb-temp-1', itemCode: 'ITM-1009', productName: '', stockQuantity: 0, status: 'ACTIVE' }));
    const incomplete = reviewChanges(crud);
    expect(incomplete.payload.canSave).toBe(false);
    expect(inventorySnapshot(incomplete.report)).toMatchObject({ modified: 1, errors: 1, ready: 0 });
    expect(incomplete.payload.changes.inserted).toEqual([]);
});

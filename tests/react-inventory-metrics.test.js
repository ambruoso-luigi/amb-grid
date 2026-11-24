import { expect, test } from 'vitest';
import { inventorySnapshot, LOW_STOCK_THRESHOLD } from '../examples/react-demo/src/inventory-metrics.ts';
import { inventoryRows } from '../examples/react-demo/src/data/inventory.ts';

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

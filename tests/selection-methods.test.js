import { describe, expect, test, vi } from 'vitest';

import { createSelectionMethods } from '../src/lib/table/controller/selection-methods.js';

describe('AMB table controller selection method group', () => {
    test('exposes exactly the flat selection controller methods', () => {
        const methods = createSelectionMethods({
            table: {},
            crud: {}
        });

        expect(Object.keys(methods).sort()).toEqual([
            'clearSelection',
            'deselectRow',
            'getSelectedData',
            'getSelectedRowComponents',
            'getSelectedRows',
            'selectRow'
        ]);
        expect(Object.values(methods).every(method => typeof method === 'function')).toBe(true);
    });

    test('keeps AMB selection semantics inside the extracted group', () => {
        const selectedData = [{ id: 1, _state: 'modified' }];
        const selectedRows = [{ name: 'selected-row' }];
        const row = {
            select: vi.fn(),
            deselect: vi.fn()
        };
        const table = {
            getSelectedData: vi.fn(() => selectedData),
            getSelectedRows: vi.fn(() => selectedRows),
            deselectRow: vi.fn()
        };
        const crud = {
            findRowByKey: vi.fn(identifier => (identifier === 1 ? row : null))
        };
        const methods = createSelectionMethods({ table, crud });

        expect(methods.getSelectedRows()).toBe(selectedData);
        expect(table.getSelectedRows).not.toHaveBeenCalled();
        expect(methods.getSelectedData()).toBe(selectedData);
        expect(methods.getSelectedRowComponents()).toBe(selectedRows);

        expect(methods.clearSelection()).toBeUndefined();
        expect(table.deselectRow).toHaveBeenCalledOnce();
        expect(table.deselectRow).toHaveBeenCalledWith();

        expect(methods.selectRow(1)).toBe(true);
        expect(row.select).toHaveBeenCalledOnce();
        expect(methods.selectRow('missing')).toBe(false);

        expect(methods.deselectRow(1)).toBe(true);
        expect(row.deselect).toHaveBeenCalledOnce();
        expect(methods.deselectRow('missing')).toBe(false);
    });
});

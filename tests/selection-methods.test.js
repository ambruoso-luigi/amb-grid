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
            'selectRow',
            'toggleSelectRow'
        ]);
        expect(Object.values(methods).every(method => typeof method === 'function')).toBe(true);
    });

    test('keeps AMB selection semantics inside the extracted group', () => {
        const selectedData = [{ id: 1, _state: 'modified' }];
        const selectedRows = [{ name: 'selected-row' }];
        const row = {
            select: vi.fn(),
            deselect: vi.fn(),
            toggleSelect: vi.fn()
        };
        const zeroRow = {
            select: vi.fn(),
            deselect: vi.fn(),
            toggleSelect: vi.fn()
        };
        const emptyStringRow = {
            select: vi.fn(),
            deselect: vi.fn(),
            toggleSelect: vi.fn()
        };
        const withoutToggleRow = {
            select: vi.fn(),
            deselect: vi.fn()
        };
        const table = {
            getSelectedData: vi.fn(() => selectedData),
            getSelectedRows: vi.fn(() => selectedRows),
            deselectRow: vi.fn(),
            toggleSelectRow: vi.fn(),
            setData: vi.fn(),
            updateData: vi.fn(),
            replaceData: vi.fn()
        };
        const crud = {
            findRowByKey: vi.fn(identifier => {
                if (identifier === 1) return row;
                if (identifier === 0) return zeroRow;
                if (identifier === '') return emptyStringRow;
                if (identifier === 'without-toggle') return withoutToggleRow;

                return null;
            }),
            updateRowFields: vi.fn(),
            validateRow: vi.fn(),
            validateAll: vi.fn(),
            getSavePayload: vi.fn(),
            getStateReport: vi.fn()
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

        crud.findRowByKey.mockClear();

        expect(methods.toggleSelectRow(1)).toBe(true);
        expect(crud.findRowByKey).toHaveBeenCalledOnce();
        expect(crud.findRowByKey).toHaveBeenLastCalledWith(1);
        expect(row.toggleSelect).toHaveBeenCalledOnce();
        expect(row.select).toHaveBeenCalledOnce();
        expect(row.deselect).toHaveBeenCalledOnce();

        expect(methods.toggleSelectRow(0)).toBe(true);
        expect(crud.findRowByKey).toHaveBeenCalledTimes(2);
        expect(crud.findRowByKey).toHaveBeenLastCalledWith(0);
        expect(zeroRow.toggleSelect).toHaveBeenCalledOnce();
        expect(zeroRow.select).not.toHaveBeenCalled();
        expect(zeroRow.deselect).not.toHaveBeenCalled();

        expect(methods.toggleSelectRow('')).toBe(true);
        expect(crud.findRowByKey).toHaveBeenCalledTimes(3);
        expect(crud.findRowByKey).toHaveBeenLastCalledWith('');
        expect(emptyStringRow.toggleSelect).toHaveBeenCalledOnce();
        expect(emptyStringRow.select).not.toHaveBeenCalled();
        expect(emptyStringRow.deselect).not.toHaveBeenCalled();

        expect(methods.toggleSelectRow('missing')).toBe(false);
        expect(crud.findRowByKey).toHaveBeenCalledTimes(4);
        expect(crud.findRowByKey).toHaveBeenLastCalledWith('missing');

        expect(methods.toggleSelectRow('without-toggle')).toBe(false);
        expect(crud.findRowByKey).toHaveBeenCalledTimes(5);
        expect(crud.findRowByKey).toHaveBeenLastCalledWith('without-toggle');
        expect(withoutToggleRow.select).not.toHaveBeenCalled();
        expect(withoutToggleRow.deselect).not.toHaveBeenCalled();
        expect(table.toggleSelectRow).not.toHaveBeenCalled();
        expect(table.setData).not.toHaveBeenCalled();
        expect(table.updateData).not.toHaveBeenCalled();
        expect(table.replaceData).not.toHaveBeenCalled();
        expect(crud.updateRowFields).not.toHaveBeenCalled();
        expect(crud.validateRow).not.toHaveBeenCalled();
        expect(crud.validateAll).not.toHaveBeenCalled();
        expect(crud.getSavePayload).not.toHaveBeenCalled();
        expect(crud.getStateReport).not.toHaveBeenCalled();
    });
});

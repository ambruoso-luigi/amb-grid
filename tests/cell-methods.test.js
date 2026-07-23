import { describe, expect, test, vi } from 'vitest';
import { createCellMethods } from '../src/lib/table/controller/cell-methods.js';

describe('AMB table contextual cell methods', () => {
    test('exposes six flat readers and delegates through rowMethods.getRowCell', () => {
        const rowIdentifier = { id: 1 }, column = { field: 'name' }, element = {}, columnComponent = {}, initial = { value: null };
        const cell = {
            getValue: vi.fn(() => 0),
            getOldValue: vi.fn(() => false),
            getInitialValue: vi.fn(() => initial),
            getElement: vi.fn(() => element),
            getField: vi.fn(() => ''),
            getColumn: vi.fn(() => columnComponent)
        };
        const rowMethods = { getRowCell: vi.fn(() => cell) };
        const methods = createCellMethods({ rowMethods });

        expect(Object.keys(methods).sort()).toEqual(['getCellColumn', 'getCellElement', 'getCellField', 'getCellInitialValue', 'getCellOldValue', 'getCellValue']);
        expect(methods.getCellValue(rowIdentifier, column)).toBe(0);
        expect(methods.getCellOldValue(rowIdentifier, column)).toBe(false);
        expect(methods.getCellInitialValue(rowIdentifier, column)).toBe(initial);
        expect(methods.getCellElement(rowIdentifier, column)).toBe(element);
        expect(methods.getCellField(rowIdentifier, column)).toBe('');
        expect(methods.getCellColumn(rowIdentifier, column)).toBe(columnComponent);
        expect(rowMethods.getRowCell).toHaveBeenCalledTimes(6);
        rowMethods.getRowCell.mock.calls.forEach(call => expect(call).toEqual([rowIdentifier, column]));
        Object.values(cell).forEach(method => expect(method).toHaveBeenCalledOnce());
        rowMethods.getRowCell.mockReturnValueOnce(false).mockReturnValueOnce({ getValue: 'not-a-function' });
        expect(methods.getCellValue(1, 'name')).toBe(false);
        expect(methods.getCellValue(1, 'name')).toBe(false);
    });
});

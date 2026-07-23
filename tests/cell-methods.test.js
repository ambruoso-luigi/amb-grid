import { describe, expect, test, vi } from 'vitest';
import { createCellMethods } from '../src/lib/table/controller/cell-methods.js';

describe('AMB table contextual cell methods', () => {
    test('exposes six flat readers and delegates through rowMethods.getRowCell', () => {
        const rowIdentifier = { id: 1 }, column = { field: 'name' }, element = {}, columnComponent = {}, initial = { value: null }, rowComponent = {}, data = {}, transform = true;
        const cell = {
            getValue: vi.fn(() => 0),
            getOldValue: vi.fn(() => false),
            getInitialValue: vi.fn(() => initial),
            getElement: vi.fn(() => element),
            getField: vi.fn(() => ''),
            getColumn: vi.fn(() => columnComponent),
            getRow: vi.fn(() => rowComponent),
            getData: vi.fn(() => data),
            getType: vi.fn(() => 'amb-type'),
            checkHeight: vi.fn()
        };
        const rowMethods = { getRowCell: vi.fn(() => cell) };
        const methods = createCellMethods({ rowMethods });

        expect(Object.keys(methods).sort()).toEqual(['checkCellHeight', 'getCellColumn', 'getCellData', 'getCellElement', 'getCellField', 'getCellInitialValue', 'getCellOldValue', 'getCellRow', 'getCellType', 'getCellValue']);
        expect(methods.getCellValue(rowIdentifier, column)).toBe(0);
        expect(methods.getCellOldValue(rowIdentifier, column)).toBe(false);
        expect(methods.getCellInitialValue(rowIdentifier, column)).toBe(initial);
        expect(methods.getCellElement(rowIdentifier, column)).toBe(element);
        expect(methods.getCellField(rowIdentifier, column)).toBe('');
        expect(methods.getCellColumn(rowIdentifier, column)).toBe(columnComponent);
        expect(methods.getCellRow(rowIdentifier, column)).toBe(rowComponent);
        expect(methods.getCellData(rowIdentifier, column, transform)).toBe(data);
        expect(cell.getData).toHaveBeenCalledWith(transform);
        expect(methods.getCellType(rowIdentifier, column)).toBe('amb-type');
        expect(methods.checkCellHeight(rowIdentifier, column)).toBe(true);
        expect(rowMethods.getRowCell).toHaveBeenCalledTimes(10);
        rowMethods.getRowCell.mock.calls.forEach(call => expect(call).toEqual([rowIdentifier, column]));
        Object.values(cell).forEach(method => expect(method).toHaveBeenCalledOnce());
        rowMethods.getRowCell.mockReturnValueOnce(false).mockReturnValueOnce({ getValue: 'not-a-function' });
        expect(methods.getCellRow(1, 'name')).toBe(false);
        expect(methods.getCellRow(1, 'name')).toBe(false);
    });
});

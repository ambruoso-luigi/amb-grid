import { describe, expect, test, vi } from 'vitest';
import { createCellMethods } from '../src/lib/table/controller/cell-methods.js';

describe('AMB table contextual cell methods', () => {
    test('exposes flat cell methods and delegates through rowMethods.getRowCell', () => {
        const rowIdentifier = { id: 1 }, column = { field: 'name' }, element = {}, columnComponent = {}, initial = { value: null }, ranges = [], rowComponent = {}, data = {}, transform = true;
        const failedValidators = [{ type: 'required' }];
        const updatedRow = {
            component: 'updated-row'
        };
        const mutableCell = {
            getField: vi.fn(() => 'name'),
            setValue: vi.fn()
        };
        const cell = {
            getValue: vi.fn(() => 0),
            getOldValue: vi.fn(() => false),
            getInitialValue: vi.fn(() => initial),
            getRanges: vi.fn(() => ranges),
            validate: vi.fn(() => failedValidators),
            edit: vi.fn(),
            cancelEdit: vi.fn(),
            navigateLeft: vi.fn(() => true),
            navigateRight: vi.fn(() => false),
            navigateUp: vi.fn(() => true),
            navigateDown: vi.fn(() => false),
            getElement: vi.fn(() => element),
            getField: vi.fn(() => ''),
            getColumn: vi.fn(() => columnComponent),
            getRow: vi.fn(() => rowComponent),
            getData: vi.fn(() => data),
            getType: vi.fn(() => 'amb-type'),
            checkHeight: vi.fn()
        };
        const rowMethods = {
            getRowCell: vi.fn()
                .mockReturnValueOnce(mutableCell)
                .mockReturnValue(cell)
        };
        const crud = {
            updateRowFields: vi.fn(() => updatedRow)
        };
        const methods = createCellMethods({
            rowMethods,
            crud
        });

        expect(Object.keys(methods).sort()).toEqual(['cancelCellEdit', 'checkCellHeight', 'editCell', 'getCellColumn', 'getCellData', 'getCellElement', 'getCellField', 'getCellInitialValue', 'getCellOldValue', 'getCellRanges', 'getCellRow', 'getCellType', 'getCellValue', 'navigateCellDown', 'navigateCellLeft', 'navigateCellRight', 'navigateCellUp', 'setCellValue', 'validateCell']);
        expect(
            methods.setCellValue(
                rowIdentifier,
                column,
                'Alice'
            )
        ).toBe(updatedRow);
        expect(methods.getCellValue(rowIdentifier, column)).toBe(0);
        expect(methods.getCellOldValue(rowIdentifier, column)).toBe(false);
        expect(methods.getCellInitialValue(rowIdentifier, column)).toBe(initial);
        expect(methods.getCellRanges(rowIdentifier, column)).toBe(ranges);
        expect(methods.validateCell(rowIdentifier, column)).toBe(failedValidators);
        expect(methods.editCell(rowIdentifier, column, true)).toBe(true);
        expect(cell.edit).toHaveBeenCalledOnce();
        expect(cell.edit).toHaveBeenCalledWith();
        expect(methods.cancelCellEdit(rowIdentifier, column)).toBe(true);
        expect(cell.cancelEdit).toHaveBeenCalledOnce();
        expect(cell.cancelEdit).toHaveBeenCalledWith();
        [
            ['navigateCellLeft', 'navigateLeft', true],
            ['navigateCellRight', 'navigateRight', false],
            ['navigateCellUp', 'navigateUp', true],
            ['navigateCellDown', 'navigateDown', false]
        ].forEach(([methodName, cellMethodName, expected]) => {
            expect(methods[methodName](rowIdentifier, column)).toBe(expected);
            expect(cell[cellMethodName]).toHaveBeenCalledOnce();
            expect(cell[cellMethodName]).toHaveBeenCalledWith();
        });
        expect(methods.getCellElement(rowIdentifier, column)).toBe(element);
        expect(methods.getCellField(rowIdentifier, column)).toBe('');
        expect(methods.getCellColumn(rowIdentifier, column)).toBe(columnComponent);
        expect(methods.getCellRow(rowIdentifier, column)).toBe(rowComponent);
        expect(methods.getCellData(rowIdentifier, column, transform)).toBe(data);
        expect(cell.getData).toHaveBeenCalledWith(transform);
        expect(methods.getCellType(rowIdentifier, column)).toBe('amb-type');
        expect(methods.checkCellHeight(rowIdentifier, column)).toBe(true);
        expect(rowMethods.getRowCell).toHaveBeenCalledTimes(19);
        rowMethods.getRowCell.mock.calls.forEach(call => expect(call).toEqual([rowIdentifier, column]));
        expect(
            mutableCell.getField
        ).toHaveBeenCalledWith();
        expect(
            crud.updateRowFields
        ).toHaveBeenCalledWith(
            rowIdentifier,
            {
                name: 'Alice'
            }
        );
        expect(
            mutableCell.setValue
        ).not.toHaveBeenCalled();
        Object.values(cell).forEach(method => expect(method).toHaveBeenCalledOnce());
        rowMethods.getRowCell.mockReturnValueOnce(false);
        expect(
            methods.setCellValue(
                999,
                'name',
                'Missing'
            )
        ).toBe(null);
        expect(crud.updateRowFields).toHaveBeenCalledOnce();
        rowMethods.getRowCell.mockReturnValueOnce(false).mockReturnValueOnce({ getValue: 'not-a-function' });
        expect(methods.getCellRanges(1, 'name')).toBe(false);
        expect(methods.getCellRanges(1, 'name')).toBe(false);
    });
});

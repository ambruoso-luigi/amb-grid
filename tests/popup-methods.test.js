import { describe, expect, test, vi } from 'vitest';

import { createPopupMethods } from '../src/lib/table/controller/popup-methods.js';

describe('AMB table contextual popup methods', () => {
    test('resolves components and delegates popup contents and position unchanged', () => {
        const rowIdentifier = { id: 15 };
        const columnLookup = { field: 'name' };
        const cellColumn = { field: 'status' };
        const contents = { trusted: 'popup-contents' };
        const functionContents = vi.fn();
        const position = 'bottom';
        const createComponent = () => ({ popup: vi.fn() });
        const row = createComponent();
        const column = createComponent();
        const cell = createComponent();
        const group = createComponent();
        const rowMethods = {
            getRow: vi.fn(() => row),
            getRowCell: vi.fn(() => cell)
        };
        const columnMethods = {
            getColumn: vi.fn(() => column)
        };
        const methods = createPopupMethods({ rowMethods, columnMethods });
        const cases = [
            {
                methodName: 'showRowPopup',
                args: [rowIdentifier],
                component: row,
                resolver: rowMethods.getRow,
                resolverArgs: [rowIdentifier],
                popupContents: contents
            },
            {
                methodName: 'showColumnPopup',
                args: [columnLookup],
                component: column,
                resolver: columnMethods.getColumn,
                resolverArgs: [columnLookup],
                popupContents: contents
            },
            {
                methodName: 'showCellPopup',
                args: [rowIdentifier, cellColumn],
                component: cell,
                resolver: rowMethods.getRowCell,
                resolverArgs: [rowIdentifier, cellColumn],
                popupContents: contents
            },
            {
                methodName: 'showGroupPopup',
                args: [group],
                component: group,
                resolver: null,
                resolverArgs: [],
                popupContents: functionContents
            }
        ];

        cases.forEach(({
            methodName,
            args,
            component,
            resolver,
            resolverArgs,
            popupContents
        }) => {
            expect(methods[methodName](...args, popupContents, position)).toBe(true);
            expect(component.popup).toHaveBeenCalledOnce();
            expect(component.popup).toHaveBeenCalledWith(popupContents, position);

            if (resolver) {
                expect(resolver).toHaveBeenCalledOnce();
                expect(resolver.mock.calls[0]).toEqual(resolverArgs);
                resolverArgs.forEach((value, index) => {
                    expect(resolver.mock.calls[0][index]).toBe(value);
                });
            }
        });

        expect(functionContents).not.toHaveBeenCalled();

        rowMethods.getRow.mockReturnValueOnce(false);
        columnMethods.getColumn.mockReturnValueOnce({});
        rowMethods.getRowCell.mockReturnValueOnce(false);

        [
            ['showRowPopup', [rowIdentifier, contents, position]],
            ['showColumnPopup', [columnLookup, contents, position]],
            ['showCellPopup', [rowIdentifier, cellColumn, contents, position]],
            ['showGroupPopup', [{}, contents, position]]
        ].forEach(([methodName, args]) => {
            expect(methods[methodName](...args)).toBe(false);
        });
    });
});

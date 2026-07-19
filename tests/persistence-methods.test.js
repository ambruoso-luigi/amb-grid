import { describe, expect, test, vi } from 'vitest';

import { createPersistenceMethods } from '../src/lib/table/controller/persistence-methods.js';

const forbiddenMethodNames = [
    'getColumnDefinitions',
    'getColumns',
    'getColumn',
    'setColumns',
    'addColumn',
    'deleteColumn',
    'updateColumnDefinition',
    'moveColumn',
    'showColumn',
    'hideColumn',
    'toggleColumn',
    'getData',
    'getRows',
    'setData',
    'replaceData',
    'updateData',
    'setFilter',
    'clearFilter',
    'setSort',
    'clearSort',
    'redraw',
    'recalc',
    'getSavePayload',
    'getStateReport',
    'validateRow',
    'validateAll',
    'updateRowFields',
    'findRowByKey',
    'addRow',
    'deleteRow',
    'rollbackRow'
];

const createForbiddenMethods = () => Object.fromEntries(
    forbiddenMethodNames.map(name => [name, vi.fn()])
);

const expectForbiddenMethodsNotCalled = target => {
    forbiddenMethodNames.forEach(name => {
        expect(target[name]).not.toHaveBeenCalled();
    });
};

const createColumnLayout = () => {
    const childLayout = {
        field: 'name',
        width: 180,
        visible: true
    };
    const groupLayout = {
        title: 'Identity',
        columns: [childLayout]
    };
    const actionLayout = {
        field: '_ambActions',
        width: 52,
        visible: true
    };
    const layout = [
        groupLayout,
        actionLayout
    ];

    return {
        actionLayout,
        childLayout,
        groupLayout,
        layout
    };
};

describe('AMB table controller persistence method group', () => {
    test('exposes exactly the flat persistence controller methods', () => {
        const methods = createPersistenceMethods({
            table: {}
        });

        expect(Object.keys(methods).sort()).toEqual([
            'getColumnLayout',
            'setColumnLayout'
        ]);
        expect(Object.values(methods).every(method => typeof method === 'function')).toBe(true);
    });

    test('returns the persistable column layout without cloning or completing definitions', () => {
        const {
            actionLayout,
            childLayout,
            groupLayout,
            layout
        } = createColumnLayout();
        const emptyLayout = [];
        const table = {
            ...createForbiddenMethods(),
            getColumnLayout: vi.fn()
                .mockReturnValueOnce(layout)
                .mockReturnValueOnce(emptyLayout),
            setColumnLayout: vi.fn()
        };
        const methods = createPersistenceMethods({ table });

        const returned = methods.getColumnLayout();

        expect(returned).toBe(layout);
        expect(returned[0]).toBe(groupLayout);
        expect(returned[0].columns).toBe(groupLayout.columns);
        expect(returned[0].columns[0]).toBe(childLayout);
        expect(returned[1]).toBe(actionLayout);
        expect(table.getColumnLayout).toHaveBeenCalledOnce();
        expect(table.getColumnLayout).toHaveBeenCalledWith();

        expect(methods.getColumnLayout()).toBe(emptyLayout);
        expect(table.getColumnLayout).toHaveBeenCalledTimes(2);
        expect(table.setColumnLayout).not.toHaveBeenCalled();
        expectForbiddenMethodsNotCalled(table);
    });

    test('applies the supplied column layout unchanged without manual column operations', () => {
        const {
            childLayout,
            groupLayout,
            layout
        } = createColumnLayout();
        const sentinelResult = { applied: true };
        const table = {
            ...createForbiddenMethods(),
            getColumnLayout: vi.fn(),
            setColumnLayout: vi.fn()
                .mockReturnValueOnce(true)
                .mockReturnValueOnce(sentinelResult)
        };
        const methods = createPersistenceMethods({ table });

        expect(methods.setColumnLayout(layout)).toBe(true);
        expect(table.setColumnLayout).toHaveBeenCalledOnce();
        expect(table.setColumnLayout).toHaveBeenLastCalledWith(layout);
        expect(table.setColumnLayout.mock.calls[0][0]).toBe(layout);
        expect(table.setColumnLayout.mock.calls[0][0][0]).toBe(groupLayout);
        expect(table.setColumnLayout.mock.calls[0][0][0].columns).toBe(groupLayout.columns);
        expect(table.setColumnLayout.mock.calls[0][0][0].columns[0]).toBe(childLayout);

        expect(methods.setColumnLayout(layout)).toBe(sentinelResult);
        expect(table.setColumnLayout).toHaveBeenCalledTimes(2);
        expect(table.setColumnLayout.mock.calls[1][0]).toBe(layout);
        expect(table.getColumnLayout).not.toHaveBeenCalled();
        expect(table.setColumns).not.toHaveBeenCalled();
        expect(table.moveColumn).not.toHaveBeenCalled();
        expect(table.showColumn).not.toHaveBeenCalled();
        expect(table.hideColumn).not.toHaveBeenCalled();
        expect(table.redraw).not.toHaveBeenCalled();
        expectForbiddenMethodsNotCalled(table);
    });
});

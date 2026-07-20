import { describe, expect, test, vi } from 'vitest';

import { createNavigationMethods } from '../src/lib/table/controller/navigation-methods.js';

const navigationMethodNames = [
    'navigatePrev',
    'navigateNext',
    'navigateLeft',
    'navigateRight',
    'navigateUp',
    'navigateDown'
];

const sortedNavigationMethodNames = [
    'navigateDown',
    'navigateLeft',
    'navigateNext',
    'navigatePrev',
    'navigateRight',
    'navigateUp'
];

const forbiddenTableMethodNames = [
    'getData',
    'getRows',
    'getColumns',
    'getEditedCells',
    'getInvalidCells',
    'setData',
    'replaceData',
    'updateData',
    'addData',
    'addRow',
    'setFilter',
    'clearFilter',
    'refreshFilter',
    'setSort',
    'clearSort',
    'setPage',
    'setPageSize',
    'selectRow',
    'deselectRow',
    'scrollToRow',
    'scrollToColumn',
    'redraw',
    'recalc',
    'validate',
    'focus',
    'blur',
    'edit',
    'cancelEdit',
    'querySelector',
    'getElement'
];

const forbiddenCrudMethodNames = [
    'updateRowFields',
    'validateRow',
    'validateAll',
    'rollbackRow',
    'getSavePayload',
    'getStateReport',
    'findRowByKey',
    'addRow',
    'deleteRow'
];

const createForbiddenMethods = methodNames => Object.fromEntries(
    methodNames.map(name => [name, vi.fn()])
);

const createTable = () => ({
    ...createForbiddenMethods(forbiddenTableMethodNames),
    navigatePrev: vi.fn(),
    navigateNext: vi.fn(),
    navigateLeft: vi.fn(),
    navigateRight: vi.fn(),
    navigateUp: vi.fn(),
    navigateDown: vi.fn()
});

const expectNavigationCalls = (table, activeName, count) => {
    navigationMethodNames.forEach(name => {
        if (name === activeName) {
            expect(table[name]).toHaveBeenCalledTimes(count);
            return;
        }

        expect(table[name]).not.toHaveBeenCalled();
    });
};

const expectForbiddenMethodsNotCalled = (target, methodNames) => {
    methodNames.forEach(name => {
        expect(target[name]).not.toHaveBeenCalled();
    });
};

describe('AMB table controller editable-cell navigation method group', () => {
    test('exposes exactly the flat navigation controller methods', () => {
        const methods = createNavigationMethods({
            table: createTable()
        });

        expect(Object.keys(methods).sort()).toEqual(sortedNavigationMethodNames);
        expect(Object.values(methods).every(method => typeof method === 'function')).toBe(true);
    });

    test.each(navigationMethodNames)('%s delegates once without arguments and preserves results', methodName => {
        const sentinelResult = { moved: true, methodName };
        const crud = createForbiddenMethods(forbiddenCrudMethodNames);
        const table = createTable();
        const methods = createNavigationMethods({ table });

        table[methodName]
            .mockReturnValueOnce(true)
            .mockReturnValueOnce(false)
            .mockReturnValueOnce(sentinelResult);

        expect(methods[methodName]()).toBe(true);
        expect(table[methodName]).toHaveBeenCalledOnce();
        expect(table[methodName]).toHaveBeenCalledWith();
        expectNavigationCalls(table, methodName, 1);
        expectForbiddenMethodsNotCalled(table, forbiddenTableMethodNames);
        expectForbiddenMethodsNotCalled(crud, forbiddenCrudMethodNames);

        expect(methods[methodName]()).toBe(false);
        expect(table[methodName]).toHaveBeenCalledTimes(2);
        expect(table[methodName].mock.calls[1]).toEqual([]);
        expectNavigationCalls(table, methodName, 2);
        expectForbiddenMethodsNotCalled(table, forbiddenTableMethodNames);
        expectForbiddenMethodsNotCalled(crud, forbiddenCrudMethodNames);

        expect(methods[methodName]()).toBe(sentinelResult);
        expect(table[methodName]).toHaveBeenCalledTimes(3);
        expect(table[methodName].mock.calls[2]).toEqual([]);
        expectNavigationCalls(table, methodName, 3);
        expectForbiddenMethodsNotCalled(table, forbiddenTableMethodNames);
        expectForbiddenMethodsNotCalled(crud, forbiddenCrudMethodNames);
    });
});

import { describe, expect, test, vi } from 'vitest';

import { createGroupingMethods } from '../src/lib/table/controller/grouping-methods.js';

const forbiddenMethodNames = [
    'getSavePayload',
    'getStateReport',
    'validateRow',
    'validateAll',
    'updateRowFields',
    'findRowByKey',
    'addRow',
    'deleteRow',
    'rollbackRow',
    'getFilters',
    'setFilter',
    'addFilter',
    'removeFilter',
    'clearFilter',
    'refreshFilter',
    'getSorters',
    'setSort',
    'clearSort',
    'getPage',
    'getPageMax',
    'setPage',
    'setPageSize',
    'getSelectedData',
    'getSelectedRows',
    'selectRow',
    'deselectRow',
    'recalc',
    'redraw'
];

const createForbiddenMethods = () => Object.fromEntries(
    forbiddenMethodNames.map(name => [name, vi.fn()])
);

const expectForbiddenMethodsNotCalled = target => {
    forbiddenMethodNames.forEach(name => {
        expect(target[name]).not.toHaveBeenCalled();
    });
};

describe('AMB table controller grouping method group', () => {
    test('exposes exactly the flat grouping controller methods', () => {
        const methods = createGroupingMethods({
            table: {}
        });

        expect(Object.keys(methods).sort()).toEqual([
            'getGroupElement',
            'getGroupField',
            'getGroupKey',
            'getGroupParent',
            'getGroupRows',
            'getGroupSubGroups',
            'getGroupedData',
            'getGroups',
            'hideGroup',
            'isGroupVisible',
            'scrollToGroup',
            'setGroupBy',
            'setGroupHeader',
            'setGroupStartOpen',
            'setGroupValues',
            'showGroup',
            'toggleGroup'
        ]);
        expect(Object.values(methods).every(method => typeof method === 'function')).toBe(true);
    });

    test('returns grouped data output without cloning, flattening or reading groups', () => {
        const groupHeader = {
            level: 0,
            rowCount: 2,
            headerContent: 'Sales (2)'
        };
        const firstRow = {
            id: 1,
            department: 'Sales'
        };
        const nestedHeader = {
            level: 1,
            rowCount: 1,
            headerContent: 'Support (1)'
        };
        const secondRow = {
            id: 2,
            department: 'Sales',
            team: 'Support'
        };
        const falsyRow = {
            id: 0,
            department: '',
            active: false,
            score: null
        };
        const groupedData = [
            groupHeader,
            firstRow,
            nestedHeader,
            secondRow,
            falsyRow
        ];
        const emptyGroupedData = [];
        const table = {
            ...createForbiddenMethods(),
            getGroupedData: vi.fn()
                .mockReturnValueOnce(groupedData)
                .mockReturnValueOnce(emptyGroupedData),
            getGroups: vi.fn(),
            getData: vi.fn(),
            setGroupBy: vi.fn(),
            setGroupValues: vi.fn(),
            setGroupStartOpen: vi.fn(),
            setGroupHeader: vi.fn()
        };
        const methods = createGroupingMethods({ table });

        const returned = methods.getGroupedData();

        expect(returned).toBe(groupedData);
        expect(returned[0]).toBe(groupHeader);
        expect(returned[1]).toBe(firstRow);
        expect(returned[2]).toBe(nestedHeader);
        expect(returned[3]).toBe(secondRow);
        expect(returned[4]).toBe(falsyRow);
        expect(returned[4].id).toBe(0);
        expect(returned[4].department).toBe('');
        expect(returned[4].active).toBe(false);
        expect(returned[4].score).toBeNull();
        expect(table.getGroupedData).toHaveBeenCalledOnce();
        expect(table.getGroupedData).toHaveBeenCalledWith();

        const returnedEmptyGroupedData = methods.getGroupedData();

        expect(returnedEmptyGroupedData).toBe(emptyGroupedData);
        expect(table.getGroupedData).toHaveBeenCalledTimes(2);
        expect(table.getGroups).not.toHaveBeenCalled();
        expect(table.getData).not.toHaveBeenCalled();
        expect(table.setGroupBy).not.toHaveBeenCalled();
        expect(table.setGroupValues).not.toHaveBeenCalled();
        expect(table.setGroupStartOpen).not.toHaveBeenCalled();
        expect(table.setGroupHeader).not.toHaveBeenCalled();
        expectForbiddenMethodsNotCalled(table);
    });

    test('returns top-level group components without cloning or traversing groups', () => {
        const subGroup = { key: 'Support' };
        const subGroups = [subGroup];
        const group = {
            getKey: vi.fn(() => 'Sales'),
            getRows: vi.fn(() => []),
            getSubGroups: vi.fn(() => subGroups)
        };
        const groups = [group];
        const emptyGroups = [];
        const table = {
            ...createForbiddenMethods(),
            getGroups: vi.fn()
                .mockReturnValueOnce(groups)
                .mockReturnValueOnce(emptyGroups),
            setGroupBy: vi.fn(),
            setGroupValues: vi.fn(),
            setGroupStartOpen: vi.fn(),
            setGroupHeader: vi.fn()
        };
        const methods = createGroupingMethods({ table });

        const returned = methods.getGroups();

        expect(returned).toBe(groups);
        expect(returned[0]).toBe(group);
        expect(table.getGroups).toHaveBeenCalledOnce();
        expect(table.getGroups).toHaveBeenCalledWith();
        expect(group.getKey).not.toHaveBeenCalled();
        expect(group.getRows).not.toHaveBeenCalled();
        expect(group.getSubGroups).not.toHaveBeenCalled();
        expect(returned[0].getSubGroups()).toBe(subGroups);
        expect(returned[0].getSubGroups()[0]).toBe(subGroup);

        const returnedEmptyGroups = methods.getGroups();

        expect(returnedEmptyGroups).toBe(emptyGroups);
        expect(table.getGroups).toHaveBeenCalledTimes(2);
        expect(table.setGroupBy).not.toHaveBeenCalled();
        expect(table.setGroupValues).not.toHaveBeenCalled();
        expect(table.setGroupStartOpen).not.toHaveBeenCalled();
        expect(table.setGroupHeader).not.toHaveBeenCalled();
        expectForbiddenMethodsNotCalled(table);
    });

    test('reads contextual group component state through one private resolver', () => {
        const key = '', field = 0, element = {}, rows = [], subGroups = [], parent = {};
        const cases = [
            ['getGroupKey', 'getKey', key],
            ['getGroupField', 'getField', field],
            ['getGroupElement', 'getElement', element],
            ['getGroupRows', 'getRows', rows],
            ['getGroupSubGroups', 'getSubGroups', subGroups],
            ['getGroupParent', 'getParentGroup', parent],
            ['isGroupVisible', 'isVisible', false]
        ];
        const methods = createGroupingMethods({ table: { getGroups: vi.fn() } });

        cases.forEach(([controllerMethod, componentMethod, result]) => {
            const group = { [componentMethod]: vi.fn(() => result) };

            expect(methods[controllerMethod](group)).toBe(result);
            expect(group[componentMethod]).toHaveBeenCalledOnce();
            expect(group[componentMethod]).toHaveBeenCalledWith();
            expect(methods[controllerMethod](false)).toBe(false);
            expect(methods[controllerMethod]({})).toBe(false);
        });
    });

    test('runs contextual group runtime actions without resolving groups', () => {
        const methods = createGroupingMethods({ table: { getGroups: vi.fn() } });
        const actionCases = [
            ['showGroup', 'show'],
            ['hideGroup', 'hide'],
            ['toggleGroup', 'toggle']
        ];

        actionCases.forEach(([controllerMethod, componentMethod]) => {
            const group = { [componentMethod]: vi.fn() };

            expect(methods[controllerMethod](group)).toBe(true);
            expect(group[componentMethod]).toHaveBeenCalledOnce();
            expect(group[componentMethod]).toHaveBeenCalledWith();
            expect(methods[controllerMethod](false)).toBe(false);
            expect(methods[controllerMethod]({})).toBe(false);
        });

        const position = { position: 'middle' }, ifVisible = { ifVisible: true }, scrollResult = Promise.resolve('done');
        const group = { scrollTo: vi.fn(() => scrollResult) };

        expect(methods.scrollToGroup(group, position, ifVisible)).toBe(scrollResult);
        expect(group.scrollTo).toHaveBeenCalledOnce();
        expect(group.scrollTo).toHaveBeenCalledWith(position, ifVisible);
        expect(methods.scrollToGroup(false, position, ifVisible)).toBe(false);
        expect(methods.scrollToGroup({}, position, ifVisible)).toBe(false);
    });

    test('changes group definitions by forwarding values unchanged', () => {
        const groupFunction = vi.fn(data => data.department);
        const teamFunction = vi.fn(data => data.team);
        const groupLevels = [
            'department',
            teamFunction
        ];
        const stringResult = { grouped: 'string' };
        const functionResult = { grouped: 'function' };
        const arrayResult = { grouped: 'array' };
        const falseResult = { grouped: false };
        const table = {
            ...createForbiddenMethods(),
            getGroups: vi.fn(),
            setGroupBy: vi.fn()
                .mockReturnValueOnce(stringResult)
                .mockReturnValueOnce(functionResult)
                .mockReturnValueOnce(arrayResult)
                .mockReturnValueOnce(falseResult),
            setGroupValues: vi.fn(),
            setGroupStartOpen: vi.fn(),
            setGroupHeader: vi.fn()
        };
        const methods = createGroupingMethods({ table });

        expect(methods.setGroupBy('department')).toBe(stringResult);
        expect(table.setGroupBy).toHaveBeenCalledOnce();
        expect(table.setGroupBy).toHaveBeenLastCalledWith('department');

        expect(methods.setGroupBy(groupFunction)).toBe(functionResult);
        expect(table.setGroupBy).toHaveBeenCalledTimes(2);
        expect(table.setGroupBy).toHaveBeenLastCalledWith(groupFunction);
        expect(table.setGroupBy.mock.calls[1][0]).toBe(groupFunction);

        expect(methods.setGroupBy(groupLevels)).toBe(arrayResult);
        expect(table.setGroupBy).toHaveBeenCalledTimes(3);
        expect(table.setGroupBy).toHaveBeenLastCalledWith(groupLevels);
        expect(table.setGroupBy.mock.calls[2][0]).toBe(groupLevels);
        expect(table.setGroupBy.mock.calls[2][0][1]).toBe(teamFunction);

        expect(methods.setGroupBy(false)).toBe(falseResult);
        expect(table.setGroupBy).toHaveBeenCalledTimes(4);
        expect(table.setGroupBy).toHaveBeenLastCalledWith(false);
        expect(table.getGroups).not.toHaveBeenCalled();
        expect(table.setGroupValues).not.toHaveBeenCalled();
        expect(table.setGroupStartOpen).not.toHaveBeenCalled();
        expect(table.setGroupHeader).not.toHaveBeenCalled();
        expectForbiddenMethodsNotCalled(table);
    });

    test('changes allowed group values without filtering data or touching CRUD state', () => {
        const firstLevelValues = [
            'Sales',
            'Support',
            0,
            '',
            false
        ];
        const thirdLevelValues = [
            true,
            null,
            'Administration'
        ];
        const groupValues = [
            firstLevelValues,
            false,
            thirdLevelValues
        ];
        const result = { valuesChanged: true };
        const table = {
            ...createForbiddenMethods(),
            getGroups: vi.fn(),
            setGroupBy: vi.fn(),
            setGroupValues: vi.fn(() => result),
            setGroupStartOpen: vi.fn(),
            setGroupHeader: vi.fn(),
            getData: vi.fn(),
            getRows: vi.fn()
        };
        const methods = createGroupingMethods({ table });

        expect(methods.setGroupValues(groupValues)).toBe(result);
        expect(table.setGroupValues).toHaveBeenCalledOnce();
        expect(table.setGroupValues).toHaveBeenCalledWith(groupValues);
        expect(table.setGroupValues.mock.calls[0][0]).toBe(groupValues);
        expect(table.setGroupValues.mock.calls[0][0][0]).toBe(firstLevelValues);
        expect(table.setGroupValues.mock.calls[0][0][1]).toBe(false);
        expect(table.setGroupValues.mock.calls[0][0][2]).toBe(thirdLevelValues);
        expect(table.getData).not.toHaveBeenCalled();
        expect(table.getRows).not.toHaveBeenCalled();
        expect(table.setGroupBy).not.toHaveBeenCalled();
        expect(table.getGroups).not.toHaveBeenCalled();
        expect(table.setGroupStartOpen).not.toHaveBeenCalled();
        expect(table.setGroupHeader).not.toHaveBeenCalled();
        expectForbiddenMethodsNotCalled(table);
    });

    test('changes group start-open behavior without iterating existing group components', () => {
        const callback = vi.fn((value, count) => count > 5);
        const openLevels = [true, false];
        const trueResult = { open: true };
        const falseResult = { open: false };
        const callbackResult = { open: 'callback' };
        const arrayResult = { open: 'array' };
        const table = {
            ...createForbiddenMethods(),
            getGroups: vi.fn(),
            setGroupBy: vi.fn(),
            setGroupValues: vi.fn(),
            setGroupStartOpen: vi.fn()
                .mockReturnValueOnce(trueResult)
                .mockReturnValueOnce(falseResult)
                .mockReturnValueOnce(callbackResult)
                .mockReturnValueOnce(arrayResult),
            setGroupHeader: vi.fn()
        };
        const methods = createGroupingMethods({ table });

        expect(methods.setGroupStartOpen(true)).toBe(trueResult);
        expect(table.setGroupStartOpen).toHaveBeenCalledOnce();
        expect(table.setGroupStartOpen).toHaveBeenLastCalledWith(true);

        expect(methods.setGroupStartOpen(false)).toBe(falseResult);
        expect(table.setGroupStartOpen).toHaveBeenCalledTimes(2);
        expect(table.setGroupStartOpen).toHaveBeenLastCalledWith(false);
        expect(table.setGroupStartOpen.mock.calls[1][0]).toBe(false);

        expect(methods.setGroupStartOpen(callback)).toBe(callbackResult);
        expect(table.setGroupStartOpen).toHaveBeenCalledTimes(3);
        expect(table.setGroupStartOpen.mock.calls[2][0]).toBe(callback);

        expect(methods.setGroupStartOpen(openLevels)).toBe(arrayResult);
        expect(table.setGroupStartOpen).toHaveBeenCalledTimes(4);
        expect(table.setGroupStartOpen.mock.calls[3][0]).toBe(openLevels);
        expect(table.setGroupStartOpen.mock.calls[3][0][1]).toBe(false);
        expect(callback).not.toHaveBeenCalled();
        expect(table.getGroups).not.toHaveBeenCalled();
        expect(table.setGroupBy).not.toHaveBeenCalled();
        expect(table.setGroupValues).not.toHaveBeenCalled();
        expect(table.setGroupHeader).not.toHaveBeenCalled();
        expectForbiddenMethodsNotCalled(table);
    });

    test('changes group header formatter without executing callbacks or manipulating DOM', () => {
        const groupHeader = vi.fn(value => `${value}`);
        const departmentHeader = vi.fn(value => `Department: ${value}`);
        const teamHeader = vi.fn(value => `Team: ${value}`);
        const groupHeaders = [
            departmentHeader,
            teamHeader
        ];
        const singleResult = { header: 'single' };
        const multiResult = { header: 'multi' };
        const originalDocument = globalThis.document;
        const documentMock = {
            createElement: vi.fn()
        };
        const table = {
            ...createForbiddenMethods(),
            getGroups: vi.fn(),
            setGroupBy: vi.fn(),
            setGroupValues: vi.fn(),
            setGroupStartOpen: vi.fn(),
            setGroupHeader: vi.fn()
                .mockReturnValueOnce(singleResult)
                .mockReturnValueOnce(multiResult)
        };
        const methods = createGroupingMethods({ table });

        globalThis.document = documentMock;

        try {
            expect(methods.setGroupHeader(groupHeader)).toBe(singleResult);
            expect(table.setGroupHeader).toHaveBeenCalledOnce();
            expect(table.setGroupHeader).toHaveBeenLastCalledWith(groupHeader);
            expect(table.setGroupHeader.mock.calls[0][0]).toBe(groupHeader);

            expect(methods.setGroupHeader(groupHeaders)).toBe(multiResult);
            expect(table.setGroupHeader).toHaveBeenCalledTimes(2);
            expect(table.setGroupHeader).toHaveBeenLastCalledWith(groupHeaders);
            expect(table.setGroupHeader.mock.calls[1][0]).toBe(groupHeaders);
            expect(table.setGroupHeader.mock.calls[1][0][0]).toBe(departmentHeader);
            expect(table.setGroupHeader.mock.calls[1][0][1]).toBe(teamHeader);
            expect(groupHeader).not.toHaveBeenCalled();
            expect(departmentHeader).not.toHaveBeenCalled();
            expect(teamHeader).not.toHaveBeenCalled();
            expect(documentMock.createElement).not.toHaveBeenCalled();
            expect(table.getGroups).not.toHaveBeenCalled();
            expect(table.setGroupBy).not.toHaveBeenCalled();
            expect(table.setGroupValues).not.toHaveBeenCalled();
            expect(table.setGroupStartOpen).not.toHaveBeenCalled();
            expectForbiddenMethodsNotCalled(table);
        } finally {
            globalThis.document = originalDocument;
        }
    });
});

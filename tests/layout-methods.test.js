import { describe, expect, test, vi } from 'vitest';

import { createLayoutMethods } from '../src/lib/table/controller/layout-methods.js';

const forbiddenMethodNames = [
    'getData',
    'getRows',
    'getColumns',
    'setData',
    'replaceData',
    'updateData',
    'setFilter',
    'clearFilter',
    'refreshFilter',
    'setSort',
    'clearSort',
    'setPage',
    'setPageSize',
    'selectRow',
    'deselectRow',
    'redraw',
    'blockRedraw',
    'restoreRedraw',
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

describe('AMB table controller layout method group', () => {
    test('exposes exactly the flat layout controller methods', () => {
        const methods = createLayoutMethods({
            table: {}
        });

        expect(Object.keys(methods).sort()).toEqual([
            'setHeight',
            'setMaxHeight',
            'setMinHeight'
        ]);
        expect(Object.values(methods).every(method => typeof method === 'function')).toBe(true);
    });

    test('changes height by forwarding all arguments unchanged', () => {
        const firstResult = { height: 500 };
        const stringResult = { height: '70vh' };
        const emptyResult = { height: '' };
        const table = {
            ...createForbiddenMethods(),
            setHeight: vi.fn()
                .mockReturnValueOnce(firstResult)
                .mockReturnValueOnce(stringResult)
                .mockReturnValueOnce(emptyResult)
                .mockReturnValueOnce(undefined),
            setMinHeight: vi.fn(),
            setMaxHeight: vi.fn(),
            getElement: vi.fn()
        };
        const originalDocument = globalThis.document;
        const documentMock = {
            createElement: vi.fn()
        };
        const methods = createLayoutMethods({ table });

        globalThis.document = documentMock;

        try {
            expect(methods.setHeight(500)).toBe(firstResult);
            expect(table.setHeight).toHaveBeenCalledOnce();
            expect(table.setHeight).toHaveBeenLastCalledWith(500);

            expect(methods.setHeight('70vh')).toBe(stringResult);
            expect(table.setHeight).toHaveBeenCalledTimes(2);
            expect(table.setHeight).toHaveBeenLastCalledWith('70vh');

            expect(methods.setHeight('')).toBe(emptyResult);
            expect(table.setHeight).toHaveBeenCalledTimes(3);
            expect(table.setHeight).toHaveBeenLastCalledWith('');
            expect(table.setHeight.mock.calls[2][0]).toBe('');

            expect(methods.setHeight(0)).toBeUndefined();
            expect(table.setHeight).toHaveBeenCalledTimes(4);
            expect(table.setHeight).toHaveBeenLastCalledWith(0);
            expect(table.setHeight.mock.calls[3][0]).toBe(0);
            expect(table.setMinHeight).not.toHaveBeenCalled();
            expect(table.setMaxHeight).not.toHaveBeenCalled();
            expect(table.getElement).not.toHaveBeenCalled();
            expect(documentMock.createElement).not.toHaveBeenCalled();
            expectForbiddenMethodsNotCalled(table);
        } finally {
            globalThis.document = originalDocument;
        }
    });

    test('changes minimum height without reading current height or touching other layout methods', () => {
        const objectValue = { value: 0 };
        const numberResult = { minHeight: 250 };
        const stringResult = { minHeight: '20rem' };
        const falsyResult = { minHeight: 0 };
        const objectResult = { minHeight: objectValue };
        const table = {
            ...createForbiddenMethods(),
            setHeight: vi.fn(),
            setMinHeight: vi.fn()
                .mockReturnValueOnce(numberResult)
                .mockReturnValueOnce(stringResult)
                .mockReturnValueOnce(falsyResult)
                .mockReturnValueOnce(objectResult),
            setMaxHeight: vi.fn(),
            getHeight: vi.fn(),
            getElement: vi.fn()
        };
        const methods = createLayoutMethods({ table });

        expect(methods.setMinHeight(250)).toBe(numberResult);
        expect(table.setMinHeight).toHaveBeenCalledOnce();
        expect(table.setMinHeight).toHaveBeenLastCalledWith(250);

        expect(methods.setMinHeight('20rem')).toBe(stringResult);
        expect(table.setMinHeight).toHaveBeenCalledTimes(2);
        expect(table.setMinHeight).toHaveBeenLastCalledWith('20rem');

        expect(methods.setMinHeight(0)).toBe(falsyResult);
        expect(table.setMinHeight).toHaveBeenCalledTimes(3);
        expect(table.setMinHeight).toHaveBeenLastCalledWith(0);
        expect(table.setMinHeight.mock.calls[2][0]).toBe(0);

        expect(methods.setMinHeight(objectValue)).toBe(objectResult);
        expect(table.setMinHeight).toHaveBeenCalledTimes(4);
        expect(table.setMinHeight.mock.calls[3][0]).toBe(objectValue);
        expect(table.getHeight).not.toHaveBeenCalled();
        expect(table.getElement).not.toHaveBeenCalled();
        expect(table.setHeight).not.toHaveBeenCalled();
        expect(table.setMaxHeight).not.toHaveBeenCalled();
        expectForbiddenMethodsNotCalled(table);
    });

    test('changes maximum height without changing pagination or other layout values', () => {
        const numberResult = { maxHeight: 700 };
        const stringResult = { maxHeight: '80vh' };
        const table = {
            ...createForbiddenMethods(),
            setHeight: vi.fn(),
            setMinHeight: vi.fn(),
            setMaxHeight: vi.fn()
                .mockReturnValueOnce(numberResult)
                .mockReturnValueOnce(stringResult),
            getMinHeight: vi.fn(),
            getElement: vi.fn()
        };
        const methods = createLayoutMethods({ table });

        expect(methods.setMaxHeight(700)).toBe(numberResult);
        expect(table.setMaxHeight).toHaveBeenCalledOnce();
        expect(table.setMaxHeight).toHaveBeenLastCalledWith(700);

        expect(methods.setMaxHeight('80vh')).toBe(stringResult);
        expect(table.setMaxHeight).toHaveBeenCalledTimes(2);
        expect(table.setMaxHeight).toHaveBeenLastCalledWith('80vh');
        expect(table.getMinHeight).not.toHaveBeenCalled();
        expect(table.getElement).not.toHaveBeenCalled();
        expect(table.setHeight).not.toHaveBeenCalled();
        expect(table.setMinHeight).not.toHaveBeenCalled();
        expect(table.setPage).not.toHaveBeenCalled();
        expect(table.setPageSize).not.toHaveBeenCalled();
        expectForbiddenMethodsNotCalled(table);
    });
});

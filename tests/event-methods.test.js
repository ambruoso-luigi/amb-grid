import { describe, expect, test, vi } from 'vitest';

import { createEventMethods } from '../src/lib/table/controller/event-methods.js';

const forbiddenMethodNames = [
    'getData',
    'setData',
    'getRows',
    'setFilter',
    'clearFilter',
    'setSort',
    'clearSort',
    'selectRow',
    'deselectRow',
    'CrudHelper'
];

const createForbiddenMethods = () => Object.fromEntries(
    forbiddenMethodNames.map(name => [name, vi.fn()])
);

const expectForbiddenMethodsNotCalled = target => {
    forbiddenMethodNames.forEach(name => {
        expect(target[name]).not.toHaveBeenCalled();
    });
};

const createTable = () => {
    const listeners = new Map();
    const addListener = (eventName, callback) => {
        const eventListeners = listeners.get(eventName) || [];

        eventListeners.push(callback);
        listeners.set(eventName, eventListeners);
    };
    const removeListener = (eventName, callback) => {
        if (callback === undefined) {
            listeners.delete(eventName);
            return;
        }

        const eventListeners = listeners.get(eventName);

        if (!eventListeners) return;

        const index = eventListeners.indexOf(callback);

        if (index === -1) return;

        eventListeners.splice(index, 1);

        if (eventListeners.length === 0) {
            listeners.delete(eventName);
        }
    };

    return {
        ...createForbiddenMethods(),
        listeners,
        addTechnicalListener: addListener,
        emit(eventName, ...args) {
            (listeners.get(eventName) || []).slice().forEach(listener => {
                listener(...args);
            });
        },
        on: vi.fn((eventName, callback) => {
            addListener(eventName, callback);
        }),
        off: vi.fn((eventName, callback) => {
            removeListener(eventName, callback);
        })
    };
};

describe('AMB table controller event method group', () => {
    test('exposes exactly the flat event controller methods', () => {
        const methods = createEventMethods({
            table: {}
        });

        expect(Object.keys(methods).sort()).toEqual([
            'off',
            'on'
        ]);
        expect(Object.values(methods).every(method => typeof method === 'function')).toBe(true);
    });

    test('subscribes application callbacks unchanged after engine registration succeeds', () => {
        const table = createTable();
        const methods = createEventMethods({ table });
        const firstCallback = vi.fn();
        const secondCallback = vi.fn();
        const otherEventCallback = vi.fn();

        expect(methods.on('dataLoaded', firstCallback)).toBeUndefined();
        expect(table.on).toHaveBeenCalledOnce();
        expect(table.on).toHaveBeenCalledWith('dataLoaded', firstCallback);
        expect(table.listeners.get('dataLoaded')).toEqual([firstCallback]);

        expect(methods.on('dataLoaded', firstCallback)).toBeUndefined();
        expect(table.on).toHaveBeenCalledTimes(2);
        expect(table.listeners.get('dataLoaded')).toEqual([
            firstCallback,
            firstCallback
        ]);

        expect(methods.on('dataLoaded', secondCallback)).toBeUndefined();
        expect(methods.on('rowAdded', otherEventCallback)).toBeUndefined();
        expect(table.listeners.get('dataLoaded')).toEqual([
            firstCallback,
            firstCallback,
            secondCallback
        ]);
        expect(table.listeners.get('rowAdded')).toEqual([otherEventCallback]);

        table.emit('dataLoaded', { rows: 2 }, 'runtime-context');
        expect(firstCallback).toHaveBeenCalledTimes(2);
        expect(firstCallback).toHaveBeenCalledWith({ rows: 2 }, 'runtime-context');
        expect(secondCallback).toHaveBeenCalledOnce();
        expect(secondCallback).toHaveBeenCalledWith({ rows: 2 }, 'runtime-context');
        expect(otherEventCallback).not.toHaveBeenCalled();
        expectForbiddenMethodsNotCalled(table);
    });

    test('does not track callbacks when the underlying subscription fails', () => {
        const table = createTable();
        const methods = createEventMethods({ table });
        const callback = vi.fn();
        const error = new Error('subscribe failed');

        table.on.mockImplementationOnce(() => {
            throw error;
        });

        expect(() => methods.on('dataLoaded', callback)).toThrow(error);
        expect(table.on).toHaveBeenCalledOnce();
        expect(table.listeners.get('dataLoaded')).toBeUndefined();

        methods.off('dataLoaded', callback);

        expect(table.off).not.toHaveBeenCalled();
        expectForbiddenMethodsNotCalled(table);
    });

    test('removes one registered callback by identity and preserves duplicates', () => {
        const table = createTable();
        const methods = createEventMethods({ table });
        const callback = vi.fn();
        const duplicateCallback = vi.fn();
        const directCallback = vi.fn();
        const unknownCallback = vi.fn();

        methods.on('dataLoaded', callback);
        methods.on('dataLoaded', duplicateCallback);
        methods.on('dataLoaded', duplicateCallback);
        table.on('dataLoaded', directCallback);
        table.on.mockClear();

        expect(methods.off('dataLoaded', unknownCallback)).toBeUndefined();
        expect(table.off).not.toHaveBeenCalled();
        expect(table.listeners.get('dataLoaded')).toEqual([
            callback,
            duplicateCallback,
            duplicateCallback,
            directCallback
        ]);

        expect(methods.off('dataLoaded', duplicateCallback)).toBeUndefined();
        expect(table.off).toHaveBeenCalledOnce();
        expect(table.off).toHaveBeenCalledWith('dataLoaded', duplicateCallback);
        expect(table.listeners.get('dataLoaded')).toEqual([
            callback,
            duplicateCallback,
            directCallback
        ]);

        methods.off('dataLoaded', duplicateCallback);
        expect(table.off).toHaveBeenCalledTimes(2);
        expect(table.off).toHaveBeenLastCalledWith('dataLoaded', duplicateCallback);
        expect(table.listeners.get('dataLoaded')).toEqual([
            callback,
            directCallback
        ]);

        methods.off('dataLoaded', duplicateCallback);
        expect(table.off).toHaveBeenCalledTimes(2);
        expect(table.listeners.get('dataLoaded')).toEqual([
            callback,
            directCallback
        ]);
        expectForbiddenMethodsNotCalled(table);
    });

    test('removes only tracked application listeners when callback is omitted', () => {
        const table = createTable();
        const methods = createEventMethods({ table });
        const firstCallback = vi.fn();
        const secondCallback = vi.fn();
        const otherEventCallback = vi.fn();
        const technicalCallback = vi.fn();
        const directCallback = vi.fn();

        table.addTechnicalListener('dataLoaded', technicalCallback);
        methods.on('dataLoaded', firstCallback);
        methods.on('dataLoaded', firstCallback);
        methods.on('dataLoaded', secondCallback);
        methods.on('rowAdded', otherEventCallback);
        table.on('dataLoaded', directCallback);
        table.on.mockClear();
        table.off.mockClear();

        expect(methods.off('dataLoaded')).toBeUndefined();

        expect(table.off).toHaveBeenCalledTimes(3);
        expect(table.off).toHaveBeenNthCalledWith(1, 'dataLoaded', firstCallback);
        expect(table.off).toHaveBeenNthCalledWith(2, 'dataLoaded', firstCallback);
        expect(table.off).toHaveBeenNthCalledWith(3, 'dataLoaded', secondCallback);
        table.off.mock.calls.forEach(call => {
            expect(call).toHaveLength(2);
        });
        expect(table.listeners.get('dataLoaded')).toEqual([
            technicalCallback,
            directCallback
        ]);
        expect(table.listeners.get('rowAdded')).toEqual([otherEventCallback]);

        methods.off('dataLoaded');
        methods.off('unknownEvent');
        expect(table.off).toHaveBeenCalledTimes(3);
        expectForbiddenMethodsNotCalled(table);
    });

    test('treats a non-function second argument as an event-level application cleanup', () => {
        const table = createTable();
        const methods = createEventMethods({ table });
        const callback = vi.fn();

        methods.on('dataLoaded', callback);
        table.off.mockClear();

        expect(methods.off('dataLoaded', 'not-a-callback')).toBeUndefined();

        expect(table.off).toHaveBeenCalledOnce();
        expect(table.off).toHaveBeenCalledWith('dataLoaded', callback);
        expect(table.off.mock.calls[0]).toHaveLength(2);
        expectForbiddenMethodsNotCalled(table);
    });
});

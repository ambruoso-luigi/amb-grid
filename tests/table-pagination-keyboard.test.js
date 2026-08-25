import { describe, expect, test, vi } from 'vitest';
import { createPaginationKeyboardRuntime } from '../src/lib/table/pagination-keyboard-runtime.js';

const createTableElement = () => {
    const listeners = new Map();
    const previous = {
        title: '',
        setAttribute: vi.fn()
    };
    const next = {
        title: '',
        setAttribute: vi.fn()
    };

    return {
        previous,
        next,
        addEventListener: (type, listener) => listeners.set(type, listener),
        removeEventListener: vi.fn((type, listener) => {
            if (listeners.get(type) === listener) listeners.delete(type);
        }),
        contains: target => target?.inside === true,
        querySelector: selector => selector.includes('prev') ? previous : next,
        dispatch(event) {
            listeners.get('keydown')?.({
                preventDefault: vi.fn(),
                stopPropagation: vi.fn(),
                ...event
            });
        },
        listener: () => listeners.get('keydown')
    };
};

describe('table pagination keyboard runtime', () => {
    test('uses public pagination methods for Alt+PageUp and Alt+PageDown', () => {
        const tableElement = createTableElement();
        const table = { on: vi.fn(), off: vi.fn() };
        const paginationMethods = {
            previousPage: vi.fn(),
            nextPage: vi.fn()
        };
        const runtime = createPaginationKeyboardRuntime({
            table,
            tableElement,
            paginationMethods,
            enabled: true
        });
        const inside = { inside: true };
        const pageDown = {
            key: 'PageDown',
            altKey: true,
            target: inside,
            preventDefault: vi.fn(),
            stopPropagation: vi.fn()
        };
        const pageUp = {
            key: 'PageUp',
            altKey: true,
            target: inside,
            preventDefault: vi.fn(),
            stopPropagation: vi.fn()
        };

        tableElement.listener()(pageDown);
        tableElement.listener()(pageUp);

        expect(pageDown.preventDefault).toHaveBeenCalledOnce();
        expect(pageDown.stopPropagation).toHaveBeenCalledOnce();
        expect(paginationMethods.nextPage).toHaveBeenCalledOnce();
        expect(paginationMethods.previousPage).toHaveBeenCalledOnce();

        runtime.destroy();
        expect(tableElement.removeEventListener).toHaveBeenCalledOnce();
        expect(table.off).toHaveBeenCalledWith('renderComplete', expect.any(Function));
    });

    test('ignores unrelated keys and targets outside the grid', () => {
        const tableElement = createTableElement();
        const paginationMethods = {
            previousPage: vi.fn(),
            nextPage: vi.fn()
        };
        createPaginationKeyboardRuntime({
            table: { on: vi.fn(), off: vi.fn() },
            tableElement,
            paginationMethods,
            enabled: true
        });

        const event = {
            key: 'PageDown',
            altKey: true,
            target: { inside: false },
            preventDefault: vi.fn(),
            stopPropagation: vi.fn()
        };
        tableElement.listener()(event);
        tableElement.listener()({
            key: 'PageDown',
            ctrlKey: true,
            target: { inside: true },
            preventDefault: vi.fn(),
            stopPropagation: vi.fn()
        });

        expect(paginationMethods.nextPage).not.toHaveBeenCalled();
        expect(event.preventDefault).not.toHaveBeenCalled();
    });

    test('does not install a listener when pagination is disabled', () => {
        const tableElement = createTableElement();

        createPaginationKeyboardRuntime({
            table: { on: vi.fn(), off: vi.fn() },
            tableElement,
            paginationMethods: {
                previousPage: vi.fn(),
                nextPage: vi.fn()
            },
            enabled: false
        });

        expect(tableElement.listener()).toBeUndefined();
    });

    test('decorates the table pager controls', () => {
        const tableElement = createTableElement();

        createPaginationKeyboardRuntime({
            table: { on: vi.fn(), off: vi.fn() },
            tableElement,
            paginationMethods: {
                previousPage: vi.fn(),
                nextPage: vi.fn()
            },
            enabled: true
        });

        expect(tableElement.previous.title).toBe('Previous page (Alt+PageUp)');
        expect(tableElement.next.title).toBe('Next page (Alt+PageDown)');
        expect(tableElement.previous.setAttribute).toHaveBeenCalledWith('aria-keyshortcuts', 'Alt+PageUp');
        expect(tableElement.next.setAttribute).toHaveBeenCalledWith('aria-keyshortcuts', 'Alt+PageDown');
    });
});

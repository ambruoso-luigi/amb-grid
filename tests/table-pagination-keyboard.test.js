import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
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

const createCandidate = ({ editable = true, interactive = false, edit = vi.fn() } = {}) => {
    const definition = {
        editable,
        editor: edit,
        _ambInteractive: interactive
    };

    const focusListeners = new Map();
    const element = {
        addEventListener: (type, listener) => focusListeners.set(type, listener),
        removeEventListener: (type, listener) => {
            if (focusListeners.get(type) === listener) focusListeners.delete(type);
        },
        focus: () => {
            const event = { stopImmediatePropagation: vi.fn() };
            focusListeners.get('focus')?.(event);
            globalThis.document.activeElement = element;
            if (!event.stopImmediatePropagation.mock.calls.length) edit();
        }
    };

    return {
        getColumn: () => ({
            isVisible: () => true,
            getDefinition: () => definition
        }),
        edit,
        getElement: () => element
    };
};

const flushPageChange = () => new Promise(resolve => setTimeout(resolve, 0));

describe('table pagination keyboard runtime', () => {
    beforeEach(() => {
        globalThis.document = { activeElement: null };
    });

    afterEach(() => {
        delete globalThis.document;
    });

    test('uses public pagination methods for Alt+PageUp and Alt+PageDown', async () => {
        const tableElement = createTableElement();
        let page = 1;
        const firstEditable = createCandidate();
        const table = {
            on: vi.fn(),
            off: vi.fn(),
            getRows: vi.fn(() => [{ getCells: () => [firstEditable] }])
        };
        const paginationMethods = {
            previousPage: vi.fn(() => {
                page = 1;
                return Promise.resolve();
            }),
            nextPage: vi.fn(() => {
                page = 2;
                return Promise.resolve();
            }),
            getPage: vi.fn(() => page)
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
        await Promise.resolve();
        await flushPageChange();
        tableElement.listener()(pageUp);
        await flushPageChange();
        await flushPageChange();

        expect(pageDown.preventDefault).toHaveBeenCalledOnce();
        expect(pageDown.stopPropagation).toHaveBeenCalledOnce();
        expect(paginationMethods.nextPage).toHaveBeenCalledOnce();
        expect(paginationMethods.previousPage).toHaveBeenCalledOnce();
        expect(firstEditable.edit).not.toHaveBeenCalled();
        expect(firstEditable.getElement()).toBe(globalThis.document.activeElement);

        runtime.destroy();
        expect(tableElement.removeEventListener).toHaveBeenCalledOnce();
        expect(table.off).toHaveBeenCalledWith('renderComplete', expect.any(Function));
    });

    test('ignores unrelated keys and targets outside the grid', () => {
        const tableElement = createTableElement();
        const paginationMethods = {
            previousPage: vi.fn(),
            nextPage: vi.fn(),
            getPage: vi.fn(() => 1)
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

    test('skips readonly cells and rows until it finds the first editable candidate', async () => {
        const tableElement = createTableElement();
        const readonly = createCandidate({ editable: false });
        const editable = createCandidate();
        const secondRowEditable = createCandidate();
        let page = 1;
        const table = {
            on: vi.fn(),
            off: vi.fn(),
            getRows: vi.fn(() => [
                { getCells: () => [readonly, editable] },
                { getCells: () => [secondRowEditable] }
            ])
        };
        const paginationMethods = {
            previousPage: vi.fn(),
            nextPage: vi.fn(() => {
                page = 2;
                return Promise.resolve();
            }),
            getPage: vi.fn(() => page)
        };
        const runtime = createPaginationKeyboardRuntime({
            table,
            tableElement,
            paginationMethods,
            enabled: true
        });

        const event = {
            key: 'PageDown',
            altKey: true,
            target: { inside: true },
            preventDefault: vi.fn(),
            stopPropagation: vi.fn()
        };
        tableElement.listener()(event);
        await flushPageChange();
        await Promise.resolve();

        expect(readonly.edit).not.toHaveBeenCalled();
        expect(editable.edit).not.toHaveBeenCalled();
        expect(editable.getElement()).toBe(globalThis.document.activeElement);
        expect(secondRowEditable.edit).not.toHaveBeenCalled();
        runtime.destroy();
    });

    test('uses the normal interactive AMB candidate handling', async () => {
        const tableElement = createTableElement();
        const interactive = createCandidate({ interactive: true });
        let page = 1;
        const table = {
            on: vi.fn(),
            off: vi.fn(),
            getRows: () => [{ getCells: () => [interactive] }]
        };
        const paginationMethods = {
            previousPage: vi.fn(),
            nextPage: vi.fn(() => {
                page = 2;
                return Promise.resolve();
            }),
            getPage: () => page
        };
        createPaginationKeyboardRuntime({ table, tableElement, paginationMethods, enabled: true });

        tableElement.listener()({
            key: 'PageDown',
            altKey: true,
            target: { inside: true },
            preventDefault: vi.fn(),
            stopPropagation: vi.fn()
        });
        await Promise.resolve();
        await Promise.resolve();

        expect(interactive.edit).not.toHaveBeenCalled();
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

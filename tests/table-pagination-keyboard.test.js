import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { createPaginationKeyboardRuntime } from '../src/lib/table/pagination-keyboard-runtime.js';

const createTableElement = () => {
    const listeners = new Map();
    const previous = { title: '', setAttribute: vi.fn() };
    const next = { title: '', setAttribute: vi.fn() };
    const editing = { present: false, className: 'tabulator-editing' };

    return {
        previous, next, editing,
        addEventListener: (type, listener, capture) => listeners.set(`${type}:${capture}`, listener),
        removeEventListener: vi.fn((type, listener, capture) => {
            if (listeners.get(`${type}:${capture}`) === listener) listeners.delete(`${type}:${capture}`);
        }),
        contains: target => target?.inside === true || target?.cell === true,
        querySelector: selector => selector === '.tabulator-editing'
            ? (editing.present ? editing : null)
            : selector.includes('prev') ? previous : next,
        dispatch(event) {
            listeners.get('keydown:true')?.({
                preventDefault: vi.fn(), stopPropagation: vi.fn(), stopImmediatePropagation: vi.fn(), ...event
            });
        },
        listener: () => listeners.get('keydown:true')
    };
};

const createCandidate = ({ editable = true, interactive = false, edit = vi.fn() } = {}) => {
    const definition = { editable, editor: edit, _ambInteractive: interactive };
    const element = { cell: true, focus: vi.fn(() => { globalThis.document.activeElement = element; }) };
    return {
        getColumn: () => ({ isVisible: () => true, getDefinition: () => definition }),
        edit, getElement: () => element
    };
};

const createTable = ({ page = 1, max = 3, rows = [], onPageLoaded = true } = {}) => {
    let currentPage = page;
    let listener;
    const table = {
        on: vi.fn((event, callback) => { if (event === 'pageLoaded') listener = callback; }),
        off: vi.fn((event, callback) => { if (event === 'pageLoaded' && listener === callback) listener = null; }),
        getRows: vi.fn(() => rows), loadPage: () => listener?.()
    };
    const paginationMethods = {
        previousPage: vi.fn(() => { currentPage -= 1; if (onPageLoaded) table.loadPage(); return Promise.resolve(); }),
        nextPage: vi.fn(() => { currentPage += 1; if (onPageLoaded) table.loadPage(); return Promise.resolve(); }),
        getPage: vi.fn(() => currentPage), getPageMax: vi.fn(() => max)
    };
    return { table, paginationMethods };
};

const shortcut = (tableElement, key = 'PageDown') => tableElement.dispatch({
    key, altKey: true, target: { inside: true }
});

describe('table pagination keyboard runtime', () => {
    beforeEach(() => { globalThis.document = { activeElement: null }; });
    afterEach(() => { delete globalThis.document; });

    test('uses capture phase and opens the first real editor after pageLoaded', async () => {
        const tableElement = createTableElement();
        const firstEditable = createCandidate();
        const { table, paginationMethods } = createTable({ rows: [{ getCells: () => [firstEditable] }] });
        const runtime = createPaginationKeyboardRuntime({ table, tableElement, paginationMethods, enabled: true });
        shortcut(tableElement);
        await Promise.resolve();
        expect(tableElement.listener()).toBeDefined();
        expect(paginationMethods.nextPage).toHaveBeenCalledOnce();
        expect(firstEditable.edit).toHaveBeenCalledOnce();
        runtime.destroy();
        expect(tableElement.removeEventListener).toHaveBeenCalledWith('keydown', expect.any(Function), true);
    });

    test('ignores unrelated keys and targets outside the grid', () => {
        const tableElement = createTableElement();
        const { paginationMethods } = createTable();
        createPaginationKeyboardRuntime({ table: { on: vi.fn(), off: vi.fn() }, tableElement, paginationMethods, enabled: true });
        const outside = { key: 'PageDown', altKey: true, target: { inside: false }, preventDefault: vi.fn() };
        tableElement.dispatch(outside);
        tableElement.dispatch({ key: 'PageDown', ctrlKey: true, target: { inside: true } });
        expect(paginationMethods.nextPage).not.toHaveBeenCalled();
        expect(outside.preventDefault).not.toHaveBeenCalled();
    });

    test('skips readonly cells and opens the first editable candidate', async () => {
        const tableElement = createTableElement();
        const readonly = createCandidate({ editable: false });
        const editable = createCandidate();
        const second = createCandidate();
        const { table, paginationMethods } = createTable({ rows: [{ getCells: () => [readonly, editable] }, { getCells: () => [second] }] });
        createPaginationKeyboardRuntime({ table, tableElement, paginationMethods, enabled: true });
        shortcut(tableElement);
        await Promise.resolve();
        expect(readonly.edit).not.toHaveBeenCalled();
        expect(editable.edit).toHaveBeenCalledOnce();
        expect(second.edit).not.toHaveBeenCalled();
    });

    test('uses normal interactive AMB candidate handling', async () => {
        const tableElement = createTableElement();
        const interactive = createCandidate({ interactive: true });
        const { table, paginationMethods } = createTable({ rows: [{ getCells: () => [interactive] }] });
        createPaginationKeyboardRuntime({ table, tableElement, paginationMethods, enabled: true });
        shortcut(tableElement);
        await Promise.resolve();
        expect(interactive.edit).toHaveBeenCalledOnce();
    });

    test('blurs the active editor before changing page', async () => {
        const tableElement = createTableElement();
        const order = [];
        const activeElement = { cell: true, blur: vi.fn(() => { order.push('blur'); tableElement.editing.present = false; }) };
        globalThis.document.activeElement = activeElement;
        tableElement.editing.present = true;
        const { table, paginationMethods } = createTable({ rows: [] });
        paginationMethods.nextPage.mockImplementationOnce(() => { order.push('nextPage'); table.loadPage(); return Promise.resolve(); });
        createPaginationKeyboardRuntime({ table, tableElement, paginationMethods, enabled: true });
        shortcut(tableElement);
        await Promise.resolve();
        expect(order).toEqual(['blur', 'nextPage']);
    });

    test('does not paginate when the editor remains active after blur', () => {
        const tableElement = createTableElement();
        const activeElement = { cell: true, blur: vi.fn() };
        globalThis.document.activeElement = activeElement;
        tableElement.editing.present = true;
        const { table, paginationMethods } = createTable({ rows: [] });
        createPaginationKeyboardRuntime({ table, tableElement, paginationMethods, enabled: true });
        shortcut(tableElement);
        expect(activeElement.blur).toHaveBeenCalledOnce();
        expect(paginationMethods.nextPage).not.toHaveBeenCalled();
    });

    test('does not blur or paginate at either boundary', () => {
        const tableElement = createTableElement();
        const activeElement = { cell: true, blur: vi.fn() };
        globalThis.document.activeElement = activeElement;
        const { table, paginationMethods } = createTable({ page: 1, max: 1 });
        createPaginationKeyboardRuntime({ table, tableElement, paginationMethods, enabled: true });
        shortcut(tableElement, 'PageUp');
        shortcut(tableElement, 'PageDown');
        expect(activeElement.blur).not.toHaveBeenCalled();
        expect(paginationMethods.previousPage).not.toHaveBeenCalled();
        expect(paginationMethods.nextPage).not.toHaveBeenCalled();
    });

    test('blocks a repeated shortcut while page loading is pending', () => {
        const tableElement = createTableElement();
        const { table, paginationMethods } = createTable({ onPageLoaded: false });
        createPaginationKeyboardRuntime({ table, tableElement, paginationMethods, enabled: true });
        shortcut(tableElement);
        shortcut(tableElement);
        expect(paginationMethods.nextPage).toHaveBeenCalledOnce();
    });

    test('releases the transition lock after the last page and allows reverse navigation', async () => {
        const tableElement = createTableElement();
        const candidate = createCandidate();
        const { table, paginationMethods } = createTable({ page: 10, max: 11, rows: [{ getCells: () => [candidate] }] });
        createPaginationKeyboardRuntime({ table, tableElement, paginationMethods, enabled: true });

        shortcut(tableElement);
        await Promise.resolve();
        shortcut(tableElement, 'PageUp');
        await Promise.resolve();

        expect(paginationMethods.nextPage).toHaveBeenCalledOnce();
        expect(paginationMethods.previousPage).toHaveBeenCalledOnce();
        expect(candidate.edit).toHaveBeenCalledTimes(2);
    });

    test('allows reverse navigation after a boundary no-op at the last page', async () => {
        const tableElement = createTableElement();
        const activeElement = { cell: true, blur: vi.fn() };
        globalThis.document.activeElement = activeElement;
        const { table, paginationMethods } = createTable({ page: 11, max: 11, rows: [] });
        createPaginationKeyboardRuntime({ table, tableElement, paginationMethods, enabled: true });

        shortcut(tableElement);
        shortcut(tableElement, 'PageUp');
        await Promise.resolve();

        expect(activeElement.blur).not.toHaveBeenCalled();
        expect(paginationMethods.nextPage).not.toHaveBeenCalled();
        expect(paginationMethods.previousPage).toHaveBeenCalledOnce();
    });

    test('uses the Promise fallback when pageLoaded is missing', async () => {
        const tableElement = createTableElement();
        const candidate = createCandidate();
        const { table, paginationMethods } = createTable({ page: 10, max: 11, rows: [{ getCells: () => [candidate] }], onPageLoaded: false });
        createPaginationKeyboardRuntime({ table, tableElement, paginationMethods, enabled: true });

        shortcut(tableElement);
        await Promise.resolve();
        shortcut(tableElement, 'PageUp');
        await Promise.resolve();

        expect(candidate.edit).toHaveBeenCalledTimes(2);
        expect(paginationMethods.previousPage).toHaveBeenCalledOnce();
    });

    test('releases the transition lock when activation throws', async () => {
        const tableElement = createTableElement();
        const edit = vi.fn()
            .mockImplementationOnce(() => { throw new Error('activation failed'); })
            .mockImplementation(() => true);
        const candidate = createCandidate({ edit });
        const { table, paginationMethods } = createTable({ rows: [{ getCells: () => [candidate] }] });
        createPaginationKeyboardRuntime({ table, tableElement, paginationMethods, enabled: true });

        expect(() => shortcut(tableElement)).toThrow('activation failed');
        shortcut(tableElement, 'PageUp');
        await Promise.resolve();

        expect(paginationMethods.previousPage).toHaveBeenCalledOnce();
    });

    test('does not install a listener when pagination is disabled', () => {
        const tableElement = createTableElement();
        createPaginationKeyboardRuntime({ table: { on: vi.fn(), off: vi.fn() }, tableElement, paginationMethods: {}, enabled: false });
        expect(tableElement.listener()).toBeUndefined();
    });

    test('decorates the table pager controls', () => {
        const tableElement = createTableElement();
        createPaginationKeyboardRuntime({ table: { on: vi.fn(), off: vi.fn() }, tableElement, paginationMethods: {}, enabled: true });
        expect(tableElement.previous.title).toBe('Previous page (Alt+PageUp)');
        expect(tableElement.next.title).toBe('Next page (Alt+PageDown)');
        expect(tableElement.previous.setAttribute).toHaveBeenCalledWith('aria-keyshortcuts', 'Alt+PageUp');
        expect(tableElement.next.setAttribute).toHaveBeenCalledWith('aria-keyshortcuts', 'Alt+PageDown');
    });
});

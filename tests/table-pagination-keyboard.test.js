import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { createPaginationKeyboardRuntime } from '../src/lib/table/pagination-keyboard-runtime.js';

const createTableElement = () => {
    const listeners = new Map();
    const rows = [];
    const previous = { title: '', setAttribute: vi.fn() };
    const next = { title: '', setAttribute: vi.fn() };
    const editing = { present: false };

    return {
        rows, previous, next, editing,
        addEventListener: (type, listener, capture) => listeners.set(`${type}:${capture}`, listener),
        removeEventListener: vi.fn((type, listener, capture) => {
            if (listeners.get(`${type}:${capture}`) === listener) listeners.delete(`${type}:${capture}`);
        }),
        contains: target => target?.inside === true || target?.cell === true,
        querySelectorAll: selector => selector === '.tabulator-row' ? rows : [],
        querySelector: selector => selector === '.tabulator-editing'
            || selector === '.tabulator-cell.tabulator-editing'
            ? (editing.present ? editing : null)
            : selector.includes('prev') ? previous : next,
        dispatch(event) {
            const listener = listeners.get('keydown:true');
            const dispatched = { preventDefault: vi.fn(), stopPropagation: vi.fn(), stopImmediatePropagation: vi.fn(), ...event };
            listener?.(dispatched);
            return dispatched;
        },
        listener: () => listeners.get('keydown:true')
    };
};

const createCandidate = ({ editable = true, edit = vi.fn() } = {}) => ({
    getColumn: () => ({ isVisible: () => true, getDefinition: () => ({ editable, editor: edit }) }),
    edit,
    getElement: () => ({ cell: true })
});

const createTable = ({ page = 1, max = 3, rows = [] } = {}) => {
    let currentPage = page;
    const table = {
        on: vi.fn(),
        off: vi.fn(),
        getRow: vi.fn(() => rows[0])
    };
    const paginationMethods = {
        previousPage: vi.fn(() => { currentPage -= 1; return Promise.resolve(); }),
        nextPage: vi.fn(() => { currentPage += 1; return Promise.resolve(); }),
        getPage: vi.fn(() => currentPage),
        getPageMax: vi.fn(() => max)
    };
    return { table, paginationMethods, setPage: value => { currentPage = value; } };
};

const shortcut = (tableElement, key = 'PageDown') => tableElement.dispatch({
    key, altKey: true, target: { inside: true }
});

describe('table pagination keyboard runtime', () => {
    beforeEach(() => { globalThis.document = { activeElement: null }; });
    afterEach(() => { delete globalThis.document; });

    test('uses capture phase and opens the first rendered editable cell', async () => {
        const tableElement = createTableElement();
        const firstEditable = createCandidate();
        const rowElement = {};
        tableElement.rows.push(rowElement);
        const { table, paginationMethods } = createTable({ rows: [{ getCells: () => [firstEditable] }] });
        createPaginationKeyboardRuntime({ table, tableElement, paginationMethods, enabled: true });

        shortcut(tableElement);
        await Promise.resolve();

        expect(tableElement.listener()).toBeDefined();
        expect(paginationMethods.nextPage).toHaveBeenCalledOnce();
        expect(table.getRow).toHaveBeenCalledWith(rowElement);
        expect(firstEditable.edit).toHaveBeenCalledOnce();
    });

    test('skips readonly cells and opens the first editable candidate', async () => {
        const tableElement = createTableElement();
        tableElement.rows.push({});
        const readonly = createCandidate({ editable: false });
        const editable = createCandidate();
        const { table, paginationMethods } = createTable({ rows: [{ getCells: () => [readonly, editable] }] });
        createPaginationKeyboardRuntime({ table, tableElement, paginationMethods, enabled: true });

        shortcut(tableElement);
        await Promise.resolve();

        expect(readonly.edit).not.toHaveBeenCalled();
        expect(editable.edit).toHaveBeenCalledOnce();
    });

    test('uses the DOM rows instead of getRows visible', async () => {
        const tableElement = createTableElement();
        tableElement.rows.push({});
        const candidate = createCandidate();
        const { table, paginationMethods } = createTable({ rows: [{ getCells: () => [candidate] }] });
        table.getRows = vi.fn();
        createPaginationKeyboardRuntime({ table, tableElement, paginationMethods, enabled: true });

        shortcut(tableElement);
        await Promise.resolve();

        expect(table.getRows).not.toHaveBeenCalled();
        expect(candidate.edit).toHaveBeenCalledOnce();
    });

    test('always opens the first editable cell when navigating backwards', async () => {
        const tableElement = createTableElement();
        tableElement.rows.push({});
        const first = createCandidate();
        const later = createCandidate();
        const { table, paginationMethods } = createTable({ page: 2, rows: [{ getCells: () => [first, later] }] });
        createPaginationKeyboardRuntime({ table, tableElement, paginationMethods, enabled: true });

        shortcut(tableElement, 'PageUp');
        await Promise.resolve();

        expect(paginationMethods.previousPage).toHaveBeenCalledOnce();
        expect(first.edit).toHaveBeenCalledOnce();
        expect(later.edit).not.toHaveBeenCalled();
    });

    test('ignores Tab and Shift+Tab', () => {
        const tableElement = createTableElement();
        const { table, paginationMethods } = createTable({ page: 2 });
        createPaginationKeyboardRuntime({ table, tableElement, paginationMethods, enabled: true });

        const tab = tableElement.dispatch({ key: 'Tab', target: { inside: true } });
        const shiftTab = tableElement.dispatch({ key: 'Tab', shiftKey: true, target: { inside: true } });

        expect(tab.preventDefault).not.toHaveBeenCalled();
        expect(shiftTab.preventDefault).not.toHaveBeenCalled();
        expect(paginationMethods.nextPage).not.toHaveBeenCalled();
        expect(paginationMethods.previousPage).not.toHaveBeenCalled();
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

    test('blocks a repeated shortcut while the Promise is pending', () => {
        const tableElement = createTableElement();
        const { table, paginationMethods } = createTable({ page: 2 });
        let resolve;
        paginationMethods.nextPage.mockReturnValueOnce(new Promise(done => { resolve = done; }));
        createPaginationKeyboardRuntime({ table, tableElement, paginationMethods, enabled: true });

        shortcut(tableElement);
        shortcut(tableElement);
        expect(paginationMethods.nextPage).toHaveBeenCalledOnce();
        resolve();
    });

    test('releases the transition lock when no rendered candidate exists', async () => {
        const tableElement = createTableElement();
        const { table, paginationMethods } = createTable({ page: 1 });
        createPaginationKeyboardRuntime({ table, tableElement, paginationMethods, enabled: true });

        shortcut(tableElement);
        await Promise.resolve();
        await Promise.resolve();
        shortcut(tableElement, 'PageUp');
        await Promise.resolve();

        expect(paginationMethods.nextPage).toHaveBeenCalledOnce();
        expect(paginationMethods.previousPage).toHaveBeenCalledOnce();
    });

    test('cleans up when page activation throws', async () => {
        const tableElement = createTableElement();
        tableElement.rows.push({});
        const edit = vi.fn().mockImplementationOnce(() => { throw new Error('activation failed'); });
        const candidate = createCandidate({ edit });
        const { table, paginationMethods } = createTable({ page: 1, rows: [{ getCells: () => [candidate] }] });
        createPaginationKeyboardRuntime({ table, tableElement, paginationMethods, enabled: true });

        shortcut(tableElement);
        await Promise.resolve();
        await Promise.resolve();
        shortcut(tableElement, 'PageUp');
        await Promise.resolve();

        expect(paginationMethods.previousPage).toHaveBeenCalledOnce();
    });

    test('decorates pager controls and can be disabled', () => {
        const tableElement = createTableElement();
        const { table } = createTable({});
        createPaginationKeyboardRuntime({ table, tableElement, paginationMethods: {}, enabled: true });
        expect(tableElement.previous.title).toBe('Previous page (Alt+PageUp)');
        expect(tableElement.next.title).toBe('Next page (Alt+PageDown)');

        const disabled = createTableElement();
        createPaginationKeyboardRuntime({ table: { on: vi.fn(), off: vi.fn() }, tableElement: disabled, paginationMethods: {}, enabled: false });
        expect(disabled.listener()).toBeUndefined();
    });
});

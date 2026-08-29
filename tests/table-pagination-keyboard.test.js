import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { createPaginationKeyboardRuntime } from '../src/lib/table/pagination-keyboard-runtime.js';
import { GRID_SHORTCUTS, matchesShortcut } from '../src/lib/table/keyboard-shortcuts.js';

const flush = async () => {
    for (let index = 0; index < 8; index += 1) await Promise.resolve();
};

const createElement = () => {
    const classes = new Set();
    const editor = { editor: true, inside: true };
    const element = {
        editor,
        classList: {
            contains: value => classes.has(value),
            add: value => classes.add(value),
            remove: value => classes.delete(value)
        },
        contains: value => value === editor
    };

    editor.closest = selector => selector === '.tabulator-editing' ? element : null;

    return element;
};

const createCandidate = ({ editable = true, activates = true } = {}) => {
    const element = createElement();
    const edit = vi.fn(() => {
        if (activates) {
            element.classList.add('tabulator-editing');
            globalThis.document.activeElement = element.editor;
        }
        return true;
    });

    return {
        edit,
        getElement: () => element,
        getColumn: () => ({
            isVisible: () => true,
            getDefinition: () => ({ editable, editor: edit })
        })
    };
};

const createHarness = ({ page = 1, max = 3, cells = [], row = null } = {}) => {
    const listeners = new Map();
    const keyListeners = new Map();
    const rowElement = {};
    const previous = { title: '', setAttribute: vi.fn() };
    const next = { title: '', setAttribute: vi.fn() };
    const tableHolder = { scrollTop: 0 };
    let currentPage = page;
    let editing = false;
    let editingElement = null;
    let renderedCells = cells;
    const renderedRow = row || { getCells: () => renderedCells };
    const tableElement = {
        previous,
        next,
        contains: target => target?.inside === true,
        querySelectorAll: selector => selector === '.tabulator-row' ? [rowElement] : [],
        querySelector: selector => selector.includes('.tabulator-editing')
            ? (editing ? editingElement : null)
            : selector === '.tabulator-tableholder' ? tableHolder
            : selector.includes('prev') ? previous : next,
        addEventListener: (type, listener, capture) => keyListeners.set(`${type}:${capture}`, listener),
        removeEventListener: vi.fn(),
        dispatch(event) {
            const dispatched = { preventDefault: vi.fn(), stopPropagation: vi.fn(), stopImmediatePropagation: vi.fn(), ...event };
            keyListeners.get('keydown:true')?.(dispatched);
            return dispatched;
        }
    };
    const table = {
        on: vi.fn((event, listener) => {
            const eventListeners = listeners.get(event) || new Set();
            eventListeners.add(listener);
            listeners.set(event, eventListeners);
        }),
        off: vi.fn((event, listener) => listeners.get(event)?.delete(listener)),
        getRow: vi.fn(() => renderedRow),
        emit: (event, ...args) => [...(listeners.get(event) || [])]
            .forEach(listener => listener(...args))
    };
    const paginationMethods = {
        getPage: vi.fn(() => currentPage),
        getPageMax: vi.fn(() => max),
        nextPage: vi.fn(() => { currentPage += 1; return Promise.resolve(); }),
        previousPage: vi.fn(() => { currentPage -= 1; return Promise.resolve(); })
    };
    const runtime = createPaginationKeyboardRuntime({ table, tableElement, paginationMethods, enabled: true });

    return {
        table, tableElement, tableHolder, paginationMethods, runtime,
        listenerCount: event => listeners.get(event)?.size || 0,
        setCells: value => { renderedCells = value; },
        setEditing: (value, cell) => {
            editing = value;
            if (cell) editingElement = cell.getElement();
            editingElement?.classList[value ? 'add' : 'remove']('tabulator-editing');
        },
        setPage: value => { currentPage = value; },
        page: () => currentPage
    };
};

const shortcut = (harness, key) => harness.tableElement.dispatch({
    key,
    altKey: true,
    target: { inside: true }
});

describe('table pagination keyboard runtime', () => {
    beforeEach(() => {
        globalThis.document = { activeElement: null };
        globalThis.requestAnimationFrame = callback => { callback(); return 1; };
    });

    afterEach(() => {
        delete globalThis.document;
        delete globalThis.requestAnimationFrame;
    });

    test.each([
        ['next', 'first', 1, 'nextPage'],
        ['prev', 'first', 2, 'previousPage'],
        ['prev', 'last', 2, 'previousPage']
    ])('coordinates %s + %s', async (direction, destination, page, method) => {
        const first = createCandidate();
        const last = createCandidate();
        const harness = createHarness({ page, cells: [first, last] });
        const transition = harness.runtime.transitionPage({ direction, destination });

        harness.table.emit('renderComplete');
        await transition;

        expect(harness.paginationMethods[method]).toHaveBeenCalledOnce();
        expect(destination === 'last' ? last.edit : first.edit).toHaveBeenCalledOnce();
    });

    test('waits when renderComplete happens before the page Promise', async () => {
        const candidate = createCandidate();
        const harness = createHarness({ cells: [candidate] });
        let resolvePage;
        harness.paginationMethods.nextPage.mockImplementationOnce(() => {
            harness.setPage(2);
            return new Promise(resolve => { resolvePage = resolve; });
        });
        const transition = harness.runtime.transitionPage({ direction: 'next', destination: 'first' });

        harness.table.emit('renderComplete');
        expect(candidate.edit).not.toHaveBeenCalled();
        resolvePage();
        await transition;
        expect(candidate.edit).toHaveBeenCalledOnce();
    });

    test('waits when the page Promise resolves before renderComplete', async () => {
        const candidate = createCandidate();
        const harness = createHarness({ cells: [candidate] });
        const transition = harness.runtime.transitionPage({ direction: 'next', destination: 'first' });

        await flush();
        expect(candidate.edit).not.toHaveBeenCalled();
        harness.table.emit('renderComplete');
        await transition;
        expect(candidate.edit).toHaveBeenCalledOnce();
    });

    test.each(['cellEdited', 'cellEditCancelled'])(
        'waits for async editor closure through %s and ignores other cells',
        async editEvent => {
            const current = createCandidate();
            const other = createCandidate();
            const destination = createCandidate();
            const harness = createHarness({ cells: [current] });
            const blur = vi.fn();

            harness.setEditing(true, current);
            globalThis.document.activeElement = {
                inside: true,
                blur,
                closest: selector => selector === '.tabulator-editing'
                    ? current.getElement()
                    : null
            };

            const transition = harness.runtime.transitionPage({
                direction: 'next',
                destination: 'first'
            });

            expect(blur).toHaveBeenCalledOnce();
            expect(harness.paginationMethods.nextPage).not.toHaveBeenCalled();
            expect(harness.listenerCount('cellEdited')).toBe(1);
            expect(harness.listenerCount('cellEditCancelled')).toBe(1);

            harness.table.emit(editEvent, other);
            await flush();
            expect(harness.paginationMethods.nextPage).not.toHaveBeenCalled();

            harness.setEditing(false, current);
            harness.setCells([destination]);
            harness.table.emit(editEvent, current);
            await flush();

            expect(harness.paginationMethods.nextPage).toHaveBeenCalledOnce();
            expect(destination.edit).not.toHaveBeenCalled();
            harness.table.emit('renderComplete');

            expect(await transition).toBe(true);
            expect(destination.edit).toHaveBeenCalledOnce();
            expect(harness.listenerCount('cellEdited')).toBe(0);
            expect(harness.listenerCount('cellEditCancelled')).toBe(0);
        }
    );

    test('destroy aborts an async editor close and removes temporary listeners', async () => {
        const current = createCandidate();
        const harness = createHarness({ cells: [current] });

        harness.setEditing(true, current);
        globalThis.document.activeElement = {
            inside: true,
            blur: vi.fn(),
            closest: () => current.getElement()
        };

        const transition = harness.runtime.transitionPage({
            direction: 'next',
            destination: 'first'
        });

        expect(harness.listenerCount('cellEdited')).toBe(1);
        expect(harness.listenerCount('cellEditCancelled')).toBe(1);
        harness.runtime.destroy();

        expect(await transition).toBe(false);
        expect(harness.listenerCount('cellEdited')).toBe(0);
        expect(harness.listenerCount('cellEditCancelled')).toBe(0);
        expect(harness.paginationMethods.nextPage).not.toHaveBeenCalled();
    });

    test('cleans temporary edit listeners when blur throws', async () => {
        const current = createCandidate();
        const harness = createHarness({ cells: [current] });

        harness.setEditing(true, current);
        globalThis.document.activeElement = {
            inside: true,
            blur: vi.fn(() => { throw new Error('blur failed'); }),
            closest: () => current.getElement()
        };

        expect(await harness.runtime.transitionPage({
            direction: 'next',
            destination: 'first'
        })).toBe(false);
        expect(harness.listenerCount('cellEdited')).toBe(0);
        expect(harness.listenerCount('cellEditCancelled')).toBe(0);
        expect(harness.paginationMethods.nextPage).not.toHaveBeenCalled();
    });

    test('does not blur or transition at an absolute boundary', async () => {
        const harness = createHarness({ page: 1, max: 1 });
        const activeElement = { inside: true, blur: vi.fn() };
        globalThis.document.activeElement = activeElement;

        expect(await harness.runtime.transitionPage({ direction: 'prev', destination: 'first' })).toBe(false);
        expect(await harness.runtime.transitionPage({ direction: 'next', destination: 'first' })).toBe(false);
        expect(activeElement.blur).not.toHaveBeenCalled();
        expect(harness.paginationMethods.nextPage).not.toHaveBeenCalled();
    });

    test('locks repeated transitions and cleans up a rejection', async () => {
        const harness = createHarness({ page: 1 });
        let rejectPage;
        harness.paginationMethods.nextPage.mockImplementationOnce(() => new Promise((resolve, reject) => { rejectPage = reject; }));
        const first = harness.runtime.transitionPage({ direction: 'next', destination: 'first' });

        expect(await harness.runtime.transitionPage({ direction: 'next', destination: 'first' })).toBe(false);
        rejectPage(new Error('page failed'));
        expect(await first).toBe(false);

        harness.setPage(2);
        const reverse = harness.runtime.transitionPage({ direction: 'prev', destination: 'first' });
        harness.table.emit('renderComplete');
        await reverse;
        expect(harness.paginationMethods.previousPage).toHaveBeenCalledOnce();
    });

    test('distinguishes edit invocation from a real active editor', async () => {
        const failed = createCandidate({ activates: false });
        const harness = createHarness({ cells: [failed] });
        const transition = harness.runtime.transitionPage({ direction: 'next', destination: 'first' });

        harness.table.emit('renderComplete');
        expect(await transition).toBe(false);
        expect(failed.edit).toHaveBeenCalledOnce();

        const reverse = harness.runtime.transitionPage({ direction: 'prev', destination: 'first' });
        harness.table.emit('renderComplete');
        await reverse;
        expect(harness.paginationMethods.previousPage).toHaveBeenCalledOnce();
    });

    test('destroy removes a pending render listener and unlocks the coordinator', async () => {
        const harness = createHarness({});
        const transition = harness.runtime.transitionPage({ direction: 'next', destination: 'first' });

        harness.runtime.destroy();

        expect(await transition).toBe(false);
        expect(harness.table.off).toHaveBeenCalledWith('renderComplete', expect.any(Function));
    });

    test('destroy releases a pending virtual-scroll render wait', async () => {
        const candidate = createCandidate();
        let harness;
        const row = {
            getCells: () => [candidate],
            scrollTo: vi.fn(async () => { harness.tableHolder.scrollTop = 100; })
        };

        harness = createHarness({ cells: [candidate], row });
        const transition = harness.runtime.transitionPage({
            direction: 'next',
            destination: 'first'
        });

        harness.table.emit('renderComplete');
        await flush();
        expect(row.scrollTo).toHaveBeenCalledOnce();
        expect(harness.listenerCount('renderComplete')).toBeGreaterThan(1);

        harness.runtime.destroy();

        expect(await transition).toBe(false);
        await flush();
        expect(harness.listenerCount('renderComplete')).toBe(0);
        expect(candidate.edit).not.toHaveBeenCalled();
    });

    test('uses centralized shortcuts and ignores Tab and Shift+Tab', () => {
        const harness = createHarness({});
        const tab = harness.tableElement.dispatch({ key: 'Tab', target: { inside: true } });
        const shiftTab = harness.tableElement.dispatch({ key: 'Tab', shiftKey: true, target: { inside: true } });

        expect(tab.preventDefault).not.toHaveBeenCalled();
        expect(shiftTab.preventDefault).not.toHaveBeenCalled();
        expect(harness.paginationMethods.nextPage).not.toHaveBeenCalled();

        shortcut(harness, 'PageDown');
        expect(harness.paginationMethods.nextPage).toHaveBeenCalledOnce();
        expect(harness.tableElement.next.title).toBe('Next page (Alt+PageDown)');
    });

    test.each([
        ['ArrowUp', GRID_SHORTCUTS.previousRow],
        ['ArrowDown', GRID_SHORTCUTS.nextRow]
    ])('recognizes Alt+%s as vertical navigation', (key, shortcutDefinition) => {
        expect(matchesShortcut({ key, altKey: true }, shortcutDefinition)).toBe(true);
        expect(matchesShortcut({ key }, shortcutDefinition)).toBe(false);
        expect(matchesShortcut({ key, ctrlKey: true }, shortcutDefinition)).toBe(false);
        expect(matchesShortcut({ key, metaKey: true }, shortcutDefinition)).toBe(false);
    });

    test('keeps page shortcuts recognized', () => {
        expect(matchesShortcut(
            { key: 'PageUp', altKey: true },
            GRID_SHORTCUTS.previousPage
        )).toBe(true);
        expect(matchesShortcut(
            { key: 'PageDown', altKey: true },
            GRID_SHORTCUTS.nextPage
        )).toBe(true);
    });
});

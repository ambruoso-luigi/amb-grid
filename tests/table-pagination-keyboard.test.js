import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { createKeyboardNavigationRuntime } from '../src/lib/table/keyboard-navigation-runtime.js';
import {
    focusCellWithoutEditing,
    handleEditorCommitCancelKeydown
} from '../src/lib/editors/shared.js';
import { GRID_SHORTCUTS, matchesShortcut } from '../src/lib/table/keyboard-shortcuts.js';
import { setAmbColumnMetadata } from '../src/lib/table/column-metadata.js';
import { normalizeKeyboardNavigationOptions } from '../src/lib/table/keyboard-bindings.js';

const flush = async () => {
    for (let index = 0; index < 8; index += 1) await Promise.resolve();
};

const createElement = () => {
    const classes = new Set();
    const attributes = new Map();
    const editor = { editor: true, inside: true };
    const element = {
        editor,
        inside: true,
        rowElement: null,
        field: 'field',
        classList: {
            contains: value => classes.has(value),
            add: value => classes.add(value),
            remove: value => classes.delete(value)
        },
        contains: value => value === editor,
        closest: selector => selector === '.tabulator-cell'
            ? element
            : selector === '.tabulator-row' ? element.rowElement : null,
        getAttribute: name => name === 'tabulator-field'
            ? element.field
            : attributes.get(name) || null,
        hasAttribute: name => attributes.has(name),
        setAttribute: (name, value) => attributes.set(name, String(value)),
        focus: vi.fn(() => { globalThis.document.activeElement = element; })
    };

    editor.closest = selector => selector === '.tabulator-editing' || selector === '.tabulator-cell'
        ? element
        : selector === '.tabulator-row' ? element.rowElement : null;

    return element;
};

const createCandidate = ({ editable = true, activates = true, focusOnly = false, field = 'field' } = {}) => {
    const element = createElement();
    element.field = field;
    const edit = vi.fn(() => {
        if (activates) {
            element.classList.add('tabulator-editing');
            globalThis.document.activeElement = element.editor;
        }
        return true;
    });

    const definition = { editable, editor: edit };
    if (focusOnly) setAmbColumnMetadata(definition, { keyboardFocusOnly: true });
    const candidate = {
        edit,
        getField: () => field,
        getRow: () => candidate.row,
        getElement: () => element,
        getColumn: () => ({
            isVisible: () => true,
            getDefinition: () => definition
        })
    };

    return candidate;
};

const createHarness = ({ page = 1, max = 3, cells = [], row = null, rowElements, enabled = true, keyboardNavigation, cellEditing } = {}) => {
    const listeners = new Map();
    const keyListeners = new Map();
    const rowElement = {
        classList: { contains: className => className === 'tabulator-row' }
    };
    const previous = { title: '', setAttribute: vi.fn() };
    const next = { title: '', setAttribute: vi.fn() };
    const tableHolder = { scrollTop: 0 };
    let currentPage = page;
    let editing = false;
    let editingElement = null;
    let renderedCells = cells;
    const renderedRow = row || { getCells: () => renderedCells };
    renderedRow.getCell ||= field => renderedCells.find(cell => cell.getField?.() === field);
    renderedCells.forEach(cell => {
        cell.row = renderedRow;
        cell.getElement().rowElement = rowElement;
    });
    const tableElement = {
        previous,
        next,
        contains: target => target?.inside === true,
        querySelectorAll: selector => selector === '.tabulator-row'
            ? rowElements || [rowElement]
            : [],
        querySelector: selector => selector.includes('.tabulator-editing')
            ? (editing ? editingElement : null)
            : selector === '.tabulator-tableholder' ? tableHolder
            : selector.includes('prev') ? previous : next,
        addEventListener: (type, listener, capture) => keyListeners.set(`${type}:${capture}`, listener),
        removeEventListener: vi.fn(),
        dispatch(event, type = 'keydown') {
            const dispatched = { type, preventDefault: vi.fn(), stopPropagation: vi.fn(), stopImmediatePropagation: vi.fn(), ...event };
            keyListeners.get(`${type}:true`)?.(dispatched);
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
    const runtime = createKeyboardNavigationRuntime({ table, tableElement, paginationMethods, enabled, keyboardNavigation, cellEditing });

    return {
        table, tableElement, tableHolder, paginationMethods, runtime, rowElement,
        listenerCount: event => listeners.get(event)?.size || 0,
        setCells: value => {
            renderedCells = value;
            renderedCells.forEach(cell => {
                cell.row = renderedRow;
                cell.getElement().rowElement = rowElement;
            });
        },
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

    test('skips managed action cells when activating the first editable page destination', async () => {
        const rowAction = createCandidate({ field: '_actions' });
        const itemCode = createCandidate({ field: 'itemCode' });
        setAmbColumnMetadata(rowAction.getColumn().getDefinition(), {
            interactive: true,
            managedColumn: 'rowAction',
            focusSelector: '.amb-row-action-button'
        });
        const harness = createHarness({ cells: [rowAction, itemCode] });
        const transition = harness.runtime.transitionPage({ direction: 'next', destination: 'first' });

        harness.table.emit('renderComplete');

        expect(await transition).toBe(true);
        expect(rowAction.edit).not.toHaveBeenCalled();
        expect(itemCode.edit).toHaveBeenCalledOnce();
        expect(itemCode.getElement().classList.contains('tabulator-editing')).toBe(true);
        expect(globalThis.document.activeElement).toBe(itemCode.getElement().editor);
    });

    test('opens the next automatic destination when Tab starts from a managed action', () => {
        const rowAction = createCandidate({ field: '_actions' });
        const itemCode = createCandidate({ field: 'itemCode' });
        setAmbColumnMetadata(rowAction.getColumn().getDefinition(), {
            interactive: true,
            managedColumn: 'rowAction',
            focusSelector: '.amb-row-action-button'
        });
        const harness = createHarness({ cells: [rowAction, itemCode] });
        globalThis.document.activeElement = rowAction.getElement();

        const event = harness.tableElement.dispatch({ key: 'Tab', target: rowAction.getElement() });

        expect(event.preventDefault).toHaveBeenCalledOnce();
        expect(itemCode.edit).toHaveBeenCalledOnce();
        expect(globalThis.document.activeElement).toBe(itemCode.getElement().editor);
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

    test('Enter opens a focused large-text cell exactly once', () => {
        const notes = createCandidate({ focusOnly: true, field: 'notes' });
        const harness = createHarness({ cells: [notes] });
        globalThis.document.activeElement = notes.getElement();

        const event = harness.tableElement.dispatch({
            key: 'Enter',
            target: notes.getElement()
        });

        expect(event.preventDefault).toHaveBeenCalledOnce();
        expect(notes.edit).toHaveBeenCalledOnce();
    });

    test('leaves Enter to an active editor', () => {
        const cell = createCandidate();
        const harness = createHarness({ cells: [cell] });
        harness.setEditing(true, cell);
        globalThis.document.activeElement = cell.getElement().editor;

        const event = harness.tableElement.dispatch({
            key: 'Enter',
            target: cell.getElement().editor
        });

        expect(event.preventDefault).not.toHaveBeenCalled();
        expect(event.stopPropagation).not.toHaveBeenCalled();
        expect(event.stopImmediatePropagation).not.toHaveBeenCalled();
        expect(cell.edit).not.toHaveBeenCalled();
    });

    test('leaves Enter to an editing checkbox while retaining its arrow capability', () => {
        const checkbox = createCandidate();
        setAmbColumnMetadata(checkbox.getColumn().getDefinition(), {
            spatialNavigationWhileEditing: true
        });
        const harness = createHarness({ cells: [checkbox] });
        harness.setEditing(true, checkbox);
        globalThis.document.activeElement = checkbox.getElement().editor;

        const enter = harness.tableElement.dispatch({
            key: 'Enter',
            target: checkbox.getElement().editor
        });
        const arrow = harness.tableElement.dispatch({
            key: 'ArrowDown',
            target: checkbox.getElement().editor
        });

        expect(enter.preventDefault).not.toHaveBeenCalled();
        expect(checkbox.edit).not.toHaveBeenCalled();
        // ArrowDown still reaches and is handled by the spatial-navigation
        // branch, unlike Enter.
        expect(arrow.stopPropagation).toHaveBeenCalledOnce();
    });

    test('leaves Enter on a focused checkbox cell to its direct toggle handler', () => {
        const checkbox = createCandidate();
        setAmbColumnMetadata(checkbox.getColumn().getDefinition(), {
            activateOnNavigationFocus: true
        });
        const harness = createHarness({ cells: [checkbox] });
        globalThis.document.activeElement = checkbox.getElement();

        const event = harness.tableElement.dispatch({
            key: 'Enter',
            target: checkbox.getElement()
        });

        expect(event.preventDefault).not.toHaveBeenCalled();
        expect(checkbox.edit).not.toHaveBeenCalled();
    });

    test('moves spatially without opening the destination editor', () => {
        const first = createCandidate({ field: 'first', focusOnly: true });
        const readonly = createCandidate({ editable: false, field: 'readonly' });
        const last = createCandidate({ field: 'last' });
        const harness = createHarness({ cells: [first, readonly, last] });
        globalThis.document.activeElement = first.getElement();

        const event = harness.tableElement.dispatch({ key: 'ArrowRight', target: first.getElement() });

        expect(event.preventDefault).toHaveBeenCalledOnce();
        expect(last.getElement().focus).toHaveBeenCalledOnce();
        expect(globalThis.document.activeElement).toBe(last.getElement());
        expect(readonly.edit).not.toHaveBeenCalled();
        expect(last.edit).not.toHaveBeenCalled();
    });

    test('makes an unfocusable cell programmatically focusable without changing existing tabindex', () => {
        const unfocusable = createCandidate({ editable: false });
        const preserved = createCandidate({ editable: false });
        preserved.getElement().setAttribute('tabindex', '0');

        expect(focusCellWithoutEditing(unfocusable)).toBe(true);
        expect(unfocusable.getElement().getAttribute('tabindex')).toBe('-1');
        expect(globalThis.document.activeElement).toBe(unfocusable.getElement());

        expect(focusCellWithoutEditing(preserved)).toBe(true);
        expect(preserved.getElement().getAttribute('tabindex')).toBe('0');
        expect(globalThis.document.activeElement).toBe(preserved.getElement());
    });

    test('skips consecutive readonly cells with arrows while retaining focus-only activation', () => {
        const first = createCandidate({ field: 'first' });
        const readonlyOne = createCandidate({ editable: false, field: 'readonlyOne' });
        const readonlyTwo = createCandidate({ editable: false, field: 'readonlyTwo' });
        const last = createCandidate({ field: 'last' });
        const harness = createHarness({ cells: [first, readonlyOne, readonlyTwo, last] });
        globalThis.document.activeElement = first.getElement();

        harness.tableElement.dispatch({ key: 'ArrowRight', target: first.getElement() });
        expect(globalThis.document.activeElement).toBe(last.getElement());
        expect(globalThis.document.activeElement).not.toBe(readonlyOne.getElement());
        expect(globalThis.document.activeElement).not.toBe(readonlyTwo.getElement());
        expect(readonlyOne.edit).not.toHaveBeenCalled();
        expect(readonlyTwo.edit).not.toHaveBeenCalled();
        expect(last.edit).not.toHaveBeenCalled();

        harness.tableElement.dispatch({ key: 'Enter', target: last.getElement() });
        expect(last.edit).toHaveBeenCalledOnce();

        harness.setEditing(false, last);
        globalThis.document.activeElement = last.getElement();
        harness.tableElement.dispatch({ key: 'ArrowLeft', target: last.getElement() });
        expect(globalThis.document.activeElement).toBe(first.getElement());
    });

    test('skips a vertically aligned cell whose editable callback returns false', () => {
        const first = createCandidate({ field: 'name' });
        const unavailable = createCandidate({ field: 'name' });
        const last = createCandidate({ field: 'name' });
        unavailable.getColumn().getDefinition().editable = () => false;
        const rows = [[first], [unavailable], [last]].map(cells => {
            const row = {
                getCells: () => cells,
                getCell: field => cells.find(cell => cell.getField() === field)
            };
            cells.forEach(cell => { cell.row = row; });
            return row;
        });
        const harness = createHarness({ cells: [first] });
        harness.table.getRows = () => rows;
        [first, unavailable, last].forEach((cell, index) => {
            cell.row = rows[index];
            cell.getElement().rowElement = harness.rowElement;
        });
        globalThis.document.activeElement = first.getElement();

        harness.tableElement.dispatch({ key: 'ArrowDown', target: first.getElement() });

        expect(globalThis.document.activeElement).toBe(last.getElement());
        expect(unavailable.edit).not.toHaveBeenCalled();
        expect(last.edit).not.toHaveBeenCalled();
    });

    test('does not call shouldHandle for dedicated page shortcuts', () => {
        const shouldHandle = vi.fn(() => true);
        const harness = createHarness({});
        harness.runtime.destroy();
        const runtime = createKeyboardNavigationRuntime({
            table: harness.table,
            tableElement: harness.tableElement,
            paginationMethods: harness.paginationMethods,
            enabled: true,
            keyboardNavigation: normalizeKeyboardNavigationOptions({ shouldHandle })
        });

        shortcut(harness, 'PageDown');

        expect(shouldHandle).not.toHaveBeenCalled();
        expect(harness.paginationMethods.nextPage).toHaveBeenCalledOnce();
        runtime.destroy();
    });

    test('keeps legacy Tab and page shortcuts isolated from disabled navigation hooks', () => {
        const first = createCandidate({ field: 'first', focusOnly: true });
        const second = createCandidate({ field: 'second' });
        const shouldHandle = vi.fn(() => false);
        const harness = createHarness({
            cells: [first, second],
            keyboardNavigation: normalizeKeyboardNavigationOptions({
                enabled: false,
                shouldHandle,
                bindings: { next: 'Ctrl+ArrowRight', previous: 'Ctrl+ArrowLeft' }
            })
        });
        globalThis.document.activeElement = first.getElement();

        const tab = harness.tableElement.dispatch({ key: 'Tab', target: first.getElement() });
        const custom = harness.tableElement.dispatch({ key: 'ArrowRight', ctrlKey: true, target: first.getElement() });
        const arrow = harness.tableElement.dispatch({ key: 'ArrowRight', target: first.getElement() });
        const enter = harness.tableElement.dispatch({ key: 'Enter', target: first.getElement() });
        shortcut(harness, 'PageDown');

        expect(tab.preventDefault).toHaveBeenCalledOnce();
        expect(second.edit).toHaveBeenCalledOnce();
        expect(custom.preventDefault).not.toHaveBeenCalled();
        expect(arrow.preventDefault).not.toHaveBeenCalled();
        expect(enter.preventDefault).not.toHaveBeenCalled();
        expect(shouldHandle).not.toHaveBeenCalled();
        expect(harness.paginationMethods.nextPage).toHaveBeenCalledOnce();
    });

    test('focus-only keyboard behavior remains active without pagination', () => {
        const notes = createCandidate({ focusOnly: true, field: 'notes' });
        const harness = createHarness({ cells: [notes], enabled: false });
        globalThis.document.activeElement = notes.getElement();

        harness.tableElement.dispatch({ key: 'Enter', target: notes.getElement() });

        expect(notes.edit).toHaveBeenCalledOnce();
        expect(harness.paginationMethods.nextPage).not.toHaveBeenCalled();
    });

    test('click focuses a large-text cell without opening its editor', async () => {
        const notes = createCandidate({ focusOnly: true, field: 'notes' });
        const harness = createHarness({ cells: [notes] });

        const event = harness.tableElement.dispatch({ target: notes.getElement() }, 'click');
        await flush();

        expect(event.preventDefault).toHaveBeenCalledOnce();
        expect(notes.getElement().focus).toHaveBeenCalledOnce();
        expect(notes.edit).not.toHaveBeenCalled();
    });

    test('default pointer click focuses an editable cell without opening its editor', async () => {
        const title = createCandidate({ field: 'title' });
        const harness = createHarness({ cells: [title] });

        const event = harness.tableElement.dispatch({ target: title.getElement() }, 'click');
        await flush();

        expect(event.preventDefault).not.toHaveBeenCalled();
        expect(globalThis.document.activeElement).toBe(title.getElement());
        expect(title.edit).not.toHaveBeenCalled();
    });

    test('default pointer mousedown establishes navigation focus without opening an editor', () => {
        const title = createCandidate({ field: 'title' });
        const harness = createHarness({ cells: [title] });

        const event = harness.tableElement.dispatch({ target: title.getElement() }, 'mousedown');

        expect(event.preventDefault).not.toHaveBeenCalled();
        expect(globalThis.document.activeElement).toBe(title.getElement());
        expect(title.edit).not.toHaveBeenCalled();
    });

    test('leaves mousedown inside an active editor owned by the editor', () => {
        const title = createCandidate({ field: 'title' });
        const harness = createHarness({ cells: [title] });

        harness.setEditing(true, title);
        globalThis.document.activeElement = title.getElement().editor;

        const event = harness.tableElement.dispatch({
            target: title.getElement().editor
        }, 'mousedown');

        expect(event.preventDefault).not.toHaveBeenCalled();
        expect(event.stopPropagation).not.toHaveBeenCalled();
        expect(event.stopImmediatePropagation).not.toHaveBeenCalled();
        expect(title.getElement().focus).not.toHaveBeenCalled();
        expect(title.edit).not.toHaveBeenCalled();
        expect(globalThis.document.activeElement).toBe(title.getElement().editor);
        expect(title.getElement().classList.contains('tabulator-editing')).toBe(true);
    });

    test('leaves click inside an active editor owned by the editor', async () => {
        const title = createCandidate({ field: 'title' });
        const harness = createHarness({ cells: [title] });

        harness.setEditing(true, title);
        globalThis.document.activeElement = title.getElement().editor;

        const event = harness.tableElement.dispatch({
            target: title.getElement().editor
        }, 'click');
        await flush();

        expect(event.preventDefault).not.toHaveBeenCalled();
        expect(event.stopPropagation).not.toHaveBeenCalled();
        expect(event.stopImmediatePropagation).not.toHaveBeenCalled();
        expect(title.getElement().focus).not.toHaveBeenCalled();
        expect(title.edit).not.toHaveBeenCalled();
        expect(globalThis.document.activeElement).toBe(title.getElement().editor);
        expect(title.getElement().classList.contains('tabulator-editing')).toBe(true);
    });

    test('leaves pointer padding inside an active editor cell owned by the editor', () => {
        const title = createCandidate({ field: 'title' });
        const harness = createHarness({ cells: [title] });

        harness.setEditing(true, title);

        const event = harness.tableElement.dispatch({
            target: title.getElement()
        }, 'mousedown');

        expect(event.preventDefault).not.toHaveBeenCalled();
        expect(event.stopPropagation).not.toHaveBeenCalled();
        expect(event.stopImmediatePropagation).not.toHaveBeenCalled();
        expect(title.getElement().focus).not.toHaveBeenCalled();
        expect(title.edit).not.toHaveBeenCalled();
        expect(title.getElement().classList.contains('tabulator-editing')).toBe(true);
    });

    test('resolves a pointer cell through rendered row components when getRow rejects DOM nodes', () => {
        const title = createCandidate({ field: 'title' });
        const harness = createHarness({ cells: [title] });
        harness.table.getRow.mockReturnValue(null);
        harness.table.getRows = vi.fn(() => [title.row]);

        const event = harness.tableElement.dispatch({ target: title.getElement() }, 'mousedown');

        expect(event.preventDefault).not.toHaveBeenCalled();
        expect(globalThis.document.activeElement).toBe(title.getElement());
        expect(title.edit).not.toHaveBeenCalled();
    });

    test('single-click editing mode leaves normal pointer editing to the engine', () => {
        const title = createCandidate({ field: 'title' });
        const harness = createHarness({
            cells: [title],
            cellEditing: { mouseTrigger: 'single-click' }
        });

        const event = harness.tableElement.dispatch({ target: title.getElement() }, 'click');

        expect(event.preventDefault).not.toHaveBeenCalled();
        expect(title.edit).not.toHaveBeenCalled();
    });

    test('click uses the large-text marker while a virtual row component is unavailable', async () => {
        const notes = createCandidate({ focusOnly: true, field: 'notes' });
        const harness = createHarness({ cells: [notes] });
        const element = notes.getElement();
        element.classList.add('amb-cell--large-text');
        harness.table.getRow.mockReturnValue(null);

        const event = harness.tableElement.dispatch({ target: element }, 'click');
        await flush();

        expect(event.preventDefault).toHaveBeenCalledOnce();
        expect(element.focus).toHaveBeenCalledOnce();
        expect(notes.edit).not.toHaveBeenCalled();
    });

    test('leaves a large-text double click to its primary editor activation', () => {
        const notes = createCandidate({ focusOnly: true, field: 'notes' });
        const harness = createHarness({ cells: [notes] });

        const event = harness.tableElement.dispatch({
            target: notes.getElement(),
            detail: 2
        }, 'click');

        expect(event.preventDefault).not.toHaveBeenCalled();
        expect(notes.getElement().focus).not.toHaveBeenCalled();
        expect(notes.edit).not.toHaveBeenCalled();
    });

    test.each([
        ['checkbox', { activateOnNavigationFocus: true }],
        ['selection', { interactive: true, focusSelector: '.amb-selection-column__input' }],
        ['row action', { interactive: true, focusSelector: '.amb-row-action-button' }]
    ])('leaves %s pointer clicks to their managed control', async (_name, metadata) => {
        const control = createCandidate({ field: 'control' });
        setAmbColumnMetadata(control.getColumn().getDefinition(), metadata);
        const harness = createHarness({ cells: [control] });

        const event = harness.tableElement.dispatch({ target: control.getElement() }, 'click');
        await flush();

        expect(event.preventDefault).not.toHaveBeenCalled();
        expect(control.getElement().focus).not.toHaveBeenCalled();
        expect(control.edit).not.toHaveBeenCalled();
    });

    test('a pointer destination cancels a pending keyboard-close focus restoration', async () => {
        const source = createCandidate({ field: 'source' });
        const destination = createCandidate({ field: 'destination' });
        const frames = [];
        globalThis.requestAnimationFrame = callback => {
            frames.push(callback);
            return frames.length;
        };
        const harness = createHarness({ cells: [source, destination] });
        source.getTable = () => harness.table;
        destination.getTable = () => harness.table;
        const event = {
            key: 'Enter',
            preventDefault: vi.fn(),
            stopPropagation: vi.fn(),
            stopImmediatePropagation: vi.fn()
        };

        handleEditorCommitCancelKeydown({
            cell: source,
            event,
            onCommit: vi.fn(),
            onCancel: vi.fn()
        });
        harness.tableElement.dispatch({ target: destination.getElement() }, 'click');
        frames.splice(0).forEach(callback => callback());
        await Promise.resolve();
        frames.splice(0).forEach(callback => callback());
        await Promise.resolve();
        frames.splice(0).forEach(callback => callback());

        expect(source.getElement().focus).not.toHaveBeenCalled();
    });

    test('a pointer in another grid does not cancel its pending focus restoration', () => {
        const source = createCandidate({ field: 'source' });
        const otherGridCell = createCandidate({ field: 'other' });
        const frames = [];
        globalThis.requestAnimationFrame = callback => {
            frames.push(callback);
            return frames.length;
        };
        const firstGrid = createHarness({ cells: [source] });
        const secondGrid = createHarness({ cells: [otherGridCell] });
        source.getTable = () => firstGrid.table;
        otherGridCell.getTable = () => secondGrid.table;

        handleEditorCommitCancelKeydown({
            cell: source,
            event: {
                key: 'Enter',
                preventDefault: vi.fn(),
                stopPropagation: vi.fn(),
                stopImmediatePropagation: vi.fn()
            },
            onCommit: vi.fn(),
            onCancel: vi.fn()
        });
        secondGrid.tableElement.dispatch({ target: otherGridCell.getElement() }, 'click');
        frames.splice(0).forEach(callback => callback());

        expect(source.getElement().focus).toHaveBeenCalledOnce();
    });

    test('ignores calculation rows before resolving row or cell components', async () => {
        const candidate = createCandidate();
        const calculationRow = {
            classList: {
                contains: className => [
                    'tabulator-row',
                    'tabulator-calcs',
                    'amb-calc-row'
                ].includes(className)
            }
        };
        const harness = createHarness({
            cells: [candidate],
            rowElements: [calculationRow]
        });
        const transition = harness.runtime.transitionPage({
            direction: 'next',
            destination: 'first'
        });

        harness.table.emit('renderComplete');
        await transition;
        expect(harness.table.getRow).not.toHaveBeenCalledWith(calculationRow);

        const calculationCell = {
            classList: { contains: className => className === 'amb-cell--large-text' },
            closest: selector => selector === '.tabulator-row' ? calculationRow : null,
            getAttribute: () => 'notes',
            focus: vi.fn()
        };
        const event = harness.tableElement.dispatch({ target: {
            closest: selector => selector === '.tabulator-cell' ? calculationCell : null
        } }, 'mousedown');

        expect(event.preventDefault).toHaveBeenCalledOnce();
        expect(harness.table.getRow).not.toHaveBeenCalledWith(calculationRow);
    });

    test.each([
        ['Tab', false],
        ['Shift+Tab', true]
    ])('%s moves from a focused large-text cell without opening it', (_label, shiftKey) => {
        const previous = createCandidate({ field: 'previous' });
        const notes = createCandidate({ focusOnly: true, field: 'notes' });
        const next = createCandidate({ field: 'next' });
        const cells = [previous, notes, next];
        const harness = createHarness({ cells });
        globalThis.document.activeElement = notes.getElement();
        const event = harness.tableElement.dispatch({
            key: 'Tab',
            shiftKey,
            target: notes.getElement()
        });

        expect(event.preventDefault).toHaveBeenCalledOnce();
        expect(notes.edit).not.toHaveBeenCalled();
        expect(shiftKey ? previous.edit : next.edit).toHaveBeenCalledOnce();
    });

    test('Shift+Tab focuses a large-text destination without opening its editor', () => {
        const previous = createCandidate({ field: 'previous' });
        const notes = createCandidate({ focusOnly: true, field: 'notes' });
        const next = createCandidate({ field: 'next' });
        const harness = createHarness({ cells: [previous, notes, next] });
        globalThis.document.activeElement = next.getElement();

        const event = harness.tableElement.dispatch({
            key: 'Tab',
            shiftKey: true,
            target: next.getElement()
        });

        expect(event.preventDefault).toHaveBeenCalledOnce();
        expect(notes.getElement().focus).toHaveBeenCalledOnce();
        expect(notes.edit).not.toHaveBeenCalled();
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

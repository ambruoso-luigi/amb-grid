import { afterEach, describe, expect, test, vi } from 'vitest';
import { createInventoryTutorial, inventoryTutorialSteps } from '../src/demo/components/js-inventory-tutorial.js';
import { fakeApi } from '../demo/fake-backend/fake-api.js';

class ElementMock extends EventTarget {
    constructor(tag = 'div') { super(); this.tagName = tag; this.children = []; this.attributes = new Map(); this.textContent = ''; this.style = {}; }
    append(...children) { children.forEach(child => { child.parentNode = this; this.children.push(child); }); }
    replaceChildren(...children) { this.children = []; this.append(...children); }
    setAttribute(key, value) { this.attributes.set(key, value); }
    getAttribute(key) { return this.attributes.get(key); }
    remove() { this.parentNode.children = this.parentNode.children.filter(child => child !== this); }
    focus() { document.activeElement = this; }
    querySelector() { return null; }
}

afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

const predicate = (step, index = 0) => inventoryTutorialSteps.find(item => item.id === step).actions[index].isComplete;

describe('inventory tutorial action conditions', () => {
    test('defines nine steps without pagination and checks the specified Tab cells', () => {
        expect(inventoryTutorialSteps.map(step => step.id)).toEqual(['arrows', 'enter', 'tab', 'escape', 'direct-lookup', 'dialog-lookup', 'mouse', 'add', 'partial-save']);
        const cell = {};
        expect(predicate('arrows')({ from: cell, to: cell })).toBe(false);
        expect(predicate('arrows')({ from: cell, to: {} })).toBe(true);
        expect(predicate('tab', 0)({ from: 'stockQuantity', to: 'unitPrice', editing: true, committed: true, changed: false })).toBe(false);
        expect(predicate('tab', 0)({ from: 'stockQuantity', to: 'unitPrice', editing: true, committed: true, changed: true })).toBe(true);
        expect(predicate('tab', 1)({ from: 'unitPrice', to: 'notes', editing: true })).toBe(false);
        expect(predicate('tab', 1)({ from: 'unitPrice', to: 'stockQuantity', editing: true })).toBe(true);
    });

    test('requires an unchanged value after a real cancellation', () => {
        const prepare = predicate('escape');
        expect(prepare({ before: 'A', temporary: 'A', text: true, openedBy: 'Enter' })).toBe(false);
        expect(prepare({ before: 'A', temporary: 'B', text: true, openedBy: 'Enter' })).toBe(true);
        const cancel = predicate('escape', 1);
        expect(cancel({ before: 'A', temporary: 'B', after: 'B', closed: true })).toBe(false);
        expect(cancel({ before: 'A', temporary: 'B', after: 'A', closed: true })).toBe(true);
    });

    test('requires F2, a search, and an applied valid selection', () => {
        expect(predicate('dialog-lookup')({ opened: true, key: 'Enter' })).toBe(false);
        expect(predicate('dialog-lookup')({ opened: true, key: 'F2' })).toBe(true);
        expect(predicate('dialog-lookup', 1)({ searched: false })).toBe(false);
        expect(predicate('dialog-lookup', 2)({ selected: true, applied: false, valid: true })).toBe(false);
        expect(predicate('dialog-lookup', 2)({ selected: true, applied: true, valid: true })).toBe(true);
    });

    test('requires a real new row with a generated code', () => {
        const add = predicate('add');
        expect(add({ present: true, state: 'new', code: 'invalid' })).toBe(false);
        expect(add({ present: true, state: 'new', code: 'PRD-X00A' })).toBe(true);
    });

    test('requires confirmation, successful saving and remaining invalid rows', () => {
        const save = predicate('partial-save', 1);
        expect(save({ confirmed: false, ok: true, saved: 1, pendingInvalid: 1 })).toBe(false);
        expect(save({ confirmed: true, ok: true, saved: 1, pendingInvalid: 0 })).toBe(false);
        expect(save({ confirmed: true, ok: true, saved: 1, pendingInvalid: 1 })).toBe(true);
    });
});

test('starts closed, opens explicitly, and removes listeners without changing data', async () => {
    const win = new EventTarget();
    const doc = Object.assign(new EventTarget(), {
        createElement: tag => new ElementMock(tag),
        createTextNode: text => Object.assign(new ElementMock('#text'), { textContent: text }),
        documentElement: { lang: 'en' }, activeElement: null
    });
    vi.stubGlobal('window', win);
    vi.stubGlobal('document', doc);
    const host = new ElementMock();
    const launch = new ElementMock('button');
    const label = new ElementMock('span');
    launch.querySelector = () => label;
    const root = new ElementMock();
    const app = new ElementMock();
    app.querySelector = () => root;
    const on = vi.fn();
    const off = vi.fn();
    const data = [{ id: 1, productName: 'kept' }];
    const demo = { table: { on, off }, getData: () => data };
    const originalOpen = vi.fn();
    const statusDialog = { open: originalOpen };
    const resetData = vi.fn(async () => true);
    const controller = createInventoryTutorial({ host, launch, app, demo, statusDialog, statusOptions: [], locale: 'en', resetData, hasPendingChanges: () => false });
    expect(host.children[0].hidden).toBe(true);
    expect(controller.capture()).toBeNull();
    launch.dispatchEvent(new Event('click'));
    await vi.waitFor(() => expect(controller.capture()?.stepId).toBe('arrows'));
    expect(host.children[0].hidden).toBe(false);
    expect(controller.capture().stepId).toBe('arrows');
    const find = (element, action) => element.getAttribute?.('data-tutorial-action') === action
        ? element : element.children?.map(child => find(child, action)).find(Boolean);
    doc.documentElement.lang = 'it';
    win.dispatchEvent(new Event('amb-demo-language-change'));
    expect(controller.capture().stepId).toBe('arrows');
    find(host.children[0], 'restart').dispatchEvent(new Event('click'));
    await vi.waitFor(() => expect(resetData).toHaveBeenCalledTimes(2));
    await vi.waitFor(() => expect(controller.capture()?.stepId).toBe('arrows'));
    expect(controller.capture().stepId).toBe('arrows');
    find(host.children[0], 'skip').dispatchEvent(new Event('click'));
    await vi.waitFor(() => expect(resetData).toHaveBeenCalledTimes(3));
    expect(host.children[0].hidden).toBe(true);
    expect(data).toEqual([{ id: 1, productName: 'kept' }]);
    controller.destroy();
    expect(host.children).toHaveLength(0);
    expect(off).toHaveBeenCalledTimes(on.mock.calls.length);
    expect(statusDialog.open).toBe(originalOpen);
    expect(data).toEqual([{ id: 1, productName: 'kept' }]);
});

test('restores the original backend products after a save', async () => {
    const original = await fakeApi.resetDemoProducts();
    const changed = { ...original[0], productName: 'Changed for tutorial' };
    expect((await fakeApi.saveProductChanges({ changes: { updated: [{ after: changed }] } })).ok).toBe(true);
    expect((await fakeApi.getProducts())[0].productName).toBe(changed.productName);
    expect(await fakeApi.resetDemoProducts()).toEqual(original);
    expect(original).toHaveLength(101);
});

test('does not reset or start when the user declines to discard existing changes', async () => {
    const doc = Object.assign(new EventTarget(), {
        createElement: tag => new ElementMock(tag),
        createTextNode: text => Object.assign(new ElementMock('#text'), { textContent: text }),
        documentElement: { lang: 'en' }, activeElement: null
    });
    vi.stubGlobal('window', new EventTarget());
    vi.stubGlobal('document', doc);
    const host = new ElementMock();
    const launch = new ElementMock('button');
    const label = new ElementMock('span');
    launch.querySelector = () => label;
    const app = new ElementMock();
    app.querySelector = () => new ElementMock();
    const resetData = vi.fn(async () => true);
    const confirmStart = vi.fn(async () => false);
    const data = [{ productName: 'unsaved' }];
    const controller = createInventoryTutorial({
        host, launch, app, demo: { table: { on: vi.fn(), off: vi.fn() }, getData: () => data },
        statusDialog: { open: vi.fn() }, statusOptions: [], locale: 'en',
        resetData, hasPendingChanges: () => true, confirmStart
    });
    launch.dispatchEvent(new Event('click'));
    await vi.waitFor(() => expect(confirmStart).toHaveBeenCalledTimes(1));
    await Promise.resolve();
    expect(resetData).not.toHaveBeenCalled();
    expect(controller.capture()).toBeNull();
    expect(data[0].productName).toBe('unsaved');
    controller.destroy();
});

test('finish and open-guide wait for one reset each without repeating it on close', async () => {
    vi.resetModules();
    let options;
    const controllerMock = { capture: vi.fn(), destroy: vi.fn(), reopen: vi.fn(), restart: vi.fn() };
    vi.doMock('../src/demo/components/demo-action-tutorial.js', () => ({
        createDemoActionTutorial: config => {
            options = config;
            config.onStateChange({ hidden: true, resetting: false, destroyed: false });
            return controllerMock;
        }
    }));
    try {
        const { createInventoryTutorial: createWithMock } = await import('../src/demo/components/js-inventory-tutorial.js');
        const doc = Object.assign(new EventTarget(), {
            createElement: tag => new ElementMock(tag), documentElement: { lang: 'en' }, activeElement: null
        });
        vi.stubGlobal('window', new EventTarget());
        vi.stubGlobal('document', doc);
        const host = new ElementMock();
        const launch = new ElementMock('button');
        launch.querySelector = () => new ElementMock('span');
        const app = new ElementMock();
        app.querySelector = () => new ElementMock();
        const summary = new ElementMock('summary');
        const technicalGuide = { open: false, querySelector: () => summary };
        const resetData = vi.fn(async () => true);
        const instance = createWithMock({
            host, launch, app, demo: { table: { on: vi.fn(), off: vi.fn() } },
            statusDialog: { open: vi.fn() }, statusOptions: [], technicalGuide, locale: 'en', resetData
        });
        for (const openGuide of [false, true]) {
            options.onStateChange({ hidden: false, resetting: false, destroyed: false });
            expect(await options.onCompleteAction()).toBe(true);
            options.onStateChange({ hidden: true, resetting: false, destroyed: false });
            options.onCompleteSuccess({ openGuide });
        }
        expect(resetData).toHaveBeenCalledTimes(2);
        expect(technicalGuide.open).toBe(true);
        instance.destroy();
    } finally {
        vi.doUnmock('../src/demo/components/demo-action-tutorial.js');
    }
});

test.each(['navigation', 'editing', 'navigation-same'])('recognizes asynchronous F2 from %s and requires a searched, applied result', async mode => {
    vi.resetModules();
    let config;
    let index = 0;
    let stepId = 'dialog-lookup';
    const context = () => ({ generation: 1, stepId, actionIndex: index });
    const tutorial = {
        capture: context,
        notify(id, payload, captured) {
            if (captured?.generation !== 1 || captured.stepId !== stepId || captured.actionIndex !== index) return false;
            const step = config.steps.find(item => item.id === stepId);
            const action = step.actions[index];
            if (action.actionId !== id || !action.isComplete(payload)) return false;
            index += 1;
            if (index === step.actions.length) { stepId = 'mouse'; index = 0; }
            config.onStateChange({ hidden: false, stepId, actionIndex: index, resetting: false });
            return true;
        },
        destroy: vi.fn(), reopen: vi.fn(), restart: vi.fn()
    };
    vi.doMock('../src/demo/components/demo-action-tutorial.js', () => ({
        createDemoActionTutorial: options => { config = options; options.onStateChange({ hidden: false, stepId, actionIndex: index }); return tutorial; }
    }));
    try {
        const { createInventoryTutorial: createWithMock } = await import('../src/demo/components/js-inventory-tutorial.js');
        const doc = Object.assign(new EventTarget(), { createElement: tag => new ElementMock(tag), documentElement: { lang: 'en' }, body: new ElementMock('body') });
        vi.stubGlobal('document', doc);
        vi.stubGlobal('window', new EventTarget());
        const observers = [];
        if (mode === 'navigation-same') vi.stubGlobal('MutationObserver', class {
            constructor(callback) { this.callback = callback; observers.push(this); }
            observe() {}
            disconnect() {}
        });
        const host = new ElementMock();
        const launch = new ElementMock('button');
        launch.querySelector = () => new ElementMock('span');
        const app = new ElementMock();
        const root = new ElementMock();
        root.contains = () => true;
        app.querySelector = () => root;
        const handlers = new Map();
        const demo = { table: { on: (name, fn) => handlers.set(name, fn), off: vi.fn() }, getStateReport: () => ({ rows: [] }) };
        let resolveSelection;
        const overlay = { hidden: false, isConnected: true, getClientRects: () => [1], contains: () => true, querySelector: () => null };
        const statusDialog = { open: () => { statusDialog.overlay = overlay; return new Promise(resolve => { resolveSelection = resolve; }); } };
        const instance = createWithMock({ host, launch, app, demo, statusDialog, statusOptions: ['A085', 'AB03'], locale: 'en', resetData: async () => true });
        const element = { isConnected: false, contains: () => false, getAttribute: () => 'status', closest: selector => selector === '.tabulator-cell' ? element : null, classList: { contains: () => mode === 'editing' } };
        let value = 'AB03';
        const cell = { getElement: () => element, getField: () => 'status', getValue: () => value, getRow: () => ({ getData: () => ({ id: 1 }) }) };
        const key = new Event('keydown');
        Object.defineProperties(key, { key: { value: 'F2' }, target: { value: element } });
        if (mode === 'editing') handlers.get('cellEditing')(cell);
        app.dispatchEvent(key);
        config.onStateChange({ hidden: true, stepId, actionIndex: index });
        await Promise.resolve();
        config.onStateChange({ hidden: false, stepId, actionIndex: index });
        if (mode === 'editing') handlers.get('cellEditing')(cell);
        const withoutF2 = statusDialog.open();
        expect(index).toBe(0);
        resolveSelection(null);
        await withoutF2;
        app.dispatchEvent(key);
        expect(index).toBe(0);
        if (mode !== 'editing') handlers.get('cellEditing')(cell);
        overlay.hidden = true;
        const invisible = statusDialog.open();
        expect(index).toBe(0);
        resolveSelection(null);
        await invisible;
        overlay.hidden = false;
        app.dispatchEvent(key);
        const pending = statusDialog.open();
        expect(index).toBe(1);
        const selectedCode = mode === 'navigation-same' ? 'AB03' : 'A085';
        const search = { value: selectedCode, matches: () => true };
        const input = new Event('input');
        Object.defineProperty(input, 'target', { value: search });
        doc.dispatchEvent(input);
        expect(index).toBe(2);
        resolveSelection(null);
        await pending;
        expect(stepId).toBe('dialog-lookup');
        expect(index).toBe(2);
        app.dispatchEvent(key);
        const retried = statusDialog.open();
        doc.dispatchEvent(input);
        resolveSelection({ id: selectedCode });
        await retried;
        value = selectedCode;
        if (mode === 'navigation-same') observers[observers.length - 1].callback();
        else handlers.get('cellEdited')(cell);
        expect(stepId).toBe('mouse');
        instance.destroy();
    } finally {
        vi.doUnmock('../src/demo/components/demo-action-tutorial.js');
    }
});

test('moves the shared highlights with tutorial state and clears them on close', async () => {
    vi.resetModules();
    let config;
    const tutorial = { capture: () => null, notify: () => false, destroy: vi.fn(), reopen: vi.fn(), restart: vi.fn() };
    vi.doMock('../src/demo/components/demo-action-tutorial.js', () => ({
        createDemoActionTutorial: options => { config = options; options.onStateChange({ hidden: true }); return tutorial; }
    }));
    try {
        const { createInventoryTutorial: createWithMock } = await import('../src/demo/components/js-inventory-tutorial.js');
        const doc = Object.assign(new EventTarget(), { createElement: tag => new ElementMock(tag), documentElement: { lang: 'en' }, body: new ElementMock('body') });
        vi.stubGlobal('document', doc);
        vi.stubGlobal('window', new EventTarget());
        const target = (tagName = 'DIV') => {
            const classes = new Set();
            return { tagName, isConnected: true, getClientRects: () => [1], getBoundingClientRect: () => ({ left: 0, top: 0, width: 20, height: 20 }), closest: () => null,
                classList: { add: (...names) => names.forEach(name => classes.add(name)), remove: (...names) => names.forEach(name => classes.delete(name)), contains: name => classes.has(name) } };
        };
        const cells = Object.fromEntries(['productName', 'stockQuantity', 'unitPrice', 'status'].map(field => [field, target()]));
        const add = target('BUTTON');
        const save = target('BUTTON');
        const search = target('INPUT');
        const result = target('TR');
        const confirm = target('BUTTON');
        const root = new ElementMock();
        root.querySelectorAll = selector => [cells[selector.match(/tabulator-field="([^"]+)/)?.[1]]].filter(Boolean);
        const app = new ElementMock();
        app.querySelector = selector => selector === '#inventory-table' ? root : selector === '[data-action="add"]' ? add : selector === '[data-action="save"]' ? save : null;
        const host = new ElementMock();
        const launch = new ElementMock('button');
        launch.querySelector = () => new ElementMock('span');
        const dialog = { open: vi.fn(), overlay: { querySelector: selector => selector.includes('__search') ? search : result } };
        const instance = createWithMock({ host, launch, app, demo: { table: { on: vi.fn(), off: vi.fn() } }, statusDialog: dialog, statusOptions: [], locale: 'en', resetData: async () => true });
        const hasHighlight = element => element.classList.contains('demo-crud-tutorial-target');
        for (const [stepId, actionIndex, expected] of [
            ['arrows', 0, cells.productName], ['enter', 0, cells.productName],
            ['tab', 0, cells.stockQuantity], ['tab', 1, cells.unitPrice],
            ['escape', 0, cells.productName], ['escape', 1, null],
            ['direct-lookup', 0, cells.status], ['dialog-lookup', 0, cells.status],
            ['dialog-lookup', 1, search], ['dialog-lookup', 2, result],
            ['mouse', 0, cells.productName], ['add', 0, add], ['partial-save', 0, save]
        ]) {
            config.onStateChange({ hidden: false, stepId, actionIndex });
            for (const element of [...Object.values(cells), add, save, search, result]) expect(hasHighlight(element)).toBe(element === expected);
        }
        config.onStateChange({ hidden: false, stepId: 'partial-save', actionIndex: 1 });
        instance.partialOpened({ hasValidChanges: true, hasInvalidChanges: true }, {}, true, confirm);
        expect(hasHighlight(confirm)).toBe(true);
        config.onStateChange({ hidden: true, stepId: 'partial-save', actionIndex: 1, destroyed: true });
        expect(hasHighlight(confirm)).toBe(false);
        instance.destroy();
    } finally {
        vi.doUnmock('../src/demo/components/demo-action-tutorial.js');
    }
});

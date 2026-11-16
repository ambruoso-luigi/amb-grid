import { afterEach, describe, expect, test, vi } from 'vitest';
import { createInventoryTutorial, inventoryTutorialSteps } from '../src/demo/components/js-inventory-tutorial.js';
import { fakeApi } from '../demo/fake-backend/fake-api.js';

class ElementMock extends EventTarget {
    constructor(tag = 'div') { super(); this.tagName = tag; this.children = []; this.attributes = new Map(); this.textContent = ''; }
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

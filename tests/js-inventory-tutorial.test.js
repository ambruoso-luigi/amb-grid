import { afterEach, describe, expect, test, vi } from 'vitest';
import { createInventoryTutorial, inventoryTutorialSteps } from '../src/demo/components/js-inventory-tutorial.js';
import { fakeApi } from '../demo/fake-backend/fake-api.js';
import { publicExampleTranslations } from '../src/demo/example-copy.js';

class ElementMock extends EventTarget {
    constructor(tag = 'div') { super(); this.tagName = tag; this.children = []; this.attributes = new Map(); this.textContent = ''; this.style = {}; }
    append(...children) { children.forEach(child => { child.parentNode = this; this.children.push(child); }); }
    replaceChildren(...children) { this.children = []; this.append(...children); }
    setAttribute(key, value) { this.attributes.set(key, value); }
    getAttribute(key) { return this.attributes.get(key); }
    removeAttribute(key) { this.attributes.delete(key); }
    remove() { this.parentNode.children = this.parentNode.children.filter(child => child !== this); }
    focus() { document.activeElement = this; }
    querySelector() { return null; }
}

afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

const predicate = (step, index = 0) => inventoryTutorialSteps.find(item => item.id === step).actions[index].isComplete;

describe('inventory tutorial action conditions', () => {
    test.each(['it', 'en'])('provides the four step instructions in %s', language => {
        for (const key of ['arrows', 'enter', 'tabForward', 'escapePrepare', 'escapeCancel', 'pageNext', 'pagePrevious', 'pageUnavailable', 'pageSingle', 'direct', 'dialogOpen', 'dialogSearch', 'dialogSelect', 'dateOpen', 'dateMove', 'dateSelect', 'dateCommit', 'notesOpen', 'notesInput', 'notesSave']) {
            expect(publicExampleTranslations[language][`examples.javascriptInventory.${key}`]).toBeTruthy();
        }
    });
    test.each(['it', 'en'])('provides completion and command guide text in %s', language => {
        const copy = publicExampleTranslations[language];
        for (const key of ['tutorialCompleted', 'tutorialCompleteTitle', 'tutorialFinish', 'tutorialOpenGuide', 'partialSummary']) {
            expect(copy[`examples.javascriptInventory.${key}`]).toBeTruthy();
        }
        expect(copy['examples.javascriptInventory.partialSummary']).toContain('{saved}');
        expect(copy['examples.javascriptInventory.partialSummary']).toContain('{pending}');
        expect(copy['examples.javascriptInventory.tutorialOpenGuide']).not.toMatch(/tecnica|technical/i);
        const completion = copy['examples.javascriptInventory.tutorialCompleted'];
        expect(completion).toContain(language === 'it' ? 'Fine' : 'Finish');
        expect(completion).toContain(language === 'it' ? 'Apri guida comandi' : 'Open command guide');
        expect(completion).toMatch(language === 'it' ? /ripristinare.*conservare/ : /restore.*keep/);
    });
    test('defines nine steps and requires observed navigation and edits', () => {
        expect(inventoryTutorialSteps.map(step => step.id)).toEqual(['keyboard-edit', 'tab', 'escape', 'pages', 'direct-lookup', 'dialog-lookup', 'date-picker', 'notes', 'add', 'partial-save']);
        const from = {}, to = {};
        expect(predicate('keyboard-edit')({ from, to, firstRow: false, field: 'stockQuantity' })).toBe(false);
        expect(predicate('keyboard-edit')({ from, to, firstRow: true, field: 'stockQuantity' })).toBe(true);
        const edit = { field: 'stockQuantity', sameRow: true, openedBy: 'Enter', confirmed: true, typed: true, before: 2, after: 3, committed: true, changedRow: true };
        expect(predicate('keyboard-edit', 1)({ ...edit, confirmed: false })).toBe(false);
        expect(predicate('keyboard-edit', 1)({ ...edit, after: 3.5 })).toBe(false);
        expect(predicate('keyboard-edit', 1)({ ...edit, after: -1 })).toBe(false);
        expect(predicate('keyboard-edit', 1)(edit)).toBe(true);
        const tab = { from: 'stockQuantity', to: 'unitPrice', openedBy: 'Enter', sameRow: true, editing: true, committed: true, changed: true, valid: true };
        expect(predicate('tab')({ ...tab, editing: false })).toBe(false);
        expect(predicate('tab')(tab)).toBe(true);
    });

    test('requires a changed temporary price and a real cancellation', () => {
        expect(predicate('escape')({ before: 10, temporary: '10.00', field: 'unitPrice', continued: true })).toBe(false);
        expect(predicate('escape')({ before: 10, temporary: '12', field: 'unitPrice', continued: false })).toBe(false);
        expect(predicate('escape')({ before: 10, temporary: '12', field: 'unitPrice', continued: true })).toBe(true);
        const cancel = { before: 10, temporary: '12', after: 10, field: 'unitPrice', continued: true, closed: true, cancelled: true };
        expect(predicate('escape', 1)({ ...cancel, closed: false })).toBe(false);
        expect(predicate('escape', 1)(cancel)).toBe(true);
    });

    test('requires rendered page transitions and return to the starting page', () => {
        expect(predicate('pages')({ shortcut: true, rendered: false, before: 3, after: 4 })).toBe(false);
        expect(predicate('pages')({ shortcut: true, rendered: true, before: 3, after: 4 })).toBe(true);
        expect(predicate('pages', 1)({ shortcut: true, rendered: true, before: 4, after: 2, original: 3 })).toBe(false);
        expect(predicate('pages', 1)({ shortcut: true, rendered: true, before: 4, after: 3, original: 3 })).toBe(true);
    });

    test('requires F2, a search, and an applied valid selection', () => {
        expect(predicate('dialog-lookup')({ opened: true, key: 'Enter' })).toBe(false);
        expect(predicate('dialog-lookup')({ opened: true, key: 'F2', differentRow: false })).toBe(true);
        expect(predicate('dialog-lookup')({ opened: false, key: 'F2' })).toBe(false);
        expect(predicate('dialog-lookup')({ opened: true, key: 'F2', differentRow: true })).toBe(true);
        expect(predicate('dialog-lookup', 1)({ searched: false })).toBe(false);
        expect(predicate('dialog-lookup', 2)({ selected: true, applied: false, valid: true })).toBe(false);
        expect(predicate('dialog-lookup', 2)({ selected: true, applied: true, valid: true })).toBe(true);
    });

    test('describes autocomplete in both languages and accepts only a changed direct valid code', async () => {
        for (const locale of ['it', 'en']) {
            const instruction = publicExampleTranslations[locale]['examples.javascriptInventory.direct'];
            expect(instruction).toContain('[[E]]');
            expect(instruction).toMatch(/completamento automatico|autocomplete/i);
        }
        expect((await fakeApi.getStatuses()).some(option => option.id.startsWith('E'))).toBe(true);
        const direct = { existing: true, openedBy: 'Enter', typed: true, dialog: false, valid: true, before: 'A001', after: 'E220', committed: true };
        expect(predicate('direct-lookup')({ ...direct, after: direct.before })).toBe(false);
        expect(predicate('direct-lookup')({ ...direct, dialog: true })).toBe(false);
        expect(predicate('direct-lookup')({ ...direct, valid: false })).toBe(false);
        expect(predicate('direct-lookup')(direct)).toBe(true);
    });

    test('requires committed calendar and Notes changes', () => {
        expect(predicate('date-picker')({ opened: false, f2: true, cell: true })).toBe(false);
        expect(predicate('date-picker', 1)({ opened: true, moved: false })).toBe(false);
        expect(predicate('date-picker', 2)({ selected: true, closed: false, valid: true, before: '10/04/2025', after: '11/04/2025' })).toBe(false);
        expect(predicate('date-picker', 2)({ selected: true, closed: true, valid: true, before: '10/04/2025', after: '11/04/2025' })).toBe(true);
        expect(predicate('date-picker', 3)({ selected: true, valid: true, before: '10/04/2025', after: '11/04/2025', committed: false, applied: true })).toBe(false);
        expect(predicate('notes')({ doubleClick: false, opened: true, textarea: true })).toBe(false);
        expect(predicate('notes', 1)({ text: '  ', before: '' })).toBe(false);
        expect(predicate('notes', 2)({ saved: false, closed: true, applied: true, before: 'a', after: 'b', committed: true })).toBe(false);
    });

    test('requires a real new row with a generated code', () => {
        const add = predicate('add');
        expect(add({ present: true, ready: true, state: 'new', code: 'invalid' })).toBe(false);
        expect(add({ present: true, ready: false, state: 'new', code: 'PRD-X00A' })).toBe(false);
        expect(add({ present: true, ready: true, state: 'new', code: 'PRD-X00A' })).toBe(true);
    });

    test('requires confirmation, successful saving and remaining invalid rows', () => {
        const save = predicate('partial-save', 1);
        expect(save({ confirmed: false, ok: true, saved: 1, pendingInvalid: 1 })).toBe(false);
        expect(save({ confirmed: true, ok: true, prepared: true, backendSaved: 1, saved: 1, pendingInvalid: 0 })).toBe(false);
        expect(save({ confirmed: true, ok: true, prepared: false, backendSaved: 1, saved: 1, pendingInvalid: 1 })).toBe(false);
        expect(save({ confirmed: true, ok: true, prepared: true, backendSaved: 1, saved: 1, pendingInvalid: 1 })).toBe(true);
    });
});

test('tracks the keyboard workflow through real controller events and action contexts', async () => {
    const doc = Object.assign(new EventTarget(), {
        createElement: tag => new ElementMock(tag),
        createTextNode: text => Object.assign(new ElementMock('#text'), { textContent: text }),
        documentElement: { lang: 'en' }, activeElement: null
    });
    vi.stubGlobal('document', doc);
    vi.stubGlobal('window', new EventTarget());
    const host = new ElementMock();
    const launch = new ElementMock('button');
    launch.querySelector = () => new ElementMock('span');
    const root = new ElementMock();
    const app = new ElementMock();
    app.querySelector = () => root;
    root.contains = () => true;
    const rowElement = { isConnected: true, getClientRects: () => [1], closest: () => null, querySelector: () => null };
    root.querySelectorAll = selector => selector === '.tabulator-row' ? [rowElement] : [];
    const values = { id: 7, productName: 'Item', stockQuantity: 5, unitPrice: 12 };
    const row = { getData: () => values };
    const makeCell = field => {
        const classes = new Set();
        const element = { isConnected: false, getAttribute: () => field,
            closest: selector => selector === '.tabulator-cell' ? element : selector === '.tabulator-row' ? rowElement : null,
            contains: target => target === element || target?.cellElement === element,
            classList: { contains: name => classes.has(name), add: name => classes.add(name), remove: name => classes.delete(name) } };
        const input = { cellElement: element, value: '', closest: () => element };
        return { element, input, classes, cell: { getElement: () => element, getField: () => field, getRow: () => row, getValue: () => values[field] } };
    };
    const name = makeCell('productName');
    const stock = makeCell('stockQuantity');
    const price = makeCell('unitPrice');
    const handlers = new Map();
    let page = 3;
    const demo = { table: { on: (event, fn) => handlers.set(event, fn), off: vi.fn(), getPage: () => page, getPageMax: () => 5 },
        getStateReport: () => ({ rows: [{ id: 7, hasChanges: true }] }) };
    let dirty = false;
    const resetData = vi.fn(async () => true);
    const confirmRestart = vi.fn(async () => false);
    const instance = createInventoryTutorial({ host, launch, app, demo, statusDialog: { open: vi.fn() }, statusOptions: [], locale: 'en', resetData, hasPendingChanges: () => dirty, confirmRestart });
    launch.dispatchEvent(new Event('click'));
    await vi.waitFor(() => expect(instance.capture()?.stepId).toBe('keyboard-edit'));
    const send = (target, type, subject, properties = {}) => {
        const event = new Event(type);
        Object.defineProperty(event, 'target', { value: subject });
        for (const [key, value] of Object.entries(properties)) Object.defineProperty(event, key, { value });
        target.dispatchEvent(event);
    };
    const key = (subject, value, extra = {}) => send(app, 'keydown', subject, { key: value, ...extra });
    const focus = subject => send(app, 'focusin', subject);
    const input = (entry, value) => { entry.input.value = value; send(doc, 'input', entry.input); };
    const open = entry => { entry.classes.add('tabulator-editing'); handlers.get('cellEditing')(entry.cell); };
    const commit = (entry, value) => { values[entry.cell.getField()] = value; entry.classes.delete('tabulator-editing'); handlers.get('cellEdited')(entry.cell); };

    send(app, 'pointerdown', stock.element);
    focus(stock.element);
    expect(instance.capture().actionIndex).toBe(0);
    key(name.element, 'ArrowRight');
    expect(instance.capture().actionIndex).toBe(0);
    focus(stock.element);
    expect(instance.capture().actionIndex).toBe(1);
    dirty = true;
    const progress = instance.capture();
    const findAction = (element, action) => element.getAttribute?.('data-tutorial-action') === action
        ? element : element.children?.map(child => findAction(child, action)).find(Boolean);
    findAction(host, 'restart').dispatchEvent(new Event('click'));
    await vi.waitFor(() => expect(confirmRestart).toHaveBeenCalledTimes(1));
    await vi.waitFor(() => expect(instance.capture()).toEqual(progress));
    expect(resetData).toHaveBeenCalledTimes(1);
    key(stock.element, 'Enter');
    open(stock);
    input(stock, '6');
    key(stock.input, 'Enter');
    expect(instance.capture().stepId).toBe('keyboard-edit');
    commit(stock, 6);
    expect(instance.capture().stepId).toBe('tab');

    key(stock.element, 'Enter');
    open(stock);
    input(stock, '8');
    key(stock.input, 'Tab');
    expect(instance.capture().stepId).toBe('tab');
    commit(stock, 8);
    focus(price.element);
    expect(instance.capture().stepId).toBe('tab');
    open(price);
    expect(instance.capture().stepId).toBe('escape');
    expect(price.classes.has('tabulator-editing')).toBe(true);
    input(price, '19');
    expect(instance.capture().actionIndex).toBe(1);
    const beforeClose = instance.capture();
    findAction(host, 'skip').dispatchEvent(new Event('click'));
    expect(instance.capture()).toBeNull();
    expect(values.stockQuantity).toBe(8);
    launch.dispatchEvent(new Event('click'));
    await vi.waitFor(() => expect(instance.capture()?.stepId).toBe('escape'));
    expect(instance.capture().actionIndex).toBe(1);
    expect(instance.capture().generation).not.toBe(beforeClose.generation);
    key(price.input, 'Escape');
    expect(instance.capture().stepId).toBe('escape');
    price.classes.delete('tabulator-editing');
    handlers.get('cellEditCancelled')(price.cell);
    expect(instance.capture().stepId).toBe('pages');
    expect(values.stockQuantity).toBe(8);
    expect(values.unitPrice).toBe(12);

    key(name.element, 'PageDown', { altKey: true });
    expect(instance.capture().actionIndex).toBe(0);
    page = 4;
    handlers.get('renderComplete')();
    expect(instance.capture().actionIndex).toBe(0);
    focus(name.element);
    expect(instance.capture().actionIndex).toBe(1);
    key(name.element, 'PageUp', { altKey: true });
    expect(instance.capture().stepId).toBe('pages');
    page = 3;
    handlers.get('renderComplete')();
    focus(name.element);
    expect(instance.capture().stepId).toBe('direct-lookup');
    instance.destroy();
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
    let dirty = false;
    const confirmRestart = vi.fn().mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    const controller = createInventoryTutorial({ host, launch, app, demo, statusDialog, statusOptions: [], locale: 'en', resetData, hasPendingChanges: () => dirty, confirmRestart });
    expect(host.children[0].hidden).toBe(true);
    expect(controller.capture()).toBeNull();
    launch.dispatchEvent(new Event('click'));
    await vi.waitFor(() => expect(controller.capture()?.stepId).toBe('keyboard-edit'));
    expect(host.children[0].hidden).toBe(false);
    expect(controller.capture().stepId).toBe('keyboard-edit');
    const find = (element, action) => element.getAttribute?.('data-tutorial-action') === action
        ? element : element.children?.map(child => find(child, action)).find(Boolean);
    doc.documentElement.lang = 'it';
    win.dispatchEvent(new Event('amb-demo-language-change'));
    expect(controller.capture().stepId).toBe('keyboard-edit');
    dirty = true;
    const beforeRestart = controller.capture();
    find(host.children[0], 'restart').dispatchEvent(new Event('click'));
    await vi.waitFor(() => expect(confirmRestart).toHaveBeenCalledTimes(1));
    await vi.waitFor(() => expect(controller.capture()).toEqual(beforeRestart));
    expect(resetData).toHaveBeenCalledTimes(1);
    find(host.children[0], 'restart').dispatchEvent(new Event('click'));
    await vi.waitFor(() => expect(resetData).toHaveBeenCalledTimes(2));
    await vi.waitFor(() => expect(controller.capture()?.stepId).toBe('keyboard-edit'));
    expect(controller.capture().stepId).toBe('keyboard-edit');
    find(host.children[0], 'skip').dispatchEvent(new Event('click'));
    expect(resetData).toHaveBeenCalledTimes(2);
    expect(host.children[0].hidden).toBe(true);
    expect(label.textContent).toBe('Riprendi tutorial');
    launch.dispatchEvent(new Event('click'));
    await vi.waitFor(() => expect(controller.capture()?.stepId).toBe('keyboard-edit'));
    expect(resetData).toHaveBeenCalledTimes(2);
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

test('only Finish resets data and consumes decorations after a successful reset', async () => {
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
        const onOpenCommandGuide = vi.fn();
        const resetData = vi.fn(async () => { await fakeApi.resetDemoProducts(); return true; });
        const confirmStart = vi.fn(async () => false);
        const confirmRestart = vi.fn(async () => true);
        const originalProducts = await fakeApi.resetDemoProducts();
        const savedProduct = { ...originalProducts[0], productName: 'Saved before finishing' };
        expect((await fakeApi.saveProductChanges({ changes: { updated: [{ after: savedProduct }] } })).ok).toBe(true);
        const pendingRow = { _ambTempId: 'pending-new', productName: '', state: 'new' };
        const instance = createWithMock({
            host, launch, app, demo: { table: { on: vi.fn(), off: vi.fn() }, getData: () => [pendingRow] },
            statusDialog: { open: vi.fn() }, statusOptions: [], onOpenCommandGuide, locale: 'en', resetData,
            hasPendingChanges: () => true, confirmStart, confirmRestart
        });
        options.onStateChange({ hidden: false, resetting: false, destroyed: false });
        expect(await options.onCompleteAction({ openGuide: true })).toBe(true);
        options.onStateChange({ hidden: true, resetting: false, destroyed: false });
        options.onCompleteSuccess({ openGuide: true });
        expect(resetData).not.toHaveBeenCalled();
        expect(onOpenCommandGuide).toHaveBeenCalledTimes(1);
        expect((await fakeApi.getProducts())[0].productName).toBe(savedProduct.productName);
        expect(pendingRow).toMatchObject({ productName: '', state: 'new' });
        expect(launch.getAttribute('data-demo-inventory-finished')).toBe(undefined);
        expect(await options.onBeforeRestart()).toBe(false);
        expect(confirmStart).toHaveBeenCalledTimes(1);
        expect(confirmRestart).not.toHaveBeenCalled();
        resetData.mockResolvedValueOnce(false);
        expect(await options.onCompleteAction({ openGuide: false })).toBe(false);
        expect(launch.getAttribute('data-demo-inventory-finished')).toBe(undefined);
        resetData.mockClear();
        expect(await options.onCompleteAction({ openGuide: false })).toBe(true);
        expect(resetData).toHaveBeenCalledTimes(1);
        options.onStateChange({ hidden: true, resetting: false, destroyed: false });
        options.onCompleteSuccess({ openGuide: false });
        expect(launch.getAttribute('data-demo-inventory-finished')).toBe('true');
        expect((await fakeApi.getProducts())[0].productName).toBe(originalProducts[0].productName);
        instance.destroy();
    } finally {
        vi.doUnmock('../src/demo/components/demo-action-tutorial.js');
    }
});

test.each(['navigation', 'editing', 'navigation-same', 'same-row'])('recognizes asynchronous F2 from %s and requires a searched, applied result', async mode => {
    vi.resetModules();
    let config;
    let index = 0;
    let stepId = 'direct-lookup';
    let generation = 1;
    const context = () => ({ generation, stepId, actionIndex: index });
    const tutorial = {
        capture: context,
        notify(id, payload, captured) {
            if (captured?.generation !== generation || captured.stepId !== stepId || captured.actionIndex !== index) return false;
            const step = config.steps.find(item => item.id === stepId);
            const action = step.actions[index];
            if (action.actionId !== id || !action.isComplete(payload)) return false;
            index += 1;
            if (index === step.actions.length) { stepId = stepId === 'direct-lookup' ? 'dialog-lookup' : 'date-picker'; index = 0; }
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
        vi.stubGlobal('MutationObserver', class {
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
        const directElement = { isConnected: false, contains: () => true, getAttribute: () => 'status', closest: selector => selector === '.tabulator-cell' ? directElement : null, classList: { contains: () => false } };
        let directValue = 'AB03';
        const directCell = { getElement: () => directElement, getField: () => 'status', getValue: () => directValue, getRow: () => ({ getData: () => ({ id: 1 }) }) };
        const directKey = new Event('keydown');
        Object.defineProperties(directKey, { key: { value: 'Enter' }, target: { value: directElement } });
        app.dispatchEvent(directKey);
        handlers.get('cellEditing')(directCell);
        const directInput = new Event('input');
        Object.defineProperty(directInput, 'target', { value: { value: 'A085' } });
        doc.dispatchEvent(directInput);
        directValue = 'A085';
        handlers.get('cellEdited')(directCell);
        expect(stepId).toBe('dialog-lookup');
        const element = { isConnected: false, contains: () => false, getAttribute: () => 'status', closest: selector => selector === '.tabulator-cell' ? element : null, classList: { contains: () => mode === 'editing' } };
        let value = 'AB03';
        const cell = { getElement: () => element, getField: () => 'status', getValue: () => value, getRow: () => ({ getData: () => ({ id: mode === 'same-row' ? 1 : 2 }) }) };
        const key = new Event('keydown');
        Object.defineProperties(key, { key: { value: 'F2' }, target: { value: element } });
        if (mode === 'editing') handlers.get('cellEditing')(cell);
        const withoutF2 = statusDialog.open();
        expect(index).toBe(0);
        resolveSelection(null);
        await withoutF2;
        app.dispatchEvent(key);
        expect(index).toBe(0);
        if (mode !== 'editing') handlers.get('cellEditing')(cell);
        generation += 1;
        const stale = statusDialog.open();
        expect(index).toBe(0);
        resolveSelection(null);
        await stale;
        app.dispatchEvent(key);
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
        overlay.contains = () => false;
        doc.dispatchEvent(input);
        observers[observers.length - 1].callback([{ type: 'childList' }]);
        expect(index).toBe(1);
        overlay.contains = () => true;
        doc.dispatchEvent(input);
        expect(index).toBe(1);
        observers[observers.length - 1].callback([{ type: 'childList' }]);
        expect(index).toBe(2);
        resolveSelection(null);
        await pending;
        expect(stepId).toBe('dialog-lookup');
        expect(index).toBe(2);
        app.dispatchEvent(key);
        const retried = statusDialog.open();
        doc.dispatchEvent(input);
        observers[observers.length - 1].callback([{ type: 'childList' }]);
        resolveSelection({ id: selectedCode });
        await retried;
        value = selectedCode;
        if (mode === 'navigation-same') observers[observers.length - 1].callback([]);
        else handlers.get('cellEdited')(cell);
        expect(stepId).toBe('date-picker');
        instance.destroy();
    } finally {
        vi.doUnmock('../src/demo/components/demo-action-tutorial.js');
    }
});

test('tracks calendar and Notes sessions through their popup and editing events', async () => {
    vi.resetModules();
    let config;
    let stepId = 'date-picker';
    let index = 0;
    let generation = 1;
    const capture = () => ({ generation, stepId, actionIndex: index });
    const tutorial = {
        capture,
        notify(id, payload, context) {
            if (context?.generation !== generation || context.stepId !== stepId || context.actionIndex !== index) return false;
            const step = config.steps.find(item => item.id === stepId);
            const action = step.actions[index];
            if (action.actionId !== id || !action.isComplete(payload)) return false;
            if (++index === step.actions.length) { stepId = stepId === 'date-picker' ? 'notes' : 'add'; index = 0; }
            config.onStateChange({ hidden: false, stepId, actionIndex: index });
            return true;
        },
        destroy: vi.fn(), restart: vi.fn(), reopen: vi.fn()
    };
    vi.doMock('../src/demo/components/demo-action-tutorial.js', () => ({ createDemoActionTutorial: options => { config = options; options.onStateChange({ hidden: false, stepId, actionIndex: index }); return tutorial; } }));
    try {
        const { createInventoryTutorial: createWithMock } = await import('../src/demo/components/js-inventory-tutorial.js');
        let popup = null;
        const doc = Object.assign(new EventTarget(), { createElement: tag => new ElementMock(tag), documentElement: { lang: 'en' }, body: new ElementMock('body'), querySelector: () => popup });
        const addListener = vi.spyOn(doc, 'addEventListener');
        const removeListener = vi.spyOn(doc, 'removeEventListener');
        vi.stubGlobal('document', doc);
        vi.stubGlobal('window', new EventTarget());
        const frames = [];
        vi.stubGlobal('requestAnimationFrame', callback => { frames.push(callback); return frames.length; });
        const app = new ElementMock();
        const root = new ElementMock();
        root.contains = () => true;
        app.querySelector = () => root;
        const host = new ElementMock();
        const launch = new ElementMock('button');
        launch.querySelector = () => new ElementMock('span');
        const handlers = new Map();
        const data = { id: 4, lastCheckDate: '10/04/2025', notes: 'Old' };
        const row = { getData: () => data };
        const anchor = {};
        const manualInput = { value: data.lastCheckDate };
        const makeCell = field => {
            const element = { isConnected: false, getAttribute: () => field, closest: selector => selector === '.tabulator-cell' ? element : null,
                contains: () => false, querySelector: selector => selector === 'input.amb-date-editor' ? manualInput : anchor, classList: { contains: () => false } };
            return { element, cell: { getElement: () => element, getField: () => field, getRow: () => row, getValue: () => data[field] } };
        };
        const dateCell = makeCell('lastCheckDate');
        const notesCell = makeCell('notes');
        const instance = createWithMock({ host, launch, app, demo: { table: { on: (name, fn) => handlers.set(name, fn), off: vi.fn() }, getStateReport: () => ({ rows: [] }) }, statusDialog: { open: vi.fn() }, statusOptions: [], locale: 'en', resetData: async () => true });
        const send = (target, type, subject, props = {}) => {
            const event = new Event(type);
            Object.defineProperty(event, 'target', { value: subject });
            for (const [key, value] of Object.entries(props)) Object.defineProperty(event, key, { value });
            target.dispatchEvent(event);
        };
        let day = '1';
        const classList = { add: vi.fn(), remove: vi.fn(), contains: () => false };
        const pickerClasses = new Set();
        const picker = { isConnected: true, tagName: 'DIV', getClientRects: () => [1], closest: () => null,
            classList: { add: (...names) => names.forEach(name => pickerClasses.add(name)), remove: (...names) => names.forEach(name => pickerClasses.delete(name)), contains: name => pickerClasses.has(name) } };
        const calendarClasses = new Set();
        let pickerAvailable = true;
        const calendar = { isConnected: true, tagName: 'DIV', getClientRects: () => [1], closest: () => null, contains: () => false,
            classList: { add: (...names) => names.forEach(name => calendarClasses.add(name)), remove: (...names) => names.forEach(name => calendarClasses.delete(name)), contains: name => calendarClasses.has(name) },
            querySelector: selector => selector === '.datepicker-picker' ? (pickerAvailable ? picker : null)
                : selector === '.datepicker-cell.day.focused' ? { getAttribute: name => name === 'data-date' ? day : null } : null };
        send(app, 'keydown', dateCell.element, { key: 'F2' });
        expect(index).toBe(0);
        handlers.get('cellEditing')(dateCell.cell);
        popup = calendar;
        await Promise.resolve();
        expect(index).toBe(1);
        expect(pickerClasses.has('demo-crud-tutorial-target')).toBe(true);
        expect(calendarClasses.has('demo-crud-tutorial-target')).toBe(false);
        pickerAvailable = false;
        config.onStateChange({ hidden: false, stepId, actionIndex: index });
        expect(pickerClasses.has('demo-crud-tutorial-target')).toBe(false);
        expect(calendarClasses.has('demo-crud-tutorial-target')).toBe(false);
        pickerAvailable = true;
        config.onStateChange({ hidden: false, stepId, actionIndex: index });
        expect(pickerClasses.has('demo-crud-tutorial-target')).toBe(true);
        send(doc, 'hide', anchor);
        expect(pickerClasses.has('demo-crud-tutorial-target')).toBe(false);
        send(app, 'keydown', dateCell.element, { key: 'F2' });
        await Promise.resolve();
        expect(index).toBe(1);
        expect(pickerClasses.has('demo-crud-tutorial-target')).toBe(true);
        send(doc, 'keydown', dateCell.element, { key: 'ArrowRight' });
        expect(frames).toHaveLength(0);
        send(doc, 'keydown', anchor, { key: 'ArrowRight' });
        expect(index).toBe(1);
        frames.shift()();
        expect(index).toBe(1);
        send(doc, 'keydown', anchor, { key: 'ArrowRight' });
        calendar.isConnected = false;
        day = '2';
        frames.shift()();
        expect(index).toBe(1);
        calendar.isConnected = true;
        send(doc, 'keydown', anchor, { key: 'ArrowRight' });
        config.onStateChange({ hidden: true, stepId, actionIndex: index });
        day = '3';
        frames.shift()();
        expect(index).toBe(1);
        config.onStateChange({ hidden: false, stepId, actionIndex: index });
        send(app, 'keydown', dateCell.element, { key: 'F2' });
        await Promise.resolve();
        send(doc, 'keydown', anchor, { key: 'ArrowRight' });
        generation += 1;
        day = '4';
        frames.shift()();
        expect(index).toBe(1);
        send(doc, 'hide', anchor);
        send(app, 'keydown', dateCell.element, { key: 'F2' });
        await Promise.resolve();
        expect(index).toBe(1);
        send(doc, 'keydown', anchor, { key: 'ArrowRight' });
        expect(index).toBe(1);
        await Promise.resolve();
        expect(index).toBe(1);
        day = '5';
        await Promise.resolve();
        expect(index).toBe(1);
        frames.shift()();
        expect(index).toBe(2);
        send(doc, 'keydown', anchor, { key: 'Enter' });
        expect(index).toBe(2);
        send(doc, 'changeDate', anchor, { detail: { date: new Date(2025, 3, 10) } });
        calendar.isConnected = false;
        send(doc, 'hide', anchor);
        await Promise.resolve();
        expect(index).toBe(2);
        calendar.isConnected = true;
        send(app, 'keydown', dateCell.element, { key: 'F2' });
        await Promise.resolve();
        send(doc, 'keydown', anchor, { key: 'Enter' });
        send(doc, 'changeDate', anchor, { detail: { date: new Date(2025, 3, 11) } });
        expect(stepId).toBe('date-picker');
        await Promise.resolve();
        expect(index).toBe(2);
        manualInput.value = '11/04/2025';
        calendar.isConnected = false;
        send(doc, 'hide', anchor);
        await Promise.resolve();
        expect(index).toBe(3);
        expect(data.lastCheckDate).toBe('10/04/2025');
        data.lastCheckDate = '11/04/2025';
        handlers.get('cellEdited')(dateCell.cell);
        expect(stepId).toBe('notes');
        expect(pickerClasses.has('demo-crud-tutorial-target')).toBe(false);
        expect(calendarClasses.has('demo-crud-tutorial-target')).toBe(false);

        const textarea = { value: 'Old', matches: selector => selector.includes('__textarea') };
        const button = { closest: selector => selector.includes('--primary') ? button : null };
        const dialog = { isConnected: true, tagName: 'DIV', classList, getClientRects: () => [1], closest: () => null,
            contains: target => target === textarea || target === button, querySelector: selector => selector.includes('__textarea') ? textarea : button };
        popup = dialog;
        send(app, 'dblclick', notesCell.element);
        expect(index).toBe(0);
        handlers.get('cellEditing')(notesCell.cell);
        await Promise.resolve();
        expect(index).toBe(1);
        textarea.value = 'Old plus note';
        send(doc, 'input', textarea);
        expect(index).toBe(2);
        handlers.get('cellEditCancelled')(notesCell.cell);
        expect(stepId).toBe('notes');
        send(app, 'dblclick', notesCell.element);
        handlers.get('cellEditing')(notesCell.cell);
        await Promise.resolve();
        send(doc, 'click', button);
        data.notes = textarea.value;
        handlers.get('cellEdited')(notesCell.cell);
        expect(stepId).toBe('notes');
        dialog.isConnected = false;
        await Promise.resolve();
        expect(stepId).toBe('add');
        instance.destroy();
        for (const type of ['input', 'keydown', 'changeDate', 'hide', 'click']) {
            const handler = addListener.mock.calls.find(call => call[0] === type)?.[1];
            expect(removeListener).toHaveBeenCalledWith(type, handler, true);
        }
    } finally { vi.doUnmock('../src/demo/components/demo-action-tutorial.js'); }
});

test('shows the actual save counts only after prepared completion', async () => {
    vi.resetModules();
    let config;
    let complete = false;
    const context = { generation: 3, stepId: 'partial-save', actionIndex: 1 };
    const tutorial = {
        capture: () => complete ? null : context,
        notify(id, payload, captured) {
            if (captured !== context || id !== 'partial-saved' || !config.steps.at(-1).actions[1].isComplete(payload)) return false;
            complete = true;
            config.onStateChange({ hidden: false, complete: true, stepId: null, actionIndex: 0 });
            return true;
        },
        destroy: vi.fn(), restart: vi.fn(), reopen: vi.fn()
    };
    vi.doMock('../src/demo/components/demo-action-tutorial.js', () => ({ createDemoActionTutorial: options => { config = options; options.onStateChange({ hidden: false, stepId: 'partial-save', actionIndex: 1 }); return tutorial; } }));
    try {
        const { createInventoryTutorial: createWithMock } = await import('../src/demo/components/js-inventory-tutorial.js');
        const doc = Object.assign(new EventTarget(), { createElement: tag => new ElementMock(tag), documentElement: { lang: 'en' } });
        vi.stubGlobal('document', doc);
        vi.stubGlobal('window', new EventTarget());
        const host = new ElementMock();
        const launch = new ElementMock('button');
        launch.querySelector = () => new ElementMock('span');
        const app = new ElementMock();
        app.querySelector = () => new ElementMock();
        const instance = createWithMock({ host, launch, app, demo: { table: { on: vi.fn(), off: vi.fn() } }, statusDialog: { open: vi.fn() }, statusOptions: [], resetData: async () => true });
        const result = { ok: true, saved: { inserted: [], updated: [{}, {}], deleted: [] } };
        const saved = { saved: [{}, {}] };
        const report = { invalidChangedRowsCount: 3 };
        expect(instance.partialSaved(context, true, result, saved, report, false)).toBe(false);
        expect(complete).toBe(false);
        expect(instance.partialSaved(context, true, result, saved, report, true)).toBe(true);
        expect(host.children[0].textContent).toBe('Valid changes saved: 2. Rows still needing correction: 3.');
        instance.destroy();
    } finally { vi.doUnmock('../src/demo/components/demo-action-tutorial.js'); }
});

test('suggests stable alternate rows and places lookup search glow inside its modal', async () => {
    vi.resetModules();
    let config;
    let stepId = 'keyboard-edit';
    let index = 1;
    const capture = () => ({ generation: 1, stepId, actionIndex: index });
    const tutorial = { capture, notify(id, payload, context) {
        const action = config.steps.find(step => step.id === stepId).actions[index];
        if (context?.stepId !== stepId || action.actionId !== id || !action.isComplete(payload)) return false;
        stepId = 'dialog-lookup'; index = 0;
        config.onStateChange({ hidden: false, stepId, actionIndex: index });
        return true;
    }, destroy: vi.fn(), restart: vi.fn(), reopen: vi.fn() };
    vi.doMock('../src/demo/components/demo-action-tutorial.js', () => ({ createDemoActionTutorial: options => { config = options; options.onStateChange({ hidden: false, stepId, actionIndex: index }); return tutorial; } }));
    try {
        const { createInventoryTutorial: createWithMock } = await import('../src/demo/components/js-inventory-tutorial.js');
        const doc = Object.assign(new EventTarget(), { createElement: tag => new ElementMock(tag), documentElement: { lang: 'en' }, body: new ElementMock('body') });
        vi.stubGlobal('document', doc);
        vi.stubGlobal('window', new EventTarget());
        const makeTarget = tagName => {
            const classes = new Set();
            return { tagName, isConnected: true, getClientRects: () => [1], getBoundingClientRect: () => ({ left: 10, top: 10, width: 20, height: 20 }),
                classList: { add: (...names) => names.forEach(name => classes.add(name)), remove: (...names) => names.forEach(name => classes.delete(name)), contains: name => classes.has(name) } };
        };
        const rows = [1, 2, 3].map(id => {
            const element = makeTarget('DIV');
            const data = { id, status: 'A001' };
            const cells = Object.fromEntries(['stockQuantity', 'status'].map(field => {
                const cell = makeTarget('DIV');
                cell.getAttribute = () => field;
                cell.closest = selector => selector === '.tabulator-cell' ? cell : selector === '.tabulator-row' ? element : null;
                cell.contains = target => target?.cell === cell;
                return [field, cell];
            }));
            element.closest = () => null;
            element.querySelector = selector => cells[selector.match(/tabulator-field="([^"]+)/)?.[1]] || null;
            const row = { getData: () => data, getElement: () => element };
            return { element, data, cells, row };
        });
        const root = new ElementMock();
        root.contains = () => true;
        root.querySelectorAll = selector => selector === '.tabulator-row' ? rows.map(row => row.element) : [];
        const app = new ElementMock();
        app.querySelector = () => root;
        const overlay = new ElementMock();
        const search = makeTarget('INPUT');
        search.closest = () => null;
        overlay.contains = target => target === search;
        overlay.querySelector = () => search;
        const dialog = { open: vi.fn(), overlay };
        const handlers = new Map();
        const host = new ElementMock();
        const launch = new ElementMock('button');
        launch.querySelector = () => new ElementMock('span');
        const demo = { table: { on: (name, fn) => handlers.set(name, fn), off: vi.fn() }, getStateReport: () => ({ rows: [{ id: 1, hasChanges: true }] }) };
        const instance = createWithMock({ host, launch, app, demo, statusDialog: dialog, statusOptions: ['A001', 'E220'], resetData: async () => true });
        const send = (target, type, subject, key) => {
            const event = new Event(type);
            Object.defineProperty(event, 'target', { value: subject });
            if (key) Object.defineProperty(event, 'key', { value: key });
            target.dispatchEvent(event);
        };
        send(app, 'focusin', rows[0].cells.stockQuantity);
        stepId = 'tab'; index = 0;
        config.onStateChange({ hidden: false, stepId, actionIndex: index });
        expect(rows[1].cells.stockQuantity.classList.contains('demo-crud-tutorial-target')).toBe(true);
        send(app, 'focusin', rows[1].cells.stockQuantity);
        expect(rows[1].cells.stockQuantity.classList.contains('demo-crud-tutorial-target')).toBe(true);
        expect(rows[2].cells.stockQuantity.classList.contains('demo-crud-tutorial-target')).toBe(false);
        stepId = 'direct-lookup';
        config.onStateChange({ hidden: false, stepId, actionIndex: 0 });
        const status = rows[0].cells.status;
        const statusCell = { getElement: () => status, getField: () => 'status', getValue: () => rows[0].data.status, getRow: () => rows[0].row };
        send(app, 'keydown', status, 'Enter');
        handlers.get('cellEditing')(statusCell);
        send(doc, 'input', { cell: status, value: 'E220' });
        rows[0].data.status = 'E220';
        handlers.get('cellEdited')(statusCell);
        expect(stepId).toBe('dialog-lookup');
        expect(rows[0].cells.status.classList.contains('demo-crud-tutorial-target')).toBe(true);
        expect(rows[1].cells.status.classList.contains('demo-crud-tutorial-target')).toBe(false);
        index = 1;
        config.onStateChange({ hidden: false, stepId, actionIndex: index });
        expect(search.classList.contains('demo-crud-tutorial-target')).toBe(true);
        expect(overlay.children).toHaveLength(1);
        expect(overlay.children[0].className).toContain('demo-crud-row-action-glow');
        index = 2;
        config.onStateChange({ hidden: false, stepId, actionIndex: index });
        expect(search.classList.contains('demo-crud-tutorial-target')).toBe(true);
        config.onStateChange({ hidden: true, stepId, actionIndex: index });
        expect(overlay.children).toHaveLength(0);
        instance.destroy();
    } finally { vi.doUnmock('../src/demo/components/demo-action-tutorial.js'); }
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
        const cells = Object.fromEntries(['itemCode', 'productName', 'stockQuantity', 'unitPrice', 'status', 'lastCheckDate', 'notes'].map(field => [field, target()]));
        const add = target('BUTTON');
        const save = target('BUTTON');
        const search = target('INPUT');
        const result = target('TR');
        const confirm = target('BUTTON');
        const root = new ElementMock();
        const firstRow = target();
        firstRow.querySelector = selector => cells[selector.match(/tabulator-field="([^"]+)/)?.[1]] || null;
        for (const [field, element] of Object.entries(cells)) {
            element.getAttribute = () => field;
            element.closest = selector => selector === '.tabulator-cell' ? element : selector === '.tabulator-row' ? firstRow : null;
        }
        root.contains = () => true;
        root.querySelectorAll = selector => selector === '.tabulator-row' ? [firstRow] : [cells[selector.match(/tabulator-field="([^"]+)/)?.[1]]].filter(Boolean);
        const app = new ElementMock();
        app.querySelector = selector => selector === '#inventory-table' ? root : selector === '[data-action="add"]' ? add : selector === '[data-action="save"]' ? save : null;
        const host = new ElementMock();
        const launch = new ElementMock('button');
        launch.querySelector = () => new ElementMock('span');
        const dialog = { open: vi.fn(), overlay: { querySelector: selector => selector.includes('__search') ? search : result } };
        const instance = createWithMock({ host, launch, app, demo: { table: { on: vi.fn(), off: vi.fn() } }, statusDialog: dialog, statusOptions: [], locale: 'en', resetData: async () => true });
        const hasHighlight = element => element.classList.contains('demo-crud-tutorial-target');
        config.onStateChange({ hidden: false, stepId: 'keyboard-edit', actionIndex: 0 });
        expect(hasHighlight(cells.itemCode)).toBe(true);
        expect(hasHighlight(cells.stockQuantity)).toBe(false);
        const pointer = new Event('pointerdown');
        Object.defineProperty(pointer, 'target', { value: cells.productName });
        app.dispatchEvent(pointer);
        expect(hasHighlight(cells.itemCode)).toBe(false);
        expect(hasHighlight(cells.stockQuantity)).toBe(true);
        config.onStateChange({ hidden: true, stepId: 'keyboard-edit', actionIndex: 0 });
        expect(hasHighlight(cells.stockQuantity)).toBe(false);
        config.onStateChange({ hidden: false, stepId: 'keyboard-edit', actionIndex: 0 });
        expect(hasHighlight(cells.stockQuantity)).toBe(true);
        for (const [stepId, actionIndex, expected] of [
            ['keyboard-edit', 1, cells.stockQuantity],
            ['tab', 0, cells.stockQuantity],
            ['escape', 0, cells.unitPrice], ['escape', 1, cells.unitPrice], ['pages', 0, null],
            ['direct-lookup', 0, cells.status], ['dialog-lookup', 0, cells.status],
            ['dialog-lookup', 1, search], ['dialog-lookup', 2, search],
            ['date-picker', 0, cells.lastCheckDate], ['notes', 0, cells.notes], ['add', 0, add], ['partial-save', 0, save]
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

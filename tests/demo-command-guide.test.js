import fs from 'node:fs';
import { afterEach, describe, expect, test, vi } from 'vitest';
import {
    createDemoCommandGuide
} from '../src/demo/components/demo-command-guide.ts';
import { commandGuideCopy } from '../src/demo/components/demo-command-guide-copy.ts';
import { createDemoCommandGuideToolbar } from '../src/demo/utils/demo-command-guide-toolbar.js';

const fullDemoSource = fs.readFileSync(
    new URL('../src/demo/full-demo.js', import.meta.url),
    'utf8'
);
const demoMainSource = fs.readFileSync(
    new URL('../src/demo/main.js', import.meta.url),
    'utf8'
);
const miniDemoSources = {
    basicCrud: fs.readFileSync(new URL('../src/demo/basic-crud.js', import.meta.url), 'utf8'),
    validation: fs.readFileSync(new URL('../src/demo/validation.js', import.meta.url), 'utf8'),
    autocomplete: fs.readFileSync(new URL('../src/demo/autocomplete.js', import.meta.url), 'utf8'),
    multifieldLookup: fs.readFileSync(new URL('../src/demo/multifield-lookup.js', import.meta.url), 'utf8'),
    rowStates: fs.readFileSync(new URL('../src/demo/row-states.js', import.meta.url), 'utf8'),
    columnCalculations: fs.readFileSync(new URL('../src/demo/column-calculations.js', import.meta.url), 'utf8'),
    dates: fs.readFileSync(new URL('../src/demo/dates.js', import.meta.url), 'utf8'),
    parsers: fs.readFileSync(new URL('../src/demo/parsers.js', import.meta.url), 'utf8')
};
const inventoryShellSource = fs.readFileSync(
    new URL('../examples/react-demo/src/components/InventoryShell.tsx', import.meta.url),
    'utf8'
);
const inventoryToolbarSource = fs.readFileSync(
    new URL('../examples/react-demo/src/components/InventoryToolbar.tsx', import.meta.url),
    'utf8'
);
const inventoryGridSource = fs.readFileSync(
    new URL('../examples/react-demo/src/components/InventoryGrid.tsx', import.meta.url),
    'utf8'
);
const reactMountSource = fs.readFileSync(
    new URL('../examples/react-demo/src/mount.tsx', import.meta.url),
    'utf8'
);
const commandGuideSource = fs.readFileSync(
    new URL('../src/demo/components/demo-command-guide.ts', import.meta.url),
    'utf8'
);
const commandGuideCss = fs.readFileSync(
    new URL('../src/demo/components/demo-command-guide.css', import.meta.url),
    'utf8'
);
const demoCss = fs.readFileSync(
    new URL('../src/demo/demo.css', import.meta.url),
    'utf8'
);
const reactStyles = fs.readFileSync(
    new URL('../examples/react-demo/src/styles.css', import.meta.url),
    'utf8'
);

class ElementMock {
    constructor(tagName, ownerDocument) {
        this.tagName = tagName.toUpperCase();
        this.ownerDocument = ownerDocument;
        this.attributes = {};
        this.children = [];
        this.parentNode = null;
        this.parentElement = null;
        this.className = '';
        this.hidden = false;
        this.inert = false;
        this.tabIndex = 0;
        this.textContent = '';
        this.type = '';
        this.onclick = null;
        this.onkeydown = null;
        const classes = new Set();

        this.classList = {
            add: value => {
                classes.add(value);
                this.className = [...classes].join(' ');
            },
            remove: value => {
                classes.delete(value);
                this.className = [...classes].join(' ');
            },
            contains: value => classes.has(value)
        };
    }

    append(...children) {
        children.forEach(child => this.appendChild(child));
    }

    appendChild(child) {
        if (child.parentNode) {
            child.parentNode.children = child.parentNode.children.filter(item => item !== child);
        }
        child.parentNode = this;
        child.parentElement = this;
        this.children.push(child);
        return child;
    }

    replaceChildren(...children) {
        this.children = [];
        this.append(...children);
    }

    setAttribute(name, value) {
        this.attributes[name] = String(value);
    }

    getAttribute(name) {
        return this.attributes[name] ?? null;
    }

    focus() {
        this.ownerDocument.activeElement = this;
    }

    remove() {
        if (this.parentNode) {
            this.parentNode.children = this.parentNode.children.filter(item => item !== this);
        }
        this.parentNode = null;
        this.parentElement = null;
    }

    click() {
        this.onclick?.({ preventDefault: vi.fn() });
    }

    keydown(key) {
        const event = { key, preventDefault: vi.fn() };
        this.onkeydown?.(event);
        return event;
    }
}

const createHarness = () => {
    const originalDocument = globalThis.document;
    const originalWindow = globalThis.window;
    const originalHTMLElement = globalThis.HTMLElement;
    const documentListeners = new Map();
    const windowListeners = new Map();
    const documentMock = {
        activeElement: null,
        documentElement: { lang: 'it' },
        createElement: tagName => new ElementMock(tagName, documentMock),
        addEventListener: (type, listener) => documentListeners.set(type, listener),
        removeEventListener: (type, listener) => {
            if (documentListeners.get(type) === listener) documentListeners.delete(type);
        }
    };
    const windowMock = {
        addEventListener: (type, listener) => windowListeners.set(type, listener),
        removeEventListener: (type, listener) => {
            if (windowListeners.get(type) === listener) windowListeners.delete(type);
        }
    };

    globalThis.document = documentMock;
    globalThis.window = windowMock;
    globalThis.HTMLElement = ElementMock;
    return {
        documentMock,
        documentListeners,
        windowListeners,
        createElement: tagName => documentMock.createElement(tagName),
        restore() {
            globalThis.document = originalDocument;
            globalThis.window = originalWindow;
            globalThis.HTMLElement = originalHTMLElement;
        }
    };
};

const harnesses = [];

afterEach(() => {
    harnesses.splice(0).forEach(harness => harness.restore());
});

const openGuide = () => {
    const harness = createHarness();
    harnesses.push(harness);
    const host = harness.createElement('div');
    const trigger = harness.createElement('button');
    const controller = createDemoCommandGuide({ host, trigger, locale: 'it' });

    controller.open();
    return { harness, host, trigger, controller, panel: host.children[0] };
};

describe('demo command guide', () => {
    test('creates one accessible panel, opens it, and prepares its trigger', () => {
        const { host, trigger, panel } = openGuide();

        expect(host.children).toHaveLength(1);
        expect(panel.id).toBe('demo-command-guide-panel');
        expect(panel.children).toHaveLength(1);
        expect(panel.getAttribute('aria-hidden')).toBe('false');
        expect(panel.inert).toBe(false);
        expect(trigger.getAttribute('aria-expanded')).toBe('true');
        expect(trigger.getAttribute('aria-controls')).toBe('demo-command-guide-panel');
        expect(trigger.classList.contains('is-command-guide-active')).toBe(true);
        expect(panel.children[0].children[1].getAttribute('role')).toBe('tablist');
        expect(panel.children[0].children[1].children).toHaveLength(4);
    });

    test('moves the singleton from host A to host B and deactivates trigger A', () => {
        const first = openGuide();
        const hostB = first.harness.createElement('div');
        const triggerB = first.harness.createElement('button');
        const second = createDemoCommandGuide({ host: hostB, trigger: triggerB, locale: 'en' });

        second.open();

        expect(first.host.children).toHaveLength(0);
        expect(hostB.children).toHaveLength(1);
        expect(hostB.children[0]).toBe(first.panel);
        expect(first.trigger.getAttribute('aria-expanded')).toBe('false');
        expect(first.trigger.classList.contains('is-command-guide-active')).toBe(false);
        expect(triggerB.getAttribute('aria-expanded')).toBe('true');
        second.destroy();
    });

    test('changes tab with click and keyboard arrows without global listeners', () => {
        const { harness, panel } = openGuide();
        const tablist = panel.children[0].children[1];
        const [mouseTab, keyboardTab] = tablist.children;

        keyboardTab.click();
        expect(keyboardTab.getAttribute('aria-selected')).toBe('true');
        expect(panel.children[0].children[2].children[1].hidden).toBe(false);

        const arrowEvent = keyboardTab.keydown('ArrowLeft');
        expect(arrowEvent.preventDefault).toHaveBeenCalledOnce();
        expect(mouseTab.getAttribute('aria-selected')).toBe('true');
        expect(harness.documentMock.activeElement).toBe(mouseTab);
        expect(harness.documentListeners.size).toBe(0);
    });

    test('updates an open panel in place when the locale changes', () => {
        const { controller, panel } = openGuide();

        controller.setLocale('en');

        expect(panel.children[0].children[0].children[0].textContent)
            .toBe('How to interact with the table');
        expect(panel.children[0].children[1].children[1].textContent).toBe('Keyboard');
        expect(panel.children[0].children[2].children[0].children[0].children[1].textContent)
            .toBe('Focus a cell for navigation.');
    });

    test('closes and destroys without leaving active trigger state', () => {
        const { controller, trigger, panel } = openGuide();

        controller.close();
        expect(panel.getAttribute('aria-hidden')).toBe('true');
        expect(panel.inert).toBe(true);
        expect(trigger.classList.contains('is-command-guide-active')).toBe(false);
        expect(trigger.getAttribute('aria-expanded')).toBe('false');

        controller.open();
        expect(panel.getAttribute('aria-hidden')).toBe('false');
        expect(panel.inert).toBe(false);

        controller.close();
        expect(panel.inert).toBe(true);
        controller.destroy();
        expect(trigger.classList.contains('is-command-guide-active')).toBe(false);
    });

    test('keeps the essential Italian and English copy in the dedicated source', () => {
        expect(commandGuideCopy.it.title).toBe('Come interagire con la tabella');
        expect(commandGuideCopy.en.tabs.special.label).toBe('Special actions');
        expect(commandGuideCopy.it.tabs.keyboard.items[2].keys)
            .toEqual(['Alt+PageUp', 'Alt+PageDown']);
        expect(commandGuideCopy.en.tabs.editing.items[1].keys).toEqual(['Esc']);
        expect(commandGuideCopy.it.trigger.label).toBe('Guida comandi');
        expect(commandGuideCopy.en.trigger.title).toBe('Mouse, keyboard and table shortcuts');
    });

    test('mounts the toolbar adapter, synchronizes locale, and cleans up safely', () => {
        const harness = createHarness();
        harnesses.push(harness);
        const host = harness.createElement('div');
        const trigger = harness.createElement('button');
        const label = harness.createElement('span');
        const app = {
            querySelector: selector => ({
                '.demo-command-guide-host': host,
                '[data-action="demo-command-guide"]': trigger
            })[selector] || null
        };

        trigger.querySelector = selector => selector === '.amb-toolbar__button-label' ? label : null;
        const adapter = createDemoCommandGuideToolbar(app);

        expect(adapter.button.id).toBe('demo-command-guide');
        expect(adapter.button.icon).toContain('<svg');
        expect(adapter.button.label).toBe('Guida comandi');

        adapter.mount();
        expect(trigger.getAttribute('aria-expanded')).toBe('false');
        expect(trigger.getAttribute('aria-controls')).toBe('demo-command-guide-panel');
        expect(harness.windowListeners.has('amb-demo-language-change')).toBe(true);

        adapter.button.onClick({ event: { currentTarget: trigger } });
        expect(host.children[0].getAttribute('aria-hidden')).toBe('false');
        expect(trigger.classList.contains('is-command-guide-active')).toBe(true);

        harness.documentMock.documentElement.lang = 'en';
        harness.windowListeners.get('amb-demo-language-change')();
        expect(label.textContent).toBe('Command guide');
        expect(trigger.title).toBe('Mouse, keyboard and table shortcuts');
        expect(trigger.getAttribute('aria-label')).toBe('Mouse, keyboard and table shortcuts');
        expect(host.children[0].children[0].children[0].children[0].textContent)
            .toBe('How to interact with the table');

        adapter.destroy();
        expect(harness.windowListeners.has('amb-demo-language-change')).toBe(false);
        expect(trigger.classList.contains('is-command-guide-active')).toBe(false);
        expect(trigger.getAttribute('aria-expanded')).toBe('false');
        expect(() => adapter.destroy()).not.toThrow();
    });

    test('integrates one command guide before the main demo toolbar and grid', () => {
        expect(demoMainSource).toContain("import './components/demo-command-guide.css'");
        expect(fullDemoSource).toContain("from './components/demo-command-guide.ts'");
        expect(fullDemoSource).toContain("from './demo-icons.js'");
        expect(fullDemoSource).toContain("demoIcon('help')");
        expect(fullDemoSource).toContain("id: 'demo-command-guide'");
        expect(fullDemoSource).toContain("onClick: handleCommandGuide");
        expect(fullDemoSource).toContain("window.addEventListener('amb-demo-language-change', handleDemoLanguageChange)");
        expect(fullDemoSource).toContain("window.removeEventListener('amb-demo-language-change', handleDemoLanguageChange)");
        expect(fullDemoSource).toContain('commandGuide?.setLocale(getLanguage())');
        expect(fullDemoSource).toContain('commandGuide?.destroy()');
        expect(fullDemoSource).toContain('commandGuideCopy[getLanguage()].trigger');

        const hostIndex = fullDemoSource.indexOf('class="demo-command-guide-host"');
        const tableIndex = fullDemoSource.indexOf('id="inventory-table"');

        expect(hostIndex).toBeGreaterThan(-1);
        expect(tableIndex).toBeGreaterThan(hostIndex);
    });

    test('integrates the shared command-guide toolbar before each mini-demo grid', () => {
        const demos = [
            ['basicCrud', 'id="basic-table"'],
            ['validation', 'id="validation-table"'],
            ['autocomplete', 'id="autocomplete-table"'],
            ['multifieldLookup', 'id="municipality-table"'],
            ['rowStates', 'id="row-states-table"'],
            ['columnCalculations', 'id="column-calculations-table"'],
            ['dates', 'id="dates-table"'],
            ['parsers', 'id="parsers-table"']
        ];

        demos.forEach(([name, tableId]) => {
            const source = miniDemoSources[name];
            const hostIndex = source.indexOf('class="demo-command-guide-host"');
            const tableIndex = source.indexOf(tableId);

            expect(source).toContain("from './utils/demo-command-guide-toolbar.js'");
            expect(source).toContain('createDemoCommandGuideToolbar(app)');
            expect(source).toContain('commandGuideToolbar.button');
            expect(source).toContain('commandGuideToolbar.mount()');
            expect(source).toContain('commandGuideToolbar.destroy()');
            expect(hostIndex).toBeGreaterThan(-1);
            expect(tableIndex).toBeGreaterThan(hostIndex);
        });
    });

    test('uses a command-guide-only toolbar in the parsers demo', () => {
        const source = miniDemoSources.parsers;

        expect(source).not.toContain('toolbar: false');
        expect(source).toContain('toolbar: {');
        expect(source).toContain('buttons: [commandGuideToolbar.button]');
    });

    test('bridges the shared command guide into the React inventory demo', () => {
        expect(inventoryShellSource).toContain('createDemoCommandGuide');
        expect(inventoryShellSource).toContain('DemoCommandGuideController');
        expect(inventoryShellSource).toContain('commandGuideHostRef');
        expect(inventoryShellSource).toContain('commandGuideTriggerRef');
        expect(inventoryShellSource).toContain('commandGuideRef');
        expect(inventoryShellSource).toContain('className="demo-command-guide-host"');
        expect(inventoryShellSource.indexOf('className="demo-command-guide-host"'))
            .toBeLessThan(inventoryShellSource.indexOf('<InventoryToolbar busy'));
        expect(inventoryShellSource).toContain('const controller = createDemoCommandGuide({');
        expect(inventoryShellSource).toContain('controller.destroy()');
        expect(inventoryShellSource).toContain('commandGuideRef.current?.setLocale(language)');
        expect(inventoryShellSource).toContain('commandGuideTriggerRef={commandGuideTriggerRef}');
        expect(inventoryShellSource).toContain('onCommandGuideToggle={handleCommandGuideToggle}');

        expect(inventoryToolbarSource).toContain('CircleHelp');
        expect(inventoryToolbarSource).toContain("demo-command-guide-copy");
        expect(inventoryToolbarSource).toContain('commandGuideCopy[props.language].trigger');
        expect(inventoryToolbarSource).toContain('onClick={props.onCommandGuideToggle}');
        expect(inventoryToolbarSource).toContain('ref={props.commandGuideTriggerRef}');

        expect(reactMountSource).toContain("demo-command-guide.css");
        expect(inventoryGridSource).toContain('toolbar: false');
    });

    test('uses contextual CSS custom properties without theming controller logic', () => {
        [
            '--demo-command-guide-accent',
            '--demo-command-guide-accent-rgb',
            '--demo-command-guide-glow-rgb',
            '--demo-command-guide-active-bg',
            '--demo-command-guide-active-text'
        ].forEach(property => expect(commandGuideCss).toContain(property));
        expect(commandGuideCss).toContain('border-bottom-color: var(--demo-command-guide-accent);');
        expect(commandGuideCss).toContain('outline: 2px solid var(--demo-command-guide-accent);');
        expect(commandGuideCss).toContain('background-color: var(--demo-command-guide-active-bg) !important;');
        expect(commandGuideCss).toContain('rgb(var(--demo-command-guide-glow-rgb) / .18)');
        expect(commandGuideCss.match(/@keyframes demo-command-guide-glow/g)).toHaveLength(1);
        expect(commandGuideSource).not.toContain('theme:');
        expect(commandGuideSource).not.toContain('style.setProperty');

        expect(demoCss).toContain('.demo-example {\n    --demo-command-guide-accent:');
        expect(reactStyles).toContain('.inventory-workspace { --demo-command-guide-accent:');
    });
});

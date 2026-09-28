import { afterEach, describe, expect, test, vi } from 'vitest';
import {
    createDemoCommandGuide
} from '../src/demo/components/demo-command-guide.ts';
import { commandGuideCopy } from '../src/demo/components/demo-command-guide-copy.ts';

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
    const documentListeners = new Map();
    const documentMock = {
        activeElement: null,
        createElement: tagName => new ElementMock(tagName, documentMock),
        addEventListener: (type, listener) => documentListeners.set(type, listener),
        removeEventListener: (type, listener) => {
            if (documentListeners.get(type) === listener) documentListeners.delete(type);
        }
    };

    globalThis.document = documentMock;
    return {
        documentMock,
        documentListeners,
        createElement: tagName => documentMock.createElement(tagName),
        restore() {
            globalThis.document = originalDocument;
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
        expect(panel.getAttribute('aria-hidden')).toBe('false');
        expect(trigger.getAttribute('aria-expanded')).toBe('true');
        expect(trigger.getAttribute('aria-controls')).toBe('demo-command-guide-panel');
        expect(trigger.classList.contains('is-command-guide-active')).toBe(true);
        expect(panel.children[1].getAttribute('role')).toBe('tablist');
        expect(panel.children[1].children).toHaveLength(4);
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
        const tablist = panel.children[1];
        const [mouseTab, keyboardTab] = tablist.children;

        keyboardTab.click();
        expect(keyboardTab.getAttribute('aria-selected')).toBe('true');
        expect(panel.children[2].children[1].hidden).toBe(false);

        const arrowEvent = keyboardTab.keydown('ArrowLeft');
        expect(arrowEvent.preventDefault).toHaveBeenCalledOnce();
        expect(mouseTab.getAttribute('aria-selected')).toBe('true');
        expect(harness.documentMock.activeElement).toBe(mouseTab);
        expect(harness.documentListeners.size).toBe(0);
    });

    test('updates an open panel in place when the locale changes', () => {
        const { controller, panel } = openGuide();

        controller.setLocale('en');

        expect(panel.children[0].children[0].textContent)
            .toBe('How to interact with the table');
        expect(panel.children[1].children[1].textContent).toBe('Keyboard');
        expect(panel.children[2].children[0].children[0].children[1].textContent)
            .toBe('Focus a cell for navigation.');
    });

    test('closes and destroys without leaving active trigger state', () => {
        const { controller, trigger, panel } = openGuide();

        controller.close();
        expect(panel.getAttribute('aria-hidden')).toBe('true');
        expect(trigger.classList.contains('is-command-guide-active')).toBe(false);
        expect(trigger.getAttribute('aria-expanded')).toBe('false');

        controller.destroy();
        expect(trigger.classList.contains('is-command-guide-active')).toBe(false);
    });

    test('keeps the essential Italian and English copy in the dedicated source', () => {
        expect(commandGuideCopy.it.title).toBe('Come interagire con la tabella');
        expect(commandGuideCopy.en.tabs.special.label).toBe('Special actions');
        expect(commandGuideCopy.it.tabs.keyboard.items[2].keys)
            .toEqual(['Alt+PageUp', 'Alt+PageDown']);
        expect(commandGuideCopy.en.tabs.editing.items[1].keys).toEqual(['Esc']);
    });
});

import fs from 'node:fs';
import { describe, expect, test, vi } from 'vitest';
import {
    createToolbar,
    normalizeToolbarOptions
} from '../src/ui/toolbar.js';

class ElementMock {
    constructor(tagName = 'div') {
        this.tagName = tagName;
        this.children = [];
        this.dataset = {};
        this.listeners = new Map();
        this.parentNode = null;
        this.disabled = false;
        this.removed = false;
    }

    append(...children) {
        children.forEach(child => this.appendChild(child));
    }

    appendChild(child) {
        child.parentNode = this;
        this.children.push(child);
        return child;
    }

    addEventListener(type, listener) {
        this.listeners.set(type, listener);
    }

    removeEventListener(type, listener) {
        if (this.listeners.get(type) === listener) {
            this.listeners.delete(type);
        }
    }

    setAttribute(name, value) {
        this[name] = value;
    }

    async dispatch(type) {
        const listener = this.listeners.get(type);

        if (listener) {
            await listener({ type, target: this });
        }
    }

    remove() {
        this.removed = true;

        if (this.parentNode) {
            this.parentNode.children = this.parentNode.children.filter(child => child !== this);
        }
    }
}

const createHarness = toolbar => {
    const originalDocument = globalThis.document;
    const parent = new ElementMock();
    const tableElement = new ElementMock();
    const grid = {
        crud: {
            getSavePayload: vi.fn(() => ({
                canSave: true,
                changes: {
                    inserted: [{ id: null, title: 'New' }],
                    updated: [],
                    deleted: []
                }
            }))
        }
    };

    parent.appendChild(tableElement);
    parent.insertBefore = (element, reference) => {
        const index = parent.children.indexOf(reference);

        element.parentNode = parent;
        parent.children.splice(index, 0, element);
    };

    globalThis.document = {
        createElement: tagName => new ElementMock(tagName),
        querySelector: selector => selector === '#table' ? tableElement : null
    };

    const controller = createToolbar({
        selector: '#table',
        toolbar,
        getGrid: () => grid
    });

    return {
        controller,
        grid,
        parent,
        restore() {
            globalThis.document = originalDocument;
        }
    };
};

describe('AMB toolbar', () => {
    test('is disabled when toolbar is false or omitted', () => {
        expect(normalizeToolbarOptions(false).enabled).toBe(false);
        expect(normalizeToolbarOptions(undefined).enabled).toBe(false);

        const harness = createHarness(false);

        try {
            expect(harness.controller).toBeNull();
            expect(harness.parent.children).toHaveLength(1);
        } finally {
            harness.restore();
        }
    });

    test('renders configured buttons and invokes backend-agnostic callbacks', async () => {
        const onSave = vi.fn();
        const onReload = vi.fn();
        const harness = createHarness({
            buttons: ['save', 'reload'],
            onSave,
            onReload
        });

        try {
            const group = harness.controller.element.children[0];
            const [saveButton, reloadButton] = group.children;

            expect(harness.parent.children[0]).toBe(harness.controller.element);
            expect(saveButton.disabled).toBe(false);
            expect(reloadButton.disabled).toBe(false);

            await saveButton.dispatch('click');
            await reloadButton.dispatch('click');

            expect(harness.grid.crud.getSavePayload).toHaveBeenCalledTimes(1);
            expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
                grid: harness.grid,
                payload: expect.objectContaining({
                    changes: expect.objectContaining({
                        inserted: [{ id: null, title: 'New' }]
                    })
                })
            }));
            expect(onReload).toHaveBeenCalledWith(expect.objectContaining({
                grid: harness.grid
            }));

            harness.controller.destroy();

            expect(saveButton.listeners.size).toBe(0);
            expect(reloadButton.listeners.size).toBe(0);
            expect(harness.controller.element.removed).toBe(true);
        } finally {
            harness.restore();
        }
    });

    test('disables missing callbacks and removes listeners and markup on destroy', () => {
        const harness = createHarness(true);

        try {
            const group = harness.controller.element.children[0];

            expect(group.children.every(button => button.disabled)).toBe(true);

            harness.controller.destroy();

            expect(harness.controller.element.removed).toBe(true);
            expect(harness.parent.children).toHaveLength(1);
        } finally {
            harness.restore();
        }
    });

    test('keeps library and demo CSS imports separate', () => {
        const demoMain = fs.readFileSync(
            new URL('../src/demo/main.js', import.meta.url),
            'utf8'
        );
        const compatibilityCss = fs.readFileSync(
            new URL('../src/style.css', import.meta.url),
            'utf8'
        );

        expect(demoMain).toContain("import '../amb-grid.css'");
        expect(demoMain).toContain("import './demo.css'");
        expect(demoMain).not.toContain("import '../style.css'");
        expect(compatibilityCss).toBe(
            "@import './amb-grid.css';\n@import './demo/demo.css';\n"
        );
    });
});

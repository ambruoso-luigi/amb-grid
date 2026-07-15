import { describe, expect, test, vi } from 'vitest';
import { CellMessageBinder } from '../src/ui/cell-message-binder.js';
import { FloatingMessage } from '../src/ui/floating-message.js';

class ElementMock {
    constructor() {
        this.children = [];
        this.className = '';
        this.classList = {
            add: vi.fn(),
            remove: vi.fn()
        };
        this.attributes = {};
        this.style = {};
        this.textContent = '';
        this.removed = false;
    }

    append(...children) {
        this.children.push(...children);
    }

    setAttribute(name, value) {
        this.attributes[name] = value;
    }

    getBoundingClientRect() {
        return {
            top: 20,
            left: 30,
            width: 120
        };
    }

    remove() {
        this.removed = true;
    }
}

const createDocumentHarness = () => {
    const originalDocument = globalThis.document;
    const originalWindow = globalThis.window;
    const body = new ElementMock();

    body.appendChild = vi.fn(element => {
        body.children.push(element);
        return element;
    });

    globalThis.document = {
        body,
        createElement: () => new ElementMock()
    };
    globalThis.window = {
        scrollX: 0,
        scrollY: 0,
        setTimeout,
        clearTimeout
    };

    return {
        body,
        restore() {
            globalThis.document = originalDocument;
            globalThis.window = originalWindow;
        }
    };
};

describe('FloatingMessage', () => {
    test('does not create DOM or timers when disabled', () => {
        const harness = createDocumentHarness();

        try {
            const message = new FloatingMessage({ enabled: false });
            const target = new ElementMock();

            message.show(target, {
                type: 'info',
                title: 'Description',
                message: 'Hidden'
            });
            message.scheduleShow(target, {
                type: 'error',
                title: 'Validation error',
                message: 'Hidden'
            });
            message.hide();
            message.destroy();

            expect(harness.body.appendChild).not.toHaveBeenCalled();
            expect(message.element).toBeNull();
        } finally {
            harness.restore();
        }
    });

    test('CellMessageBinder can disable validation hover listeners', () => {
        const handlers = new Map();
        const crudHelper = {
            on: vi.fn((eventName, handler) => {
                handlers.set(eventName, handler);
                return vi.fn();
            })
        };
        const floatingMessage = {
            scheduleShow: vi.fn(),
            hide: vi.fn()
        };
        const cellElement = new ElementMock();
        const cell = {
            getElement: () => cellElement
        };
        const binder = new CellMessageBinder(crudHelper, floatingMessage, {
            enabled: false
        });

        cellElement.addEventListener = vi.fn();
        cellElement.removeEventListener = vi.fn();
        cellElement.removeAttribute = vi.fn();

        handlers.get('cell-error')({
            cell,
            message: 'Required'
        });

        expect(cellElement.removeAttribute).toHaveBeenCalledWith('title');
        expect(cellElement.addEventListener).not.toHaveBeenCalled();

        handlers.get('cell-error-cleared')({ cell });
        expect(floatingMessage.hide).toHaveBeenCalledOnce();

        binder.destroy();
        expect(cellElement.removeEventListener).not.toHaveBeenCalled();
    });
});

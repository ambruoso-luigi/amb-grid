import { describe, expect, test, vi } from 'vitest';
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

    test('an immediate show cancels a pending scheduled message', () => {
        vi.useFakeTimers();
        const harness = createDocumentHarness();

        try {
            const message = new FloatingMessage({ hoverDelay: 300 });
            const first = new ElementMock();
            const second = new ElementMock();

            message.scheduleShow(first, { message: 'Stale' });
            message.show(second, { message: 'Current' });
            vi.advanceTimersByTime(300);

            expect(message.bodyElement.textContent).toBe('Current');
            expect(message.showTimer).toBeNull();
        } finally {
            vi.useRealTimers();
            harness.restore();
        }
    });
});

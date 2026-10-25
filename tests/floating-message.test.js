import { describe, expect, test, vi } from 'vitest';
import { FloatingMessage } from '../src/ui/floating-message.js';

class ElementMock {
    constructor() {
        this.children = [];
        this.className = '';
        this.classList = {
            add: vi.fn((...tokens) => {
                this.className = [...new Set([...this.className.split(/\s+/).filter(Boolean), ...tokens])].join(' ');
            }),
            remove: vi.fn((...tokens) => {
                this.className = this.className.split(/\s+/).filter(token => token && !tokens.includes(token)).join(' ');
            }),
            contains: token => this.className.split(/\s+/).includes(token)
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

            message.scheduleShow(first, { message: 'Stale', className: 'stale-theme' });
            message.show(second, { message: 'Current', className: 'current-theme' });
            vi.advanceTimersByTime(300);

            expect(message.bodyElement.textContent).toBe('Current');
            expect(message.element.classList.contains('current-theme')).toBe(true);
            expect(message.element.classList.contains('stale-theme')).toBe(false);
            expect(message.showTimer).toBeNull();
        } finally {
            vi.useRealTimers();
            harness.restore();
        }
    });

    test('keeps the standard DOM, type, text, role and positioning without custom classes', () => {
        const harness = createDocumentHarness();
        try {
            const message = new FloatingMessage();
            message.show(new ElementMock(), { title: 'Status', message: 'Current filters' });
            expect(message.element.className.split(' ').sort()).toEqual([
                'teh-floating-message', 'teh-floating-message--info', 'teh-floating-message--visible'
            ]);
            expect(message.element.attributes.role).toBe('status');
            expect(message.element.children).toEqual([message.titleElement, message.bodyElement]);
            expect(message.titleElement.className).toBe('teh-floating-message__title');
            expect(message.bodyElement.className).toBe('teh-floating-message__body');
            expect(message.titleElement.textContent).toBe('Status');
            expect(message.bodyElement.textContent).toBe('Current filters');
            expect(message.element.style).toEqual({ top: '12px', left: '90px' });
            message.show(new ElementMock());
            expect(message.titleElement.textContent).toBe('');
            expect(message.bodyElement.textContent).toBe('');
        } finally {
            harness.restore();
        }
    });

    test.each(['antique-notes-tooltip', '  antique-notes-tooltip\twide-notes\nextra-context  '])('applies individual custom class tokens: %s', className => {
        const harness = createDocumentHarness();
        try {
            const message = new FloatingMessage();
            message.show(new ElementMock(), { className });
            for (const token of className.trim().split(/\s+/)) {
                expect(message.element.classList.contains(token)).toBe(true);
                expect(message.element.classList.add).toHaveBeenCalledWith(token);
            }
            expect(message.element.classList.contains('teh-floating-message')).toBe(true);
            expect(message.element.classList.contains('teh-floating-message--info')).toBe(true);
        } finally {
            harness.restore();
        }
    });

    test('reuses the popup and replaces A classes with B classes, then restores standard presentation', () => {
        const harness = createDocumentHarness();
        try {
            const message = new FloatingMessage();
            const target = new ElementMock();
            message.show(target, { type: 'error', className: 'theme-a shared-theme', title: 'A', message: 'First' });
            const element = message.element;
            expect(element.classList.contains('teh-floating-message--error')).toBe(true);
            message.show(target, { type: 'info', className: 'theme-b', title: 'B', message: 'Second' });
            expect(message.element).toBe(element);
            expect(element.className.split(' ').sort()).toEqual([
                'teh-floating-message', 'teh-floating-message--info', 'teh-floating-message--visible', 'theme-b'
            ]);
            expect(message.titleElement.textContent).toBe('B');
            expect(message.bodyElement.textContent).toBe('Second');
            message.show(target, { type: 'success', title: 'C', message: 'Standard' });
            expect(element.className.split(' ').sort()).toEqual([
                'teh-floating-message', 'teh-floating-message--success', 'teh-floating-message--visible'
            ]);
            expect(message.titleElement.textContent).toBe('C');
            expect(message.bodyElement.textContent).toBe('Standard');
            expect(harness.body.appendChild).toHaveBeenCalledTimes(1);
        } finally {
            harness.restore();
        }
    });

    test('custom classes cannot inject reserved structure, semantic types or visibility state', () => {
        const harness = createDocumentHarness();
        try {
            const message = new FloatingMessage();
            message.show(new ElementMock(), {
                type: 'warning',
                className: 'custom teh-floating-message teh-floating-message--error teh-floating-message--info teh-floating-message--success teh-floating-message--visible teh-floating-message__title teh-floating-message__body'
            });
            expect(message.element.className.split(' ').sort()).toEqual([
                'custom', 'teh-floating-message', 'teh-floating-message--visible', 'teh-floating-message--warning'
            ]);
            message.hide();
            expect(message.element.classList.contains('teh-floating-message--visible')).toBe(false);
            message.show(new ElementMock(), { type: 'unknown' });
            expect(message.element.className.split(' ').sort()).toEqual([
                'teh-floating-message', 'teh-floating-message--info', 'teh-floating-message--visible'
            ]);
        } finally {
            harness.restore();
        }
    });

    test('title, body and custom classes never become HTML', () => {
        const harness = createDocumentHarness();
        try {
            const message = new FloatingMessage();
            message.show(new ElementMock(), {
                title: '<b>Title</b>', message: '<img src=x onerror=alert(1)>', className: '<custom-theme>'
            });
            expect(message.titleElement.textContent).toBe('<b>Title</b>');
            expect(message.bodyElement.textContent).toBe('<img src=x onerror=alert(1)>');
            expect(message.element.classList.contains('<custom-theme>')).toBe(true);
            for (const element of [message.element, message.titleElement, message.bodyElement]) {
                expect(Object.hasOwn(element, 'innerHTML')).toBe(false);
            }
            expect(message.titleElement.children).toEqual([]);
            expect(message.bodyElement.children).toEqual([]);
        } finally {
            harness.restore();
        }
    });

    test('scheduled messages honor the delay, replace pending options and clear previous classes', () => {
        vi.useFakeTimers();
        const harness = createDocumentHarness();
        try {
            const message = new FloatingMessage({ hoverDelay: 300 });
            const target = new ElementMock();
            message.show(target, { className: 'original-theme' });
            const element = message.element;
            message.scheduleShow(target, { className: 'cancelled-theme', message: 'Cancelled' });
            message.scheduleShow(target, { className: 'scheduled-theme', message: 'Scheduled' });
            vi.advanceTimersByTime(299);
            expect(element.classList.contains('original-theme')).toBe(true);
            vi.advanceTimersByTime(1);
            expect(element.classList.contains('scheduled-theme')).toBe(true);
            expect(element.classList.contains('original-theme')).toBe(false);
            expect(element.classList.contains('cancelled-theme')).toBe(false);
            expect(message.bodyElement.textContent).toBe('Scheduled');
            expect(message.showTimer).toBeNull();
            message.scheduleShow(target, { message: 'Standard' });
            vi.runAllTimers();
            expect(element.classList.contains('scheduled-theme')).toBe(false);
            expect(message.bodyElement.textContent).toBe('Standard');
            expect(harness.body.appendChild).toHaveBeenCalledTimes(1);
        } finally {
            vi.useRealTimers();
            harness.restore();
        }
    });

    test('hide cancels pending classes and destroy releases the element, timer and custom-class tracking', () => {
        vi.useFakeTimers();
        const harness = createDocumentHarness();
        try {
            const message = new FloatingMessage();
            const target = new ElementMock();
            message.show(target, { className: 'custom-theme' });
            const element = message.element;
            message.scheduleShow(target, { className: 'cancelled-theme' });
            message.hide();
            vi.runAllTimers();
            expect(element.classList.contains('teh-floating-message--visible')).toBe(false);
            expect(element.classList.contains('cancelled-theme')).toBe(false);
            message.scheduleShow(target, { className: 'destroyed-theme' });
            message.destroy();
            vi.runAllTimers();
            expect(element.removed).toBe(true);
            expect(message.element).toBeNull();
            expect(message.titleElement).toBeNull();
            expect(message.bodyElement).toBeNull();
            expect(message.showTimer).toBeNull();
            expect(message._customClasses.size).toBe(0);
            expect(vi.getTimerCount()).toBe(0);
            expect(harness.body.appendChild).toHaveBeenCalledTimes(1);
            message.destroy();
            message.show(target, { message: 'Standard' });
            expect(message.element.classList.contains('custom-theme')).toBe(false);
        } finally {
            vi.useRealTimers();
            harness.restore();
        }
    });
});

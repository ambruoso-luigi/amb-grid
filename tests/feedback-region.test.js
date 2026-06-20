import { describe, expect, test } from 'vitest';
import { FeedbackRegion } from '../src/ui/feedback-region.js';

class ElementMock {
    constructor() {
        this.children = [];
        this.parentNode = null;
        this.hidden = false;
        this.removed = false;
    }

    append(...children) {
        children.forEach(child => {
            child.parentNode = this;
            this.children.push(child);
        });
    }

    setAttribute(name, value) {
        this[name] = value;
    }

    remove() {
        this.removed = true;
    }
}

describe('FeedbackRegion', () => {
    test.each([
        ['success', 'status', 'polite'],
        ['info', 'status', 'polite'],
        ['warning', 'alert', 'assertive'],
        ['error', 'alert', 'assertive']
    ])('shows accessible %s messages', (type, role, ariaLive) => {
        const originalDocument = globalThis.document;

        globalThis.document = {
            createElement: () => new ElementMock()
        };

        try {
            const feedback = new FeedbackRegion();

            feedback.show({
                type,
                title: 'Status',
                message: `${type} message`
            });

            expect(feedback.element.hidden).toBe(false);
            expect(feedback.element.className)
                .toContain(`amb-feedback-region--${type}`);
            expect(feedback.element.role).toBe(role);
            expect(feedback.element['aria-live']).toBe(ariaLive);
            expect(feedback.titleElement.textContent).toBe('Status');
            expect(feedback.messageElement.textContent)
                .toBe(`${type} message`);
        } finally {
            globalThis.document = originalDocument;
        }
    });

    test('clears and destroys its markup', () => {
        const originalDocument = globalThis.document;

        globalThis.document = {
            createElement: () => new ElementMock()
        };

        try {
            const feedback = new FeedbackRegion();
            const element = feedback.element;

            feedback.show({ type: 'error', message: 'Failed' });
            feedback.clear();

            expect(element.hidden).toBe(true);
            expect(feedback.messageElement.textContent).toBe('');

            feedback.destroy();

            expect(element.removed).toBe(true);
            expect(feedback.element).toBeNull();
        } finally {
            globalThis.document = originalDocument;
        }
    });
});

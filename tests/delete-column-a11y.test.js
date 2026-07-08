import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { createDeleteColumn } from '../src/lib/table/delete-column.js';

const createElementMock = tagName => {
    const element = {
        tagName: tagName.toUpperCase(),
        attributes: {},
        children: [],
        className: '',
        dataset: {},
        textContent: '',
        title: '',
        type: '',
        append(...children) {
            this.children.push(...children);
        },
        querySelector(selector) {
            if (
                selector === '.amb-row-action-button'
                && String(this.className).split(/\s+/).includes('amb-row-action-button')
            ) {
                return this;
            }

            for (const child of this.children) {
                const match = child.querySelector?.(selector);

                if (match) return match;
            }

            return null;
        },
        setAttribute(name, value) {
            this.attributes[name] = String(value);
        },
        getAttribute(name) {
            return this.attributes[name] ?? null;
        },
        get tabIndex() {
            return this.tagName === 'BUTTON' ? 0 : -1;
        }
    };

    return element;
};

const createRow = (data = { id: 1, _state: 'clean' }) => ({
    getData: () => data,
    getElement: () => globalThis.document.createElement('div')
});

describe('delete column accessibility', () => {
    const originalDocument = globalThis.document;

    beforeEach(() => {
        globalThis.document = {
            createElement: createElementMock
        };
    });

    afterEach(() => {
        globalThis.document = originalDocument;
    });

    test('renders row action buttons as native buttons with aria-label and title', () => {
        const crud = {
            options: {
                idField: 'id',
                tempIdField: '_ambTempId',
                stateField: '_state'
            }
        };
        const controller = createDeleteColumn(
            {
                labels: {
                    delete: 'Delete product'
                }
            },
            () => crud,
            { confirm: () => Promise.resolve(true) }
        );
        const row = createRow();
        const element = controller.column.formatter({
            getRow: () => row
        });
        const button = element.querySelector('.amb-row-action-button');

        expect(button.tagName).toBe('BUTTON');
        expect(button.type).toBe('button');
        expect(button.dataset.action).toBe('delete');
        expect(button.getAttribute('aria-label')).toBe('Delete product');
        expect(button.title).toBe('Delete product');
        expect(button.tabIndex).toBe(0);
    });
});

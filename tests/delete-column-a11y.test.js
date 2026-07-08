import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { createDeleteColumn } from '../src/lib/table/delete-column.js';

const createElementMock = tagName => {
    const element = {
        tagName: tagName.toUpperCase(),
        attributes: {},
        children: [],
        className: '',
        dataset: {},
        eventListeners: {},
        focusOptions: null,
        textContent: '',
        title: '',
        type: '',
        append(...children) {
            this.children.push(...children);
        },
        addEventListener(type, listener) {
            this.eventListeners[type] = this.eventListeners[type] || [];
            this.eventListeners[type].push(listener);
        },
        focus(options) {
            this.focusOptions = options;
            globalThis.document.activeElement = this;
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
        hasAttribute(name) {
            return Object.prototype.hasOwnProperty.call(this.attributes, name);
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
            activeElement: null,
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

    test('binds Shift+Tab from the first editable cell to the previous row action button', () => {
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
        const actionCell = globalThis.document.createElement('div');
        const currentCell = globalThis.document.createElement('div');
        const tableElement = globalThis.document.createElement('div');
        const actionContainer = controller.column.formatter({
            getRow: () => row
        });
        const button = actionContainer.querySelector('.amb-row-action-button');
        let keydownListener = null;
        let keydownCapture = false;
        let prevented = false;
        let stopped = false;

        actionCell.children.push(actionContainer);
        currentCell.previousElementSibling = actionCell;
        tableElement.addEventListener = (type, listener, capture) => {
            if (type === 'keydown') {
                keydownListener = listener;
                keydownCapture = capture;
            }
        };
        tableElement.removeEventListener = () => {};

        expect(controller.column.cssClass).toBe('amb-row-action-cell');

        const unbind = controller.bind({ element: tableElement });

        keydownListener({
            key: 'Tab',
            shiftKey: true,
            target: {
                closest: selector => selector === '.tabulator-cell' ? currentCell : null
            },
            preventDefault: () => {
                prevented = true;
            },
            stopPropagation: () => {
                stopped = true;
            }
        });

        expect(keydownCapture).toBe(true);
        expect(prevented).toBe(true);
        expect(stopped).toBe(true);
        expect(globalThis.document.activeElement).toBe(button);
        expect(button.focusOptions).toEqual({ preventScroll: true });
        expect(unbind).toEqual(expect.any(Function));
    });
});

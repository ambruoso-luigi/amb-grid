import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { navigateEditableCellAfterClose } from '../src/lib/editors/shared.js';
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
            children.forEach(child => {
                child.parentNode = this;
                this.children.push(child);
            });
        },
        addEventListener(type, handler) {
            this.listeners = this.listeners || {};
            this.listeners[type] = handler;
        },
        contains(target) {
            return this === target || this.children.some(child => child.contains?.(target));
        },
        dispatch(type, event = {}) {
            this.listeners?.[type]?.({
                currentTarget: this,
                target: this,
                preventDefault: vi.fn(),
                stopImmediatePropagation: vi.fn(),
                stopPropagation: vi.fn(),
                ...event
            });
        },
        focus: vi.fn(function focus() {
            if (globalThis.document) {
                globalThis.document.activeElement = this;
            }
        }),
        querySelector(selector) {
            if (
                selector.startsWith('.')
                && String(this.className).split(/\s+/).includes(selector.slice(1))
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
        replaceWith(nextElement) {
            if (!this.parentNode) return;

            const index = this.parentNode.children.indexOf(this);

            if (index === -1) return;

            nextElement.parentNode = this.parentNode;
            this.parentNode.children[index] = nextElement;
            this.parentNode = null;
        },
        get tabIndex() {
            return this.tagName === 'BUTTON' ? 0 : -1;
        }
    };

    return element;
};

const createCrud = () => ({
    options: {
        idField: 'id',
        tempIdField: '_ambTempId',
        stateField: '_state'
    },
    deleteRow: vi.fn(),
    rollbackRow: vi.fn()
});

const createRow = (data = { id: 1, _state: 'clean' }) => ({
    getData: () => data,
    getElement: () => globalThis.document.createElement('div')
});

const createKeyboardEvent = (key, options = {}) => ({
    key,
    preventDefault: vi.fn(),
    shiftKey: false,
    stopImmediatePropagation: vi.fn(),
    stopPropagation: vi.fn(),
    ...options
});

const createEditableCell = () => ({
    edit: vi.fn(),
    getColumn: () => ({
        getDefinition: () => ({ editor: 'input' })
    })
});

const flushDeferred = () => new Promise(resolve => {
    globalThis.setTimeout(resolve, 0);
});

const flushActionFocus = async () => {
    await flushDeferred();
    await flushDeferred();
};

const clickButton = button => {
    return button.listeners.click({
        currentTarget: button,
        preventDefault: vi.fn(),
        stopImmediatePropagation: vi.fn(),
        stopPropagation: vi.fn()
    });
};

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
        const crud = createCrud();
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

    test('marks the delete column as an AMB interactive navigation target', () => {
        const controller = createDeleteColumn(
            {},
            () => createCrud(),
            { confirm: () => Promise.resolve(true) }
        );

        expect(controller.column._ambInteractive).toBe(true);
        expect(controller.column._ambFocusSelector).toBe('.amb-row-action-button');
        expect(controller.column.editor).toEqual(expect.any(Function));
        expect(controller.column.field).toBeUndefined();
    });

    test.each([
        ['clean', 'delete'],
        ['deleted', 'rollback'],
        ['new', 'remove-new']
    ])('renders %s row action through the same button selector', (state, action) => {
        const controller = createDeleteColumn(
            {},
            () => createCrud(),
            { confirm: () => Promise.resolve(true) }
        );
        const element = controller.column.formatter({
            getRow: () => createRow({ id: 1, _state: state })
        });
        const button = element.querySelector('.amb-row-action-button');

        expect(button).toBeTruthy();
        expect(button.dataset.action).toBe(action);
    });

    test('AMB navigation edits the delete cell instead of skipping the action column', async () => {
        const controller = createDeleteColumn(
            {},
            () => createCrud(),
            { confirm: () => Promise.resolve(true) }
        );
        const edit = vi.fn();
        let startCell;
        let actionCell;
        const row = {
            getCells: () => [startCell, actionCell]
        };

        startCell = {
            getRow: () => row
        };
        actionCell = {
            edit,
            getColumn: () => ({
                getDefinition: () => controller.column
            })
        };

        navigateEditableCellAfterClose(startCell, 'next');

        await flushDeferred();
        expect(edit).toHaveBeenCalledOnce();
    });

    test('internal action editor returns false when the current row has no available action', () => {
        const controller = createDeleteColumn(
            {
                actions: {
                    delete: false
                }
            },
            () => createCrud(),
            { confirm: () => Promise.resolve(true) }
        );
        const row = {
            getData: () => ({ id: 1, _state: 'clean' })
        };
        const cell = {
            getRow: () => row
        };

        expect(controller.column.editor(cell, vi.fn(), vi.fn(), vi.fn())).toBe(false);
    });

    test('AMB navigation skips the delete cell when the current row has no available action', async () => {
        const controller = createDeleteColumn(
            {
                actions: {
                    delete: false
                }
            },
            () => createCrud(),
            { confirm: () => Promise.resolve(true) }
        );
        const nextCell = createEditableCell();
        let startCell;
        let actionCell;
        const row = {
            getCells: () => [startCell, actionCell, nextCell]
        };

        startCell = {
            getRow: () => row
        };
        actionCell = {
            edit: vi.fn(() => false),
            getColumn: () => ({
                getDefinition: () => controller.column
            })
        };

        navigateEditableCellAfterClose(startCell, 'next');

        await flushDeferred();
        expect(actionCell.edit).toHaveBeenCalledOnce();
        expect(nextCell.edit).toHaveBeenCalledOnce();
    });

    test('the internal action editor focuses the row action button and navigates next on Tab', async () => {
        const controller = createDeleteColumn(
            {},
            () => createCrud(),
            { confirm: () => Promise.resolve(true) }
        );
        const nextCell = createEditableCell();
        const cancel = vi.fn();
        let actionCell;
        const row = {
            getData: () => ({ id: 1, _state: 'clean' }),
            getCells: () => [actionCell, nextCell]
        };

        actionCell = {
            getRow: () => row,
            getColumn: () => ({
                getDefinition: () => controller.column
            })
        };

        const container = controller.column.editor(actionCell, callback => callback(), vi.fn(), cancel);
        const button = container.querySelector('.amb-row-action-button');
        const event = createKeyboardEvent('Tab');

        expect(button.focus).toHaveBeenCalledOnce();

        button.dispatch('keydown', event);

        expect(cancel).toHaveBeenCalledOnce();
        expect(event.preventDefault).toHaveBeenCalledOnce();
        expect(event.stopPropagation).toHaveBeenCalledOnce();
        await flushDeferred();
        expect(nextCell.edit).toHaveBeenCalledOnce();
    });

    test('the internal action editor navigates previous on Rtab', async () => {
        const controller = createDeleteColumn(
            {},
            () => createCrud(),
            { confirm: () => Promise.resolve(true) }
        );
        const previousCell = createEditableCell();
        const cancel = vi.fn();
        let actionCell;
        const row = {
            getData: () => ({ id: 1, _state: 'clean' }),
            getCells: () => [previousCell, actionCell]
        };

        actionCell = {
            getRow: () => row,
            getColumn: () => ({
                getDefinition: () => controller.column
            })
        };

        const container = controller.column.editor(actionCell, callback => callback(), vi.fn(), cancel);
        const button = container.querySelector('.amb-row-action-button');
        const event = createKeyboardEvent('Tab', { shiftKey: true });

        button.dispatch('keydown', event);

        expect(cancel).toHaveBeenCalledOnce();
        await flushDeferred();
        expect(previousCell.edit).toHaveBeenCalledOnce();
    });

    test.each([
        ['clean', 'delete', 'deleteRow'],
        ['deleted', 'rollback', 'rollbackRow'],
        ['new', 'remove-new', 'deleteRow']
    ])('editor button click executes %s row action', async (state, action, methodName) => {
        const crud = createCrud();
        const cancel = vi.fn();
        const controller = createDeleteColumn(
            {},
            () => crud,
            { confirm: () => Promise.resolve(true) }
        );
        const rowElement = globalThis.document.createElement('div');
        const row = {
            getData: () => ({ id: 1, _state: state }),
            getElement: () => rowElement
        };
        const cell = {
            getRow: () => row
        };
        const container = controller.column.editor(cell, callback => callback(), vi.fn(), cancel);
        const button = container.querySelector('.amb-row-action-button');

        expect(button.dataset.action).toBe(action);

        await clickButton(button);

        expect(cancel).toHaveBeenCalledOnce();
        expect(crud[methodName]).toHaveBeenCalledWith(1);
        await flushDeferred();
    });

    test('after confirmed delete, focus returns to the same action cell on the rollback button', async () => {
        const data = { id: 1, _state: 'clean' };
        const crud = createCrud();
        const controller = createDeleteColumn(
            {
                confirmDeleteMessage: 'Delete row?'
            },
            () => crud,
            { confirm: () => Promise.resolve(true) }
        );
        const rowElement = globalThis.document.createElement('div');
        const row = {
            getData: () => data,
            getElement: () => rowElement
        };
        const cell = {
            getRow: () => row
        };

        crud.deleteRow.mockImplementation(() => {
            data._state = 'deleted';
            return true;
        });

        const container = controller.column.editor(cell, callback => callback(), vi.fn(), vi.fn());
        rowElement.append(container);

        await clickButton(container.querySelector('.amb-row-action-button'));
        await flushActionFocus();

        expect(crud.deleteRow).toHaveBeenCalledWith(1);
        expect(globalThis.document.activeElement.dataset.action).toBe('rollback');
    });

    test('after canceled delete, focus returns to the same action cell on the delete button', async () => {
        const data = { id: 1, _state: 'clean' };
        const crud = createCrud();
        const controller = createDeleteColumn(
            {
                confirmDeleteMessage: 'Delete row?'
            },
            () => crud,
            { confirm: () => Promise.resolve(false) }
        );
        const rowElement = globalThis.document.createElement('div');
        const row = {
            getData: () => data,
            getElement: () => rowElement
        };
        const cell = {
            getRow: () => row
        };
        const container = controller.column.editor(cell, callback => callback(), vi.fn(), vi.fn());

        rowElement.append(container);

        await clickButton(container.querySelector('.amb-row-action-button'));
        await flushDeferred();

        expect(crud.deleteRow).not.toHaveBeenCalled();
        expect(globalThis.document.activeElement.dataset.action).toBe('delete');
    });

    test('after rollback without confirmation, focus returns to the same action cell on the delete button', async () => {
        const data = { id: 1, _state: 'deleted' };
        const crud = createCrud();
        const controller = createDeleteColumn(
            {},
            () => crud,
            { confirm: () => Promise.resolve(true) }
        );
        const rowElement = globalThis.document.createElement('div');
        const row = {
            getData: () => data,
            getElement: () => rowElement
        };
        const cell = {
            getRow: () => row
        };

        crud.rollbackRow.mockImplementation(() => {
            data._state = 'clean';
            return true;
        });

        const container = controller.column.editor(cell, callback => callback(), vi.fn(), vi.fn());
        rowElement.append(container);

        await clickButton(container.querySelector('.amb-row-action-button'));
        await flushActionFocus();

        expect(crud.rollbackRow).toHaveBeenCalledWith(1);
        expect(globalThis.document.activeElement.dataset.action).toBe('delete');
    });

    test('after remove-new, focus moves to the next row action cell when available', async () => {
        const crud = createCrud();
        const controller = createDeleteColumn(
            {},
            () => crud,
            { confirm: () => Promise.resolve(true) }
        );
        const currentRowElement = globalThis.document.createElement('div');
        const nextRowElement = globalThis.document.createElement('div');
        const nextRow = {
            getData: () => ({ id: 2, _state: 'clean' }),
            getElement: () => nextRowElement
        };
        const currentRow = {
            getData: () => ({ id: 1, _state: 'new' }),
            getElement: () => currentRowElement,
            getNextRow: () => nextRow
        };
        const cell = {
            getRow: () => currentRow
        };

        nextRowElement.append(controller.column.formatter({ getRow: () => nextRow }));

        const container = controller.column.editor(cell, callback => callback(), vi.fn(), vi.fn());
        currentRowElement.append(container);

        await clickButton(container.querySelector('.amb-row-action-button'));
        await flushDeferred();

        expect(crud.deleteRow).toHaveBeenCalledWith(1);
        expect(globalThis.document.activeElement.dataset.action).toBe('delete');
        expect(nextRowElement.contains(globalThis.document.activeElement)).toBe(true);
    });

    test('after remove-new, focus moves to the previous row action cell when no next row exists', async () => {
        const crud = createCrud();
        const controller = createDeleteColumn(
            {},
            () => crud,
            { confirm: () => Promise.resolve(true) }
        );
        const currentRowElement = globalThis.document.createElement('div');
        const previousRowElement = globalThis.document.createElement('div');
        const previousRow = {
            getData: () => ({ id: 2, _state: 'clean' }),
            getElement: () => previousRowElement
        };
        const currentRow = {
            getData: () => ({ id: 1, _state: 'new' }),
            getElement: () => currentRowElement,
            getNextRow: () => null,
            getPrevRow: () => previousRow
        };
        const cell = {
            getRow: () => currentRow
        };

        previousRowElement.append(controller.column.formatter({ getRow: () => previousRow }));

        const container = controller.column.editor(cell, callback => callback(), vi.fn(), vi.fn());
        currentRowElement.append(container);

        await clickButton(container.querySelector('.amb-row-action-button'));
        await flushDeferred();

        expect(globalThis.document.activeElement.dataset.action).toBe('delete');
        expect(previousRowElement.contains(globalThis.document.activeElement)).toBe(true);
    });

    test('after remove-new, focus falls back to the table element without errors when no rows remain', async () => {
        const crud = createCrud();
        const controller = createDeleteColumn(
            {},
            () => crud,
            { confirm: () => Promise.resolve(true) }
        );
        const tableElement = globalThis.document.createElement('div');
        const currentRowElement = globalThis.document.createElement('div');
        const currentRow = {
            getData: () => ({ id: 1, _state: 'new' }),
            getElement: () => currentRowElement,
            getNextRow: () => null,
            getPrevRow: () => null,
            getTable: () => ({
                getElement: () => tableElement
            })
        };
        const cell = {
            getRow: () => currentRow
        };
        const container = controller.column.editor(cell, callback => callback(), vi.fn(), vi.fn());

        currentRowElement.append(container);

        await clickButton(container.querySelector('.amb-row-action-button'));
        await flushDeferred();

        expect(crud.deleteRow).toHaveBeenCalledWith(1);
        expect(globalThis.document.activeElement).toBe(tableElement);
    });
});

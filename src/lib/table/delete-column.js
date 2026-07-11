import { navigateEditableCellAfterClose } from '../editors/shared.js';
import { ROW_STATE } from '../crud-helper.js';

const ACTION_BUTTON_SELECTOR = '.amb-row-action-button';

export const createDeleteColumn = (deleteColumn, getCrud, confirmDialog) => {
    const confirmDeleteMessage = deleteColumn.confirmDeleteMessage || deleteColumn.confirmMessage;
    const confirmRollbackMessage = deleteColumn.confirmRollbackMessage;
    const confirmRemoveNewMessage = deleteColumn.confirmRemoveNewMessage;
    const confirmProvider = deleteColumn.confirmProvider;
    const actions = {
        delete: true,
        rollback: true,
        removeNew: true,
        ...deleteColumn.actions
    };
    const icons = {
        delete: '🗑',
        rollback: '↶',
        removeNew: '×',
        ...deleteColumn.icons
    };
    const labels = {
        delete: 'Delete row',
        rollback: 'Rollback row',
        removeNew: 'Remove new row',
        ...deleteColumn.labels
    };

    const getRowState = row => {
        const crud = getCrud();
        const data = row.getData();
        const stateField = crud ? crud.options.stateField : '_state';

        return data[stateField] || ROW_STATE.CLEAN;
    };

    const getRowIdentifier = (crud, data) => {
        const id = data[crud.options.idField];

        if (id !== null && id !== undefined && id !== '') return id;

        return data[crud.options.tempIdField];
    };

    const getActionConfig = state => {
        if (state === ROW_STATE.NEW) {
            if (!actions.removeNew) return null;

            return {
                action: 'remove-new',
                icon: icons.removeNew,
                label: labels.removeNew,
                className: 'amb-row-action-button--remove-new'
            };
        }

        if (state === ROW_STATE.MODIFIED || state === ROW_STATE.DELETED) {
            if (!actions.rollback) return null;

            return {
                action: 'rollback',
                icon: icons.rollback,
                label: labels.rollback,
                className: 'amb-row-action-button--rollback'
            };
        }

        if (!actions.delete) return null;

        return {
            action: 'delete',
            icon: icons.delete,
            label: labels.delete,
            className: 'amb-row-action-button--delete'
        };
    };

    const stopActionEvent = event => {
        if (!event) return;

        if (typeof event.preventDefault === 'function') {
            event.preventDefault();
        }

        if (typeof event.stopPropagation === 'function') {
            event.stopPropagation();
        }

        if (typeof event.stopImmediatePropagation === 'function') {
            event.stopImmediatePropagation();
        }
    };

    const createActionsContainer = (state, options = {}) => {
        const container = document.createElement('div');
        const config = getActionConfig(state);

        container.className = 'amb-row-actions';

        if (!config) return container;

        const button = document.createElement('button');

        button.type = 'button';
        button.className = `amb-row-action-button ${config.className}`;
        button.dataset.action = config.action;
        button.textContent = config.icon;
        button.setAttribute('aria-label', config.label);
        button.title = config.label;

        if (typeof options.onButtonClick === 'function') {
            button.addEventListener('click', options.onButtonClick);
        }

        if (typeof options.onButtonKeydown === 'function') {
            button.addEventListener('keydown', options.onButtonKeydown);
        }

        container.append(button);

        return container;
    };

    const updateRowButton = row => {
        const rowElement = row && row.getElement && row.getElement();
        const container = rowElement && rowElement.querySelector('.amb-row-actions');

        if (!container) return;

        container.replaceWith(createActionsContainer(getRowState(row)));
    };

    const scheduleRowButtonUpdate = row => {
        globalThis.setTimeout(() => {
            updateRowButton(row);
        }, 0);
    };

    const requestConfirmation = async ({ action, message, row, state, id }) => {
        if (!message) return true;

        if (typeof confirmProvider === 'function') {
            return Boolean(await confirmProvider({ action, message, row, state, id }));
        }

        return confirmDialog.confirm({ message });
    };

    const executeAction = async ({ action, row, event }) => {
        const crud = getCrud();

        if (!crud || !row) return false;

        stopActionEvent(event);

        const data = row.getData();
        const identifier = getRowIdentifier(crud, data);
        const state = getRowState(row);

        if (action === 'remove-new' && state === ROW_STATE.NEW) {
            const confirmed = await requestConfirmation({
                action: 'remove-new',
                message: confirmRemoveNewMessage,
                row,
                state,
                id: identifier
            });

            if (!confirmed) return false;

            crud.deleteRow(identifier);
            scheduleRowButtonUpdate(row);
            return true;
        }

        if (action === 'rollback' && (state === ROW_STATE.MODIFIED || state === ROW_STATE.DELETED)) {
            const confirmed = await requestConfirmation({
                action: 'rollback',
                message: confirmRollbackMessage,
                row,
                state,
                id: identifier
            });

            if (!confirmed) return false;

            crud.rollbackRow(identifier);
            scheduleRowButtonUpdate(row);
            return true;
        }

        if (
            action !== 'delete'
            || (state !== ROW_STATE.CLEAN && state !== ROW_STATE.SAVED)
        ) {
            return false;
        }

        const confirmed = await requestConfirmation({
            action: 'delete',
            message: confirmDeleteMessage,
            row,
            state,
            id: identifier
        });

        if (!confirmed) return false;

        crud.deleteRow(identifier);
        scheduleRowButtonUpdate(row);
        return true;
    };

    const createActionEditor = (cell, onRendered, _success, cancel) => {
        const row = cell.getRow();
        const state = getRowState(row);

        if (!getActionConfig(state)) return false;

        let closed = false;
        const closeEditor = () => {
            if (closed) return;

            closed = true;
            cancel();
        };
        const container = createActionsContainer(state, {
            onButtonClick: async event => {
                const action = event.currentTarget && event.currentTarget.dataset.action;

                closeEditor();
                await executeAction({ action, row, event });
            },
            onButtonKeydown: event => {
                if (event.key !== 'Tab') return;

                stopActionEvent(event);
                closeEditor();
                navigateEditableCellAfterClose(cell, event.shiftKey ? 'prev' : 'next');
            }
        });

        onRendered(() => {
            const button = container.querySelector(ACTION_BUTTON_SELECTOR);

            if (button && typeof button.focus === 'function') {
                button.focus();
            }
        });

        container.addEventListener('focusout', event => {
            if (event.relatedTarget && container.contains(event.relatedTarget)) return;

            closeEditor();
        });

        return container;
    };

    return {
        column: {
            width: deleteColumn.width || 55,
            hozAlign: 'center',
            headerSort: false,
            _ambInteractive: true,
            _ambFocusSelector: ACTION_BUTTON_SELECTOR,
            editor: createActionEditor,
            formatter: cell => {
                return createActionsContainer(getRowState(cell.getRow()));
            },
            cellClick: async (event, cell) => {
                const target = event.target;
                const actionElement = target && typeof target.closest === 'function'
                    ? target.closest('[data-action]')
                    : null;

                if (!actionElement) return;

                const row = cell.getRow();
                const action = actionElement.dataset.action;

                await executeAction({ action, row, event });
            }
        },
        updateRowButton
    };
};

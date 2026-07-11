import { navigateEditableCellAfterClose } from '../editors/shared.js';
import { ROW_STATE } from '../crud-helper.js';

const ACTION_BUTTON_SELECTOR = '.amb-row-action-button';
const PAGINATED_REMOVE_FOCUS_ATTEMPTS = 8;

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

    const buttonMatchesAction = (button, action) => {
        return !action || button && button.dataset && button.dataset.action === action;
    };

    const focusRowActionButton = (row, expectedAction = null) => {
        const cells = row && typeof row.getCells === 'function'
            ? row.getCells()
            : [];
        const actionCell = cells.find(candidate => {
            const definition = candidate
                && candidate.getColumn
                && candidate.getColumn()
                && candidate.getColumn().getDefinition
                && candidate.getColumn().getDefinition();
            const cellElement = candidate
                && typeof candidate.getElement === 'function'
                ? candidate.getElement()
                : null;

            return definition && definition._ambFocusSelector === ACTION_BUTTON_SELECTOR
                || Boolean(cellElement && cellElement.querySelector(ACTION_BUTTON_SELECTOR));
        });
        const cellElement = actionCell && typeof actionCell.getElement === 'function'
            ? actionCell.getElement()
            : null;
        const cellButton = cellElement && cellElement.querySelector(ACTION_BUTTON_SELECTOR);

        if (
            cellButton
            && buttonMatchesAction(cellButton, expectedAction)
            && typeof cellButton.focus === 'function'
        ) {
            cellButton.focus();
            return true;
        }

        const rowElement = row && row.getElement && row.getElement();
        const button = rowElement && rowElement.querySelector(ACTION_BUTTON_SELECTOR);

        if (
            !button
            || !buttonMatchesAction(button, expectedAction)
            || typeof button.focus !== 'function'
        ) {
            return false;
        }

        button.focus();
        return true;
    };

    const focusTableFallback = row => {
        const table = row && typeof row.getTable === 'function'
            ? row.getTable()
            : null;
        const tableElement = table && (
            typeof table.getElement === 'function'
                ? table.getElement()
                : table.element
        );

        if (tableElement && typeof tableElement.focus === 'function') {
            tableElement.focus();
        }
    };

    const getTableFromRow = row => {
        return row && typeof row.getTable === 'function'
            ? row.getTable()
            : null;
    };

    const isRowTablePaginated = row => {
        const table = getTableFromRow(row);

        return Boolean(table && table.options && table.options.pagination);
    };

    const getRowsFromTable = (table, scope) => {
        if (!table || typeof table.getRows !== 'function') return [];

        const rows = scope === undefined
            ? table.getRows()
            : table.getRows(scope);

        return Array.isArray(rows) ? rows : [];
    };

    const getVisibleActionFallbackRow = row => {
        const table = getTableFromRow(row);
        const scopes = isRowTablePaginated(row)
            ? ['visible']
            : ['visible', 'active', undefined];
        const rows = scopes.flatMap(scope => getRowsFromTable(table, scope))
            .filter(candidate => candidate && candidate !== row);

        for (let index = rows.length - 1; index >= 0; index -= 1) {
            if (focusRowActionButton(rows[index])) return true;
        }

        return false;
    };

    const getRemoveFallbackRow = row => {
        if (!row) return null;

        if (typeof row.getNextRow === 'function') {
            const nextRow = row.getNextRow();

            if (nextRow) return nextRow;
        }

        if (typeof row.getPrevRow === 'function') {
            const previousRow = row.getPrevRow();

            if (previousRow) return previousRow;
        }

        return null;
    };

    const restoreActionFocus = (row, fallbackRow = null, options = {}, attempts = 4) => {
        globalThis.setTimeout(() => {
            if (!options.skipRow && focusRowActionButton(row, options.expectedAction || null)) return;
            if (fallbackRow && focusRowActionButton(fallbackRow)) return;
            if (options.skipRow && !fallbackRow) {
                if (getVisibleActionFallbackRow(row)) return;

                if (!isRowTablePaginated(row) || attempts <= 0) {
                    focusTableFallback(row);
                    return;
                }
            }

            if (attempts > 0) {
                restoreActionFocus(row, fallbackRow, options, attempts - 1);
                return;
            }

            focusTableFallback(row || fallbackRow);
        }, 0);
    };

    const scheduleRowButtonUpdate = (row, options = {}) => {
        globalThis.setTimeout(() => {
            updateRowButton(row);

            if (options.restoreFocus) {
                restoreActionFocus(row, options.fallbackRow || null, {
                    expectedAction: options.expectedAction || null
                });
            }
        }, 0);
    };

    const restoreActionCell = (cell, row, expectedAction) => {
        if (!cell || typeof cell.edit !== 'function') {
            scheduleRowButtonUpdate(row, {
                expectedAction,
                restoreFocus: true
            });
            return;
        }

        globalThis.setTimeout(() => {
            const editResult = cell.edit();

            if (editResult !== false) return;

            scheduleRowButtonUpdate(row, {
                expectedAction,
                restoreFocus: true
            });
        }, 0);
    };

    const requestConfirmation = async ({ action, message, row, state, id }) => {
        if (!message) return true;

        if (typeof confirmProvider === 'function') {
            return Boolean(await confirmProvider({ action, message, row, state, id }));
        }

        return confirmDialog.confirm({ message });
    };

    const findCurrentRow = (crud, identifier, fallbackRow) => {
        if (crud && typeof crud.findRowByKey === 'function') {
            return crud.findRowByKey(identifier) || fallbackRow;
        }

        return fallbackRow;
    };

    const executeAction = async ({ action, row, event, cell }) => {
        const crud = getCrud();

        if (!crud || !row) return false;

        stopActionEvent(event);

        const data = row.getData();
        const identifier = getRowIdentifier(crud, data);
        const state = getRowState(row);
        const removeFallbackRow = state === ROW_STATE.NEW
            ? getRemoveFallbackRow(row)
            : null;

        if (action === 'remove-new' && state === ROW_STATE.NEW) {
            const confirmed = await requestConfirmation({
                action: 'remove-new',
                message: confirmRemoveNewMessage,
                row,
                state,
                id: identifier
            });

            if (!confirmed) {
                restoreActionFocus(row);
                return false;
            }

            crud.deleteRow(identifier);
            restoreActionFocus(row, removeFallbackRow, { skipRow: true }, PAGINATED_REMOVE_FOCUS_ATTEMPTS);
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

            if (!confirmed) {
                restoreActionFocus(row);
                return false;
            }

            crud.rollbackRow(identifier);
            restoreActionCell(cell, findCurrentRow(crud, identifier, row), 'delete');
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

        if (!confirmed) {
            restoreActionFocus(row);
            return false;
        }

        crud.deleteRow(identifier);
        restoreActionCell(cell, findCurrentRow(crud, identifier, row), 'rollback');
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
                await executeAction({ action, row, event, cell });
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

                await executeAction({ action, row, event, cell });
            }
        },
        updateRowButton
    };
};

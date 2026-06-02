import { TabulatorFull as Tabulator } from 'tabulator-tables';
import { CrudHelper, ROW_STATE } from './crud-helper.js';
import { CellMessageBinder } from '../ui/cell-message-binder.js';
import { FloatingMessage } from '../ui/floating-message.js';

const DEFAULT_MESSAGES = {
    required: 'This field is required'
};

const extractColumnValidators = (columns, messages = DEFAULT_MESSAGES) => {
    const validators = [];

    const normalizedColumns = (columns || []).map(column => {
        const {
            validator,
            required,
            requiredMessage,
            columns: childColumns,
            ...tabulatorColumn
        } = column;

        if (required && column.field) {
            validators.push({
                field: column.field,
                message: requiredMessage || messages.required || DEFAULT_MESSAGES.required,
                validate: value => {
                    if (value === null || value === undefined) return false;
                    if (typeof value === 'string') return value.trim() !== '';

                    return true;
                }
            });
        }

        if (validator && column.field) {
            validators.push({
                field: column.field,
                message: validator.message,
                validate: validator.validate
            });
        }

        if (childColumns) {
            const childExtraction = extractColumnValidators(childColumns, messages);

            tabulatorColumn.columns = childExtraction.columns;
            validators.push(...childExtraction.validators);
        }

        return tabulatorColumn;
    });

    return {
        columns: normalizedColumns,
        validators
    };
};

const createDeleteColumn = (deleteColumn, getCrud) => {
    const confirmDeleteMessage = deleteColumn.confirmDeleteMessage || deleteColumn.confirmMessage;
    const confirmRollbackMessage = deleteColumn.confirmRollbackMessage;

    const getRowState = row => {
        const crud = getCrud();
        const data = row.getData();
        const stateField = crud ? crud.options.stateField : '_state';

        return data[stateField] || ROW_STATE.CLEAN;
    };

    const getButtonConfig = state => {
        if (state === ROW_STATE.NEW) {
            return {
                text: '×',
                label: 'Remove new row',
                className: 'teh-delete-button--remove'
            };
        }

        if (state === ROW_STATE.MODIFIED) {
            return {
                text: '↶',
                label: 'Rollback modified row',
                className: 'teh-delete-button--rollback'
            };
        }

        if (state === ROW_STATE.DELETED) {
            return {
                text: '↶',
                label: 'Rollback deleted row',
                className: 'teh-delete-button--rollback'
            };
        }

        return {
            text: '🗑',
            label: 'Delete row',
            className: 'teh-delete-button--delete'
        };
    };

    const updateRowButton = row => {
        const rowElement = row && row.getElement && row.getElement();
        const button = rowElement && rowElement.querySelector('.teh-delete-button');

        if (!button) return;

        const state = getRowState(row);
        const config = getButtonConfig(state);

        button.classList.remove(
            'teh-delete-button--delete',
            'teh-delete-button--rollback',
            'teh-delete-button--remove'
        );
        button.classList.add(config.className);
        button.textContent = config.text;
        button.setAttribute('aria-label', config.label);
    };

    const scheduleRowButtonUpdate = row => {
        window.setTimeout(() => {
            updateRowButton(row);
        }, 0);
    };

    return {
        column: {
            width: deleteColumn.width || 55,
            hozAlign: 'center',
            headerSort: false,
            formatter: cell => {
                const state = getRowState(cell.getRow());
                const config = getButtonConfig(state);
                const button = document.createElement('button');

                button.type = 'button';
                button.className = `teh-delete-button ${config.className}`;
                button.textContent = config.text;
                button.setAttribute('aria-label', config.label);

                return button;
            },
            cellClick: (event, cell) => {
                event.preventDefault();
                event.stopPropagation();

                const crud = getCrud();

                if (!crud) return;

                const row = cell.getRow();
                const data = row.getData();
                const id = data[crud.options.idField];
                const state = getRowState(row);

                if (state === ROW_STATE.NEW) {
                    crud.deleteRow(id);
                    scheduleRowButtonUpdate(row);
                    return;
                }

                if (state === ROW_STATE.MODIFIED || state === ROW_STATE.DELETED) {
                    if (confirmRollbackMessage && !window.confirm(confirmRollbackMessage)) {
                        return;
                    }

                    crud.rollbackRow(id);
                    scheduleRowButtonUpdate(row);
                    return;
                }

                if (confirmDeleteMessage && !window.confirm(confirmDeleteMessage)) {
                    return;
                }

                crud.deleteRow(id);
                scheduleRowButtonUpdate(row);
            }
        },
        updateRowButton
    };
};

export const TEH = {
    table(options = {}) {
        const { selector, columns, messages, deleteColumn, ...tabulatorOptions } = options;
        const normalizedMessages = {
            ...DEFAULT_MESSAGES,
            ...messages
        };
        const extracted = extractColumnValidators(columns, normalizedMessages);
        const normalizedOptions = { ...tabulatorOptions };
        let crud = null;
        let unsubscribeDeleteColumn = null;
        const deleteColumnController = deleteColumn && deleteColumn.enabled
            ? createDeleteColumn(deleteColumn, () => crud)
            : null;

        if (columns) {
            normalizedOptions.columns = deleteColumnController
                ? [
                    deleteColumnController.column,
                    ...extracted.columns
                ]
                : extracted.columns;
        }

        const table = new Tabulator(selector, normalizedOptions);
        crud = new CrudHelper(table);
        const floatingMessage = new FloatingMessage();
        const cellMessageBinder = new CellMessageBinder(crud, floatingMessage);

        if (deleteColumnController) {
            unsubscribeDeleteColumn = crud.on('row-state-changed', ({ row }) => {
                deleteColumnController.updateRowButton(row);
            });
        }

        extracted.validators.forEach(validator => {
            if (typeof validator.validate !== 'function') return;

            crud.addCellValidator(validator.field, validator.message, validator.validate);
        });

        return {
            table,
            crud,
            floatingMessage,
            cellMessageBinder,
            destroy() {
                if (unsubscribeDeleteColumn) {
                    unsubscribeDeleteColumn();
                    unsubscribeDeleteColumn = null;
                }

                cellMessageBinder.destroy();
                floatingMessage.destroy();

                if (typeof table.destroy === 'function') {
                    table.destroy();
                }
            }
        };
    }
};

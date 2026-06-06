import { TabulatorFull as Tabulator } from 'tabulator-tables';
import { CrudHelper, ROW_STATE } from './crud-helper.js';
import { CellMessageBinder } from '../ui/cell-message-binder.js';
import { FloatingMessage } from '../ui/floating-message.js';
import { ConfirmDialog } from '../ui/confirm-dialog.js';
import { LookupDialog } from '../ui/lookup-dialog.js';
import { validators } from './validators.js';
import { formatters } from './formatters.js';
import { editors } from './editors.js';
import { parsers } from './parsers.js';
import { createLookup } from './lookup.js';

const DEFAULT_MESSAGES = {
    required: 'This field is required'
};

const DEFAULT_VALIDATION_MESSAGES = {
    date: 'Invalid date',
    decimal: 'Invalid decimal value',
    email: 'Invalid email address',
    integer: 'Value must be an integer',
    number: 'Value must be a number',
    pattern: 'Invalid format',
    custom: 'Invalid value'
};

const createRangeMessage = (min, max) => {
    return `Value must be between ${min} and ${max}`;
};

const createMinMessage = minValue => {
    return `Value must be at least ${minValue}`;
};

const createMaxMessage = maxValue => {
    return `Value must be at most ${maxValue}`;
};

const createMinLengthMessage = length => {
    return `Minimum length is ${length}`;
};

const createMaxLengthMessage = length => {
    return `Maximum length is ${length}`;
};

const extractValidationRules = (field, validation = {}, messages = DEFAULT_MESSAGES) => {
    const extractedValidators = [];

    if (!field || !validation) return extractedValidators;

    if (validation.required) {
        const requiredMessage = validation.required.message
            || messages.required
            || DEFAULT_MESSAGES.required;

        extractedValidators.push(validators.required(requiredMessage));
    }

    if (validation.pattern) {
        const regex = validation.pattern instanceof RegExp
            ? validation.pattern
            : validation.pattern.regex;
        const message = validation.pattern.message || DEFAULT_VALIDATION_MESSAGES.pattern;

        if (regex) {
            extractedValidators.push(validators.pattern(regex, message));
        }
    }

    if (validation.email) {
        const message = validation.email.message || DEFAULT_VALIDATION_MESSAGES.email;

        extractedValidators.push(validators.email(message));
    }

    if (validation.number) {
        const message = validation.number.message || DEFAULT_VALIDATION_MESSAGES.number;

        extractedValidators.push(validators.number(message));
    }

    if (validation.integer) {
        const message = validation.integer === true
            ? DEFAULT_VALIDATION_MESSAGES.integer
            : validation.integer.message || DEFAULT_VALIDATION_MESSAGES.integer;

        extractedValidators.push(validators.integer(message));
    }

    if (validation.decimal) {
        const decimalValidation = validation.decimal === true
            ? {}
            : validation.decimal;
        const { message, ...decimalOptions } = decimalValidation;

        extractedValidators.push(validators.decimal(
            decimalOptions,
            message || DEFAULT_VALIDATION_MESSAGES.decimal
        ));
    }

    if (validation.date) {
        const dateValidation = validation.date === true
            ? {}
            : validation.date;
        const { message, ...dateOptions } = dateValidation;

        extractedValidators.push(validators.date(
            dateOptions,
            message || DEFAULT_VALIDATION_MESSAGES.date
        ));
    }

    if (validation.range) {
        const { min, max, message } = validation.range;

        extractedValidators.push(validators.range(
            min,
            max,
            message || createRangeMessage(min, max)
        ));
    }

    if (validation.min !== undefined) {
        const minValue = typeof validation.min === 'number'
            ? validation.min
            : validation.min.value;
        const message = validation.min.message || createMinMessage(minValue);

        extractedValidators.push(validators.min(minValue, message));
    }

    if (validation.max !== undefined) {
        const maxValue = typeof validation.max === 'number'
            ? validation.max
            : validation.max.value;
        const message = validation.max.message || createMaxMessage(maxValue);

        extractedValidators.push(validators.max(maxValue, message));
    }

    if (validation.minLength !== undefined) {
        const length = typeof validation.minLength === 'number'
            ? validation.minLength
            : validation.minLength.value;
        const message = validation.minLength.message || createMinLengthMessage(length);

        extractedValidators.push(validators.minLength(length, message));
    }

    if (validation.maxLength !== undefined) {
        const length = typeof validation.maxLength === 'number'
            ? validation.maxLength
            : validation.maxLength.value;
        const message = validation.maxLength.message || createMaxLengthMessage(length);

        extractedValidators.push(validators.maxLength(length, message));
    }

    if (validation.custom && typeof validation.custom.validate === 'function') {
        extractedValidators.push(validators.custom(
            validation.custom.message || DEFAULT_VALIDATION_MESSAGES.custom,
            validation.custom.validate
        ));
    }

    return extractedValidators;
};

const extractColumnValidators = (columns, messages = DEFAULT_MESSAGES) => {
    const extractedValidators = [];

    const normalizedColumns = (columns || []).map(column => {
        const {
            validator,
            validation,
            required,
            requiredMessage,
            columns: childColumns,
            ...tabulatorColumn
        } = column;

        if (required && column.field) {
            extractedValidators.push({
                field: column.field,
                ...validators.required(requiredMessage || messages.required || DEFAULT_MESSAGES.required)
            });
        }

        extractValidationRules(column.field, validation, messages).forEach(extractedValidator => {
            extractedValidators.push({
                field: column.field,
                ...extractedValidator
            });
        });

        if (validator && column.field) {
            extractedValidators.push({
                field: column.field,
                message: validator.message,
                validate: validator.validate
            });
        }

        if (childColumns) {
            const childExtraction = extractColumnValidators(childColumns, messages);

            tabulatorColumn.columns = childExtraction.columns;
            extractedValidators.push(...childExtraction.validators);
        }

        return tabulatorColumn;
    });

    return {
        columns: normalizedColumns,
        validators: extractedValidators
    };
};

const createDeleteColumn = (deleteColumn, getCrud, confirmDialog) => {
    const confirmDeleteMessage = deleteColumn.confirmDeleteMessage || deleteColumn.confirmMessage;
    const confirmRollbackMessage = deleteColumn.confirmRollbackMessage;
    const confirmRemoveNewMessage = deleteColumn.confirmRemoveNewMessage;
    const confirmProvider = deleteColumn.confirmProvider;

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

    const requestConfirmation = async ({ action, message, row, state, id }) => {
        if (!message) return true;

        if (typeof confirmProvider === 'function') {
            return Boolean(await confirmProvider({ action, message, row, state, id }));
        }

        return confirmDialog.confirm({ message });
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
            cellClick: async (event, cell) => {
                event.preventDefault();
                event.stopPropagation();

                const crud = getCrud();

                if (!crud) return;

                const row = cell.getRow();
                const data = row.getData();
                const id = data[crud.options.idField];
                const state = getRowState(row);

                if (state === ROW_STATE.NEW) {
                    const confirmed = await requestConfirmation({
                        action: 'remove-new',
                        message: confirmRemoveNewMessage,
                        row,
                        state,
                        id
                    });

                    if (!confirmed) {
                        return;
                    }

                    crud.deleteRow(id);
                    scheduleRowButtonUpdate(row);
                    return;
                }

                if (state === ROW_STATE.MODIFIED || state === ROW_STATE.DELETED) {
                    const confirmed = await requestConfirmation({
                        action: 'rollback',
                        message: confirmRollbackMessage,
                        row,
                        state,
                        id
                    });

                    if (!confirmed) {
                        return;
                    }

                    crud.rollbackRow(id);
                    scheduleRowButtonUpdate(row);
                    return;
                }

                const confirmed = await requestConfirmation({
                    action: 'delete',
                    message: confirmDeleteMessage,
                    row,
                    state,
                    id
                });

                if (!confirmed) {
                    return;
                }

                crud.deleteRow(id);
                scheduleRowButtonUpdate(row);
            }
        },
        updateRowButton
    };
};

export const AMB = {
    validators,
    formatters,
    editors,
    parsers,
    lookup: createLookup,
    LookupDialog,

    table(options = {}) {
        const { selector, columns, messages, deleteColumn, errorStyle, ...tabulatorOptions } = options;
        const normalizedMessages = {
            ...DEFAULT_MESSAGES,
            ...messages
        };
        const extracted = extractColumnValidators(columns, normalizedMessages);
        const normalizedOptions = { ...tabulatorOptions };
        let crud = null;
        let unsubscribeDeleteColumn = null;
        const confirmDialog = new ConfirmDialog();
        const deleteColumnController = deleteColumn && deleteColumn.enabled
            ? createDeleteColumn(deleteColumn, () => crud, confirmDialog)
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
        crud = new CrudHelper(table, { errorStyle });
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
            confirmDialog,
            destroy() {
                if (unsubscribeDeleteColumn) {
                    unsubscribeDeleteColumn();
                    unsubscribeDeleteColumn = null;
                }

                cellMessageBinder.destroy();
                floatingMessage.destroy();
                confirmDialog.destroy();

                if (typeof table.destroy === 'function') {
                    table.destroy();
                }
            }
        };
    }
};

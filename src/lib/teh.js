import { TabulatorFull as Tabulator } from 'tabulator-tables';
import { CrudHelper } from './crud-helper.js';
import { CellMessageBinder } from '../ui/cell-message-binder.js';
import { FloatingMessage } from '../ui/floating-message.js';

const extractColumnValidators = columns => {
    const validators = [];

    const normalizedColumns = (columns || []).map(column => {
        const { validator, columns: childColumns, ...tabulatorColumn } = column;

        if (validator && column.field) {
            validators.push({
                field: column.field,
                message: validator.message,
                validate: validator.validate
            });
        }

        if (childColumns) {
            const childExtraction = extractColumnValidators(childColumns);

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

export const TEH = {
    table(options = {}) {
        const { selector, columns, ...tabulatorOptions } = options;
        const extracted = extractColumnValidators(columns);
        const normalizedOptions = { ...tabulatorOptions };

        if (columns) {
            normalizedOptions.columns = extracted.columns;
        }

        const table = new Tabulator(selector, normalizedOptions);
        const crud = new CrudHelper(table);
        const floatingMessage = new FloatingMessage();
        const cellMessageBinder = new CellMessageBinder(crud, floatingMessage);

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
                cellMessageBinder.destroy();
                floatingMessage.destroy();

                if (typeof table.destroy === 'function') {
                    table.destroy();
                }
            }
        };
    }
};

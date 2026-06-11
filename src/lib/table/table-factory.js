import { TabulatorFull as Tabulator } from 'tabulator-tables';
import { CrudHelper } from '../crud-helper.js';
import { CellMessageBinder } from '../../ui/cell-message-binder.js';
import { FloatingMessage } from '../../ui/floating-message.js';
import { ConfirmDialog } from '../../ui/confirm-dialog.js';
import { DEFAULT_MESSAGES, extractColumnValidators } from './validation-extraction.js';
import { createDeleteColumn } from './delete-column.js';
import { createSelectionColumn } from './selection-column.js';
import { createSearchController } from './search-controller.js';
import { createLargeTextBinder, createLookupDescriptionBinder } from './hover-binders.js';

const configureLookupEditors = (columns, getCrud) => {
    const getCrudRowIdentifier = (crud, data) => {
        if (!crud || !data) return null;

        const id = data[crud.options.idField];

        if (id !== null && id !== undefined && id !== '') return id;

        return data[crud.options.tempIdField];
    };

    (columns || []).forEach(column => {
        if (
            column.editor
            && column.editor._ambEditorType === 'lookup'
            && typeof column.editor._ambSetLookupErrorHandlers === 'function'
        ) {
            column.editor._ambSetLookupErrorHandlers({
                markInvalid(cell, message) {
                    const crud = getCrud();
                    const row = cell && cell.getRow && cell.getRow();
                    const data = row && row.getData ? row.getData() : null;
                    const identifier = getCrudRowIdentifier(crud, data);
                    const field = cell && cell.getField && cell.getField();

                    if (!crud || identifier === null || identifier === undefined || !field) return;

                    crud.markCellError(identifier, field, message);
                },
                clearInvalid(cell) {
                    const crud = getCrud();
                    const row = cell && cell.getRow && cell.getRow();
                    const data = row && row.getData ? row.getData() : null;
                    const identifier = getCrudRowIdentifier(crud, data);
                    const field = cell && cell.getField && cell.getField();

                    if (!crud || identifier === null || identifier === undefined || !field) return;

                    crud.clearCellError(identifier, field);
                }
            });
        }

        if (column.columns) {
            configureLookupEditors(column.columns, getCrud);
        }
    });
};

/**
 * Create an AMB-managed Tabulator table.
 *
 * The returned object exposes the raw Tabulator instance as `table` and a
 * CrudHelper instance as `crud`. AMB.table also wires column validators into
 * CrudHelper, optional delete and selection columns, lookup hover messages,
 * large text hover previews, and optional table search.
 *
 * Column validators can be provided with `validator`, `required`, or a
 * structured `validation` object. Most validators do not imply required:
 * use `required: true`, `validation.required`, or `AMB.validators.required()`
 * when empty values should fail validation.
 *
 * @param {object} options - AMB table and Tabulator options.
 * @param {string|HTMLElement} options.selector - CSS selector or element passed to Tabulator.
 * @param {object[]} [options.data] - Initial row data.
 * @param {object[]} [options.columns] - Tabulator columns plus AMB validation metadata.
 * @param {object} [options.deleteColumn] - Optional row action column.
 * @param {boolean} [options.deleteColumn.enabled=false] - Add the delete/rollback/remove column.
 * @param {string} [options.deleteColumn.confirmDeleteMessage] - Confirmation text before deleting a clean row.
 * @param {string} [options.deleteColumn.confirmRollbackMessage] - Confirmation text before rolling back a changed row.
 * @param {string} [options.deleteColumn.confirmRemoveNewMessage] - Confirmation text before removing an unsaved row.
 * @param {Function} [options.deleteColumn.confirmProvider] - Custom async confirmation function.
 * @param {object} [options.selectionColumn] - Optional row selection column.
 * @param {boolean} [options.selectionColumn.enabled=false] - Add a row selection column.
 * @param {'single'|'multiple'} [options.selectionColumn.mode='multiple'] - Selection mode.
 * @param {number} [options.selectionColumn.width=45] - Selection column width.
 * @param {object} [options.search] - Optional client-side search toolbar.
 * @param {boolean} [options.search.enabled=false] - Show the search toolbar.
 * @param {string} [options.search.placeholder='Search...'] - Search input placeholder.
 * @param {object} [options.search.filters] - Search field filter options.
 * @param {boolean} [options.search.filters.enabled=false] - Show the filters button.
 * @param {object} [options.messages] - Shared UI and validation messages.
 * @param {string} [options.messages.required='This field is required'] - Default required message.
 * @returns {{
 *   table: object,
 *   crud: CrudHelper,
 *   getSelectedRows: Function,
 *   clearSelection: Function,
 *   selectRow: Function,
 *   deselectRow: Function,
 *   setSearchQuery: Function,
 *   clearSearch: Function,
 *   getSearchState: Function,
 *   setSearchFields: Function,
 *   destroy: Function
 * }} AMB table controller.
 *
 * Underscored fields on the returned controller are internal integration
 * objects and are not part of the stable public API.
 * @example
 * const grid = AMB.table({
 *   selector: '#people',
 *   data: [],
 *   columns: [
 *     { title: 'Name', field: 'name', editor: AMB.editors.text(), required: true }
 *   ]
 * });
 */
export function createTable(options = {}) {
    const {
        selector,
        columns,
        messages,
        deleteColumn,
        selectionColumn,
        search,
        errorStyle,
        ...tabulatorOptions
    } = options;
    const normalizedMessages = {
        ...DEFAULT_MESSAGES,
        ...messages
    };
    const extracted = extractColumnValidators(columns, normalizedMessages);
    const normalizedOptions = { ...tabulatorOptions };
    let crud = null;
    let unsubscribeDeleteColumn = null;
    let unsubscribeLookupDescriptions = null;
    let unsubscribeLargeText = null;
    let searchController = null;
    const confirmDialog = new ConfirmDialog();
    const selectionColumnController = createSelectionColumn(selectionColumn);
    const deleteColumnController = deleteColumn && deleteColumn.enabled
        ? createDeleteColumn(deleteColumn, () => crud, confirmDialog)
        : null;

    if (selectionColumnController && normalizedOptions.selectableRows === undefined) {
        normalizedOptions.selectableRows = selectionColumnController.selectableRows;
    }

    if (columns) {
        normalizedOptions.columns = [
            ...(selectionColumnController ? [selectionColumnController.column] : []),
            ...(deleteColumnController ? [deleteColumnController.column] : []),
            ...extracted.columns
        ];

        configureLookupEditors(normalizedOptions.columns, () => crud);
    }

    const table = new Tabulator(selector, normalizedOptions);
    crud = new CrudHelper(table, { errorStyle });
    const floatingMessage = new FloatingMessage();
    const cellMessageBinder = new CellMessageBinder(crud, floatingMessage);
    unsubscribeLookupDescriptions = createLookupDescriptionBinder(table, floatingMessage);
    unsubscribeLargeText = createLargeTextBinder(table, floatingMessage);
    searchController = createSearchController({
        selector,
        search,
        columns: extracted.columns,
        table,
        floatingMessage
    });

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
        /**
         * @private
         * @internal
         */
        _floatingMessage: floatingMessage,
        /**
         * @private
         * @internal
         */
        _cellMessageBinder: cellMessageBinder,
        /**
         * @private
         * @internal
         */
        _confirmDialog: confirmDialog,
        getSelectedRows() {
            return typeof table.getSelectedData === 'function'
                ? table.getSelectedData()
                : [];
        },
        clearSelection() {
            if (typeof table.deselectRow === 'function') {
                table.deselectRow();
            }
        },
        selectRow(identifier) {
            const row = crud.findRowByKey(identifier);

            if (!row || typeof row.select !== 'function') return false;

            row.select();
            return true;
        },
        deselectRow(identifier) {
            const row = crud.findRowByKey(identifier);

            if (!row || typeof row.deselect !== 'function') return false;

            row.deselect();
            return true;
        },
        setSearchQuery(query) {
            if (!searchController) return false;

            searchController.setSearchQuery(query);
            return true;
        },
        clearSearch() {
            if (!searchController) return false;

            searchController.clearSearch();
            return true;
        },
        getSearchState() {
            if (!searchController) {
                return {
                    query: '',
                    selectedFields: []
                };
            }

            return searchController.getSearchState();
        },
        setSearchFields(fields) {
            if (!searchController) return false;

            searchController.setSearchFields(fields);
            return true;
        },
        destroy() {
            if (unsubscribeDeleteColumn) {
                unsubscribeDeleteColumn();
                unsubscribeDeleteColumn = null;
            }

            if (unsubscribeLookupDescriptions) {
                unsubscribeLookupDescriptions();
                unsubscribeLookupDescriptions = null;
            }

            if (unsubscribeLargeText) {
                unsubscribeLargeText();
                unsubscribeLargeText = null;
            }

            if (searchController) {
                searchController.destroy();
                searchController = null;
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

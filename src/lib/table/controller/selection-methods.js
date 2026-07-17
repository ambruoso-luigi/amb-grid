/**
 * Creates the selection methods exposed by the AMB Grid controller.
 *
 * @param {object} context - Required method dependencies.
 * @param {object} context.table - Grid table instance.
 * @param {object} context.crud - AMB Grid CRUD layer.
 * @returns {object} Selection methods for the flat controller API.
 * @private
 * @internal
 */
export const createSelectionMethods = ({ table, crud }) => ({
    /**
     * Returns the data objects for the selected rows.
     *
     * This AMB Grid compatibility method returns selected row data rather than
     * row components. Use `getSelectedRowComponents()` when component access is
     * required.
     *
     * @returns {object[]} Data objects for the selected rows.
     */
    getSelectedRows() {
        return typeof table.getSelectedData === 'function'
            ? table.getSelectedData()
            : [];
    },

    /**
     * Returns the data objects for the selected rows.
     *
     * Rows are returned in their selection order. The method returns runtime
     * grid data as-is and does not create an AMB Grid save payload or remove
     * technical fields.
     *
     * Returned objects should be treated as read-only because direct mutation
     * may bypass CRUD tracking.
     *
     * @returns {object[]} Data objects for the selected rows.
     */
    getSelectedData() {
        return table.getSelectedData();
    },

    /**
     * Returns the row components for the selected rows.
     *
     * Components are returned in their selection order. Row components expose
     * advanced operations, so direct mutations may bypass or interfere with AMB
     * Grid CRUD tracking.
     *
     * @returns {object[]} Components for the selected rows.
     */
    getSelectedRowComponents() {
        return table.getSelectedRows();
    },

    /**
     * Clears the current row selection.
     *
     * All selected rows are deselected. The method performs no operation when
     * row deselection is not available.
     *
     * @returns {void}
     */
    clearSelection() {
        if (typeof table.deselectRow === 'function') {
            table.deselectRow();
        }
    },

    /**
     * Selects one row using an AMB Grid row identifier.
     *
     * Backend identifiers and AMB Grid temporary identifiers are resolved
     * through the CRUD layer.
     *
     * This method currently selects one row at a time. Arrays, row ranges and
     * select-all behavior are not part of this AMB Grid method contract.
     *
     * @param {*} identifier - Backend id or AMB temporary id.
     * @returns {boolean} `true` when the row is selected, otherwise `false`.
     */
    selectRow(identifier) {
        const row = crud.findRowByKey(identifier);

        if (!row || typeof row.select !== 'function') return false;

        row.select();
        return true;
    },

    /**
     * Deselects one row using an AMB Grid row identifier.
     *
     * Backend identifiers and AMB Grid temporary identifiers are resolved
     * through the CRUD layer.
     *
     * This method currently deselects one row at a time. Arrays, row ranges and
     * deselect-all behavior are not part of this method; use `clearSelection()`
     * to clear the complete selection.
     *
     * @param {*} identifier - Backend id or AMB temporary id.
     * @returns {boolean} `true` when the row is deselected, otherwise `false`.
     */
    deselectRow(identifier) {
        const row = crud.findRowByKey(identifier);

        if (!row || typeof row.deselect !== 'function') return false;

        row.deselect();
        return true;
    }
});

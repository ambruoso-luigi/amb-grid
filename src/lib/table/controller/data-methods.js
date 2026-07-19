/**
 * Creates the data methods exposed by the AMB Grid controller.
 *
 * @param {object} context - Required method dependencies.
 * @param {object} context.table - Grid table instance.
 * @returns {object} Data methods for the flat controller API.
 * @private
 * @internal
 */
export const createDataMethods = ({ table }) => ({
    /**
     * Returns the current grid data.
     *
     * An optional row range can be provided to limit the returned rows. For
     * example, the `"active"` range returns rows currently included after
     * filters and search conditions have been applied.
     *
     * This method returns runtime row data as-is. It does not create an AMB
     * Grid save payload or remove technical fields. Returned row objects should
     * be treated as read-only because direct changes may bypass CRUD tracking.
     *
     * @param {...any} args - Optional arguments used to select the requested rows.
     * @returns {object[]} Current row data.
     */
    getData(...args) {
        return table.getData(...args);
    },

    /**
     * Returns the number of rows in the requested row range.
     *
     * An optional row range can be provided. For example, `"active"` returns
     * the number of rows currently included after filters and search conditions
     * have been applied.
     *
     * This method reads the current grid state without modifying filters,
     * search, pagination, selection, or AMB Grid CRUD state.
     *
     * @param {...any} args - Optional arguments used to select the row range.
     * @returns {number} Number of rows in the requested range.
     */
    getDataCount(...args) {
        return table.getDataCount(...args);
    },

    /**
     * Returns row data matching a filter definition.
     *
     * This is a one-off query and does not modify the current programmatic
     * filters, header filters or AMB Grid global search state.
     *
     * Returned objects are the current runtime row data and should be treated
     * as read-only. Direct mutations may bypass AMB Grid CRUD tracking.
     *
     * @param {...*} args - Filter definition arguments.
     * @returns {object[]} Matching row data.
     */
    searchData(...args) {
        return table.searchData(...args);
    }
});

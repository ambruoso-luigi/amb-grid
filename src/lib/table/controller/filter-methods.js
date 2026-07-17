/**
 * Creates the filter methods exposed by the AMB Grid controller.
 *
 * @param {object} context - Required method dependencies.
 * @param {object} context.table - Grid table instance.
 * @returns {object} Filter methods for the flat controller API.
 * @private
 * @internal
 */
export const createFilterMethods = ({ table }) => ({
    /**
     * Returns the current column header filters.
     *
     * Header filters are returned independently from programmatic filters and
     * from the AMB Grid global search state.
     *
     * @returns {object[]} Current header filter definitions.
     */
    getHeaderFilters() {
        return table.getHeaderFilters();
    },

    /**
     * Returns the current header filter value for a column.
     *
     * The column can be identified using any supported column lookup value.
     *
     * @param {*} columnLookup - Column field, component, element or supported lookup value.
     * @returns {*} Current header filter value.
     */
    getHeaderFilterValue(columnLookup) {
        return table.getHeaderFilterValue(columnLookup);
    },

    /**
     * Sets the header filter value for a column.
     *
     * The column can be identified using any supported column lookup value. The
     * supplied value is applied without AMB Grid normalization.
     *
     * Changing a header filter may change which rows are currently visible, but
     * it does not directly modify CRUD state.
     *
     * @param {*} columnLookup - Column field, component, element or supported lookup value.
     * @param {*} value - Header filter value.
     * @returns {*} Result of the header filter update.
     */
    setHeaderFilterValue(columnLookup, value) {
        return table.setHeaderFilterValue(columnLookup, value);
    },

    /**
     * Moves focus to the header filter for a column.
     *
     * The column can be identified using any supported column lookup value.
     *
     * @param {*} columnLookup - Column field, component, element or supported lookup value.
     * @returns {*} Result of the focus operation.
     */
    setHeaderFilterFocus(columnLookup) {
        return table.setHeaderFilterFocus(columnLookup);
    },

    /**
     * Clears all column header filters.
     *
     * Programmatic filters and the AMB Grid global search remain active.
     *
     * @returns {*} Result of clearing the header filters.
     */
    clearHeaderFilter() {
        return table.clearHeaderFilter();
    },

    /**
     * Re-runs the filters currently applied to the grid.
     *
     * This is useful when a custom filter depends on external values that have
     * changed. The existing filter configuration and AMB Grid search state are
     * not replaced or cleared.
     *
     * Refreshing filters may change which rows are currently active or visible,
     * but it does not directly modify CRUD state.
     *
     * @returns {void}
     */
    refreshFilter() {
        return table.refreshFilter();
    }
});

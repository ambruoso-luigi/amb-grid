/**
 * Creates the filter methods exposed by the AMB Grid controller.
 *
 * @param {object} context - Required method dependencies.
 * @param {object} context.table - Grid table instance.
 * @param {object|null} context.searchController - Optional global-search controller.
 * @returns {object} Filter methods for the flat controller API.
 * @private
 * @internal
 */
export const createFilterMethods = ({ table, searchController = null }) => ({
    /**
     * Returns the current developer-managed filters.
     *
     * The internal filter used by AMB Grid global search is excluded. Header
     * filters are included only when requested through the optional argument.
     *
     * The returned filter definitions retain their original object identities
     * and should be treated as read-only.
     *
     * @param {...any} args - Filter read arguments, such as including header filters.
     * @returns {Array} Current filters visible through the AMB Grid API.
     */
    getFilters(...args) {
        const filters = table.getFilters(...args);

        if (!searchController) return filters;

        return searchController.excludeSearchFilter(filters);
    },

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
    },

    /**
     * Adds a programmatic filter to the grid.
     *
     * Existing developer filters, header filters, and the AMB Grid global search
     * remain active. The operation may change which rows are currently visible,
     * but it does not directly modify row data or CRUD state.
     *
     * @param {...*} args - Filter definition arguments.
     * @returns {*} Result of adding the filter.
     */
    addFilter(...args) {
        return table.addFilter(...args);
    },

    /**
     * Replaces the developer-managed programmatic filters.
     *
     * The AMB Grid global search filter is preserved by reapplying it after the
     * replacement succeeds. Replacing filters may change which rows are active
     * or visible, but it does not directly modify row data or CRUD state.
     *
     * @param {...*} args - Filter definition arguments.
     * @returns {*} Result of replacing the filters.
     */
    setFilter(...args) {
        const result = table.setFilter(...args);

        if (searchController) {
            searchController.reapplySearchFilter();
        }

        return result;
    },

    /**
     * Removes a programmatic filter from the grid.
     *
     * The AMB Grid global search state is not modified. The operation returns
     * the result produced by the filter removal.
     *
     * @param {...*} args - Filter removal arguments.
     * @returns {*} Result of removing the filter.
     */
    removeFilter(...args) {
        return table.removeFilter(...args);
    },

    /**
     * Clears developer-managed programmatic filters.
     *
     * The AMB Grid global search filter is preserved by reapplying it after the
     * clear operation succeeds. Passing `true` also clears column header filters.
     * Use `clearSearch()` to clear the AMB Grid global search query.
     *
     * @param {...*} args - Filter clear arguments.
     * @returns {*} Result of clearing the filters.
     */
    clearFilter(...args) {
        const result = table.clearFilter(...args);

        if (searchController) {
            searchController.reapplySearchFilter();
        }

        return result;
    }
});

/**
 * Creates the sorting methods exposed by the AMB Grid controller.
 *
 * @param {object} context - Required method dependencies.
 * @param {object} context.table - Grid table instance.
 * @returns {object} Sorting methods for the flat controller API.
 * @private
 * @internal
 */
export const createSortMethods = ({ table }) => ({
    /**
     * Returns the current grid sorters.
     *
     * Each sorter describes its column, field and direction. The returned
     * definitions retain their runtime object identities and should be treated
     * as read-only.
     *
     * @returns {Array<object>} Current sorter definitions.
     */
    getSorters() {
        return table.getSorters();
    },

    /**
     * Applies one or more grid sorters.
     *
     * A sorter can be provided as field and direction arguments, or as a sorter
     * definition list. Applying sorters may change the active row order, but it
     * does not directly modify row data or CRUD state. Remote sorting behavior
     * depends on the grid configuration.
     *
     * @param {...*} args - Sort definition arguments.
     * @returns {*} Result of applying the sorters.
     */
    setSort(...args) {
        return table.setSort(...args);
    },

    /**
     * Clears the current grid sorting.
     *
     * Filters and AMB Grid global search remain active. Clearing sorters does
     * not directly modify row data or CRUD state.
     *
     * @returns {*} Result of clearing the sorters.
     */
    clearSort() {
        return table.clearSort();
    }
});

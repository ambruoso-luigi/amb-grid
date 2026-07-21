/**
 * Creates the row-grouping methods exposed by the AMB Grid controller.
 *
 * @param {object} context - Required method dependencies.
 * @param {object} context.table - Grid table instance.
 * @returns {object} Grouping methods for the flat controller API.
 * @private
 * @internal
 */
export const createGroupingMethods = ({ table }) => ({
    /**
     * Returns the current data in the runtime grouped output order.
     *
     * When grouping is active, the result contains group-header descriptors and
     * row data in grouped display order. When grouping is inactive, the runtime
     * returns the normal table data representation.
     *
     * Group-header descriptors can contain properties such as `level`,
     * `rowCount` and `headerContent`. This output is not an AMB Grid save payload
     * and must not be used to infer CRUD state.
     *
     * @returns {Array} Current grouped data output.
     */
    getGroupedData() {
        return table.getGroupedData();
    },

    /**
     * Returns the current top-level group components.
     *
     * Group components expose the current runtime group structure and advanced
     * operations for inspecting or controlling individual groups. Nested groups
     * remain available through their parent components.
     *
     * The returned array and components retain their runtime identities and
     * should be treated carefully. Direct component operations can affect the
     * grid outside higher-level AMB Grid workflows.
     *
     * @returns {object[]} Current top-level group components.
     */
    getGroups() {
        return table.getGroups();
    },

    /**
     * Changes the fields or functions used to group grid rows.
     *
     * A string or function creates one grouping level, while an array creates
     * multiple levels. Pass `false` to remove the current grouping.
     *
     * Grouping changes the runtime row organization but does not directly
     * modify row data or AMB Grid CRUD state.
     *
     * @param {string|Function|Array|false} groupBy - Runtime grouping definition.
     * @returns {*} Result of changing the grouping definition.
     */
    setGroupBy(groupBy) {
        return table.setGroupBy(groupBy);
    },

    /**
     * Changes the allowed group values for each grouping level.
     *
     * Rows whose values are outside the configured lists can be excluded from
     * the visible grouped structure according to the runtime grouping behavior.
     * This does not delete those rows or change their AMB Grid CRUD state.
     *
     * @param {Array} groupValues - Allowed values for each grouping level.
     * @returns {*} Result of updating the allowed group values.
     */
    setGroupValues(groupValues) {
        return table.setGroupValues(groupValues);
    },

    /**
     * Changes the initial open state used when groups are generated.
     *
     * The value can be a boolean, a callback, or a list of values for
     * multi-level grouping. Existing and future group rendering follows the
     * runtime grouping behavior.
     *
     * @param {boolean|Function|Array} groupStartOpen - Group opening definition.
     * @returns {*} Result of updating the opening definition.
     */
    setGroupStartOpen(groupStartOpen) {
        return table.setGroupStartOpen(groupStartOpen);
    },

    /**
     * Changes the formatter used to generate group headers.
     *
     * A callback can be supplied for one grouping level, or an array of
     * callbacks for multi-level grouping. Callback identities and returned
     * content are forwarded without AMB Grid transformations.
     *
     * @param {Function|Function[]} groupHeader - Group-header formatter definition.
     * @returns {*} Result of updating the group-header definition.
     */
    setGroupHeader(groupHeader) {
        return table.setGroupHeader(groupHeader);
    }
});

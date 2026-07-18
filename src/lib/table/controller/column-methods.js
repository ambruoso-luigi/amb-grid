/**
 * Creates the column-reading methods exposed by the AMB Grid controller.
 *
 * @param {object} context - Required method dependencies.
 * @param {object} context.table - Grid table instance.
 * @returns {object} Column-reading methods for the flat controller API.
 * @private
 * @internal
 */
export const createColumnMethods = ({ table }) => ({
    /**
     * Returns the current grid column definitions.
     *
     * The result reflects the current runtime column structure, including
     * AMB-managed columns and changes made after grid creation. Returned
     * definitions should be treated as read-only.
     *
     * @returns {Array<object>} Current column definitions.
     */
    getColumnDefinitions() {
        return table.getColumnDefinitions();
    },

    /**
     * Returns the current grid column components.
     *
     * Pass `true` to request the structured top-level column hierarchy,
     * including column groups. The returned components expose advanced runtime
     * operations and should be treated carefully.
     *
     * AMB-managed selection and action columns are included when they belong to
     * the current grid structure.
     *
     * @param {boolean} [includeGroups=false] - Include the structured column hierarchy.
     * @returns {Array<object>} Current column components.
     */
    getColumns(...args) {
        return table.getColumns(...args);
    },

    /**
     * Returns a column component using a supported column lookup value.
     *
     * Column components expose advanced runtime operations. Direct operations
     * on a component may affect grid configuration outside higher-level AMB
     * Grid workflows.
     *
     * @param {*} columnLookup - Column field, component, header element or supported lookup.
     * @returns {object|false} Matching column component, or `false` when not found.
     */
    getColumn(columnLookup) {
        return table.getColumn(columnLookup);
    }
});

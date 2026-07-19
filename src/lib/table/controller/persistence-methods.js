/**
 * Creates the manual persistence methods exposed by the AMB Grid controller.
 *
 * @param {object} context - Required method dependencies.
 * @param {object} context.table - Grid table instance.
 * @returns {object} Persistence methods for the flat controller API.
 * @private
 * @internal
 */
export const createPersistenceMethods = ({ table }) => ({
    /**
     * Returns the current persistable column layout.
     *
     * The result describes the runtime column order, dimensions, visibility,
     * grouping structure and other properties configured for column persistence.
     * It is not a complete replacement for the current column definitions.
     *
     * AMB-managed columns are included when they belong to the current
     * persisted layout. The returned structure should be treated as read-only.
     *
     * @returns {object[]} Current persistable column layout.
     */
    getColumnLayout() {
        return table.getColumnLayout();
    },

    /**
     * Applies a previously captured persistent column layout.
     *
     * The layout is merged with the current runtime column definitions so that
     * editor, formatter, validator and AMB Grid behavior remain controlled by
     * the existing definitions. The operation does not store the layout.
     *
     * Applying a layout can rebuild runtime column components. Retrieve fresh
     * column components after the operation instead of relying on references
     * captured beforehand.
     *
     * @param {object[]} layout - Persistent column layout to apply.
     * @returns {boolean} Whether the layout was applied.
     */
    setColumnLayout(layout) {
        return table.setColumnLayout(layout);
    }
});

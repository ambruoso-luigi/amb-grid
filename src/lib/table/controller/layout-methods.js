/**
 * Creates the runtime layout methods exposed by the AMB Grid controller.
 *
 * @param {object} context - Required method dependencies.
 * @param {object} context.table - Grid table instance.
 * @returns {object} Layout methods for the flat controller API.
 * @private
 * @internal
 */
export const createLayoutMethods = ({ table }) => ({
    /**
     * Changes the runtime height of the grid.
     *
     * Numbers and CSS dimension values are forwarded unchanged. Runtime
     * rendering support depends on the active table rendering mode; the grid
     * handles any required layout and virtual-rendering updates.
     *
     * This operation changes only the table layout and does not directly
     * modify row data or AMB Grid CRUD state.
     *
     * @param {number|string} height - Runtime grid height.
     * @returns {void}
     */
    setHeight(...args) {
        return table.setHeight(...args);
    },

    /**
     * Changes the runtime minimum height of the grid.
     *
     * The supplied number or CSS dimension is forwarded unchanged. The
     * operation affects layout only and does not directly modify row data or
     * CRUD state.
     *
     * @param {number|string} minHeight - Runtime minimum grid height.
     * @returns {void}
     */
    setMinHeight(...args) {
        return table.setMinHeight(...args);
    },

    /**
     * Changes the runtime maximum height of the grid.
     *
     * The supplied number or CSS dimension is forwarded unchanged. The grid
     * manages any resulting scrolling and layout updates.
     *
     * @param {number|string} maxHeight - Runtime maximum grid height.
     * @returns {void}
     */
    setMaxHeight(...args) {
        return table.setMaxHeight(...args);
    }
});

/**
 * Creates the runtime cell-state reading methods exposed by the AMB Grid
 * controller.
 *
 * @param {object} context - Required method dependencies.
 * @param {object} context.table - Grid table instance.
 * @returns {object} Cell-state reading methods for the flat controller API.
 * @private
 * @internal
 */
export const createCellStateMethods = ({ table }) => ({
    /**
     * Returns the cell components currently marked as edited by the grid.
     *
     * This native editing list is separate from AMB Grid row state, snapshots
     * and save payload generation. The returned array and cell components
     * retain their runtime identities and should be treated carefully.
     *
     * @returns {object[]} Cell components currently marked as edited.
     */
    getEditedCells() {
        return table.getEditedCells();
    },

    /**
     * Returns the cell components currently marked as invalid by the grid's
     * native validation state.
     *
     * This list is separate from AMB Grid validation errors and `_errors`
     * metadata. The method reads the current native state without triggering a
     * new validation pass.
     *
     * @returns {object[]} Cell components currently marked as invalid.
     */
    getInvalidCells() {
        return table.getInvalidCells();
    }
});

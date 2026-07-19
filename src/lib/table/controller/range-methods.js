/**
 * Creates the cell-range reading methods exposed by the AMB Grid controller.
 *
 * @param {object} context - Required method dependencies.
 * @param {object} context.table - Grid table instance.
 * @returns {object} Cell-range reading methods for the flat controller API.
 * @private
 * @internal
 */
export const createRangeMethods = ({ table }) => ({
    /**
     * Adds a selected cell range between two cell components.
     *
     * The supplied cells define the top-left and bottom-right bounds of the new
     * range. The grid manages the active range, visual selection, configured
     * range limits and optional focus behavior.
     *
     * The returned Range Component exposes advanced runtime operations. Adding a
     * range is separate from row selection and does not directly modify row data
     * or AMB Grid CRUD state.
     *
     * @param {object} topLeftCell - Cell component at the top-left range bound.
     * @param {object} bottomRightCell - Cell component at the bottom-right range bound.
     * @returns {object} Newly created Range Component.
     */
    addRange(...args) {
        return table.addRange(...args);
    },

    /**
     * Returns the currently selected cell-range components.
     *
     * Cell ranges are separate from AMB Grid row selection. The returned array
     * and range components retain their runtime identities and should be
     * treated carefully because component operations can modify the active
     * selection.
     *
     * The result is meaningful when cell-range selection is enabled in the grid
     * configuration.
     *
     * @returns {object[]} Current cell-range components.
     */
    getRanges() {
        return table.getRanges();
    },

    /**
     * Returns the data currently contained in the selected cell ranges.
     *
     * The outer array contains one entry for each selected range. Each range
     * entry contains row-shaped objects with only the fields included in that
     * range.
     *
     * This result is separate from AMB Grid row selection, CRUD state and save
     * payload generation.
     *
     * @returns {Array<object[]>} Data grouped by selected cell range.
     */
    getRangesData() {
        return table.getRangesData();
    }
});

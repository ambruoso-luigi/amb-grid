/**
 * Creates the editable-cell navigation methods exposed by the AMB Grid
 * controller.
 *
 * @param {object} context - Required method dependencies.
 * @param {object} context.table - Grid table instance.
 * @returns {object} Cell-navigation methods for the flat controller API.
 * @private
 * @internal
 */
export const createNavigationMethods = ({ table }) => ({
    /**
     * Moves the active editor to the previous editable cell.
     *
     * Navigation can wrap to the last editable cell of the previous displayed
     * row. The operation succeeds only when the runtime grid has an active
     * editing context and a valid editable destination.
     *
     * Native editor, focus and scrolling behavior remain controlled by the
     * grid.
     *
     * @returns {boolean} Whether navigation reached an editable cell.
     */
    navigatePrev() {
        return table.navigatePrev();
    },

    /**
     * Moves the active editor to the next editable cell.
     *
     * Navigation can wrap to the first editable cell of the next displayed
     * row. Runtime options and keybindings control any special end-of-table
     * behavior.
     *
     * @returns {boolean} Whether navigation reached an editable cell.
     */
    navigateNext() {
        return table.navigateNext();
    },

    /**
     * Moves the active editor to the previous editable cell in the current row.
     *
     * The method does not wrap manually to another row and returns false when
     * no editable cell is available to the left.
     *
     * @returns {boolean} Whether navigation reached an editable cell.
     */
    navigateLeft() {
        return table.navigateLeft();
    },

    /**
     * Moves the active editor to the next editable cell in the current row.
     *
     * The method does not wrap manually to another row and returns false when
     * no editable cell is available to the right.
     *
     * @returns {boolean} Whether navigation reached an editable cell.
     */
    navigateRight() {
        return table.navigateRight();
    },

    /**
     * Moves the active editor to the corresponding cell in the previous
     * displayed row.
     *
     * The grid determines whether the destination can be edited and manages
     * any required focus and internal scrolling.
     *
     * @returns {boolean} Whether navigation reached an editable cell.
     */
    navigateUp() {
        return table.navigateUp();
    },

    /**
     * Moves the active editor to the corresponding cell in the next displayed
     * row.
     *
     * The grid determines whether the destination can be edited and manages
     * any required focus and internal scrolling.
     *
     * @returns {boolean} Whether navigation reached an editable cell.
     */
    navigateDown() {
        return table.navigateDown();
    }
});

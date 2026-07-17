/**
 * Creates the redraw methods exposed by the AMB Grid controller.
 *
 * @param {object} context - Required method dependencies.
 * @param {object} context.table - Grid table instance.
 * @returns {object} Redraw methods for the flat controller API.
 * @private
 * @internal
 */
export const createRedrawMethods = ({ table }) => ({
    /**
     * Redraws the grid.
     *
     * All arguments are forwarded unchanged and the result is returned
     * directly.
     *
     * @param {...any} args - Redraw arguments.
     * @returns {any} Result returned by the grid table.
     */
    redraw(...args) {
        return table.redraw(...args);
    },

    /**
     * Temporarily suspends automatic redraws.
     *
     * Use this around a short group of consecutive grid operations, then call
     * `restoreRedraw()` to resume redraw behavior.
     *
     * @returns {any} Result returned by the grid table.
     */
    blockRedraw() {
        return table.blockRedraw();
    },

    /**
     * Restores automatic redraws after `blockRedraw()`.
     *
     * Any redraw left pending while redraws were suspended is handled by the
     * grid table.
     *
     * @returns {any} Result returned by the grid table.
     */
    restoreRedraw() {
        return table.restoreRedraw();
    }
});

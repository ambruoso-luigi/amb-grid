/**
 * Creates the column calculation methods exposed by the AMB Grid controller.
 *
 * @param {object} context - Required method dependencies.
 * @param {object} context.table - Grid table instance.
 * @returns {object} Calculation methods for the flat controller API.
 * @private
 * @internal
 */
export const createCalculationMethods = ({ table }) => ({
    /**
     * Returns the current column calculation results.
     *
     * For an ungrouped grid the result normally contains `top` and `bottom`
     * calculation objects. Grouped grids can return a nested object keyed by
     * group values.
     *
     * The result reflects the current runtime calculation configuration and
     * should be treated as read-only. It is not an AMB Grid save payload or
     * CRUD state report.
     *
     * @returns {object} Current column calculation results.
     */
    getCalcResults() {
        return table.getCalcResults();
    },

    /**
     * Recalculates the configured column calculations.
     *
     * The grid resolves the rows, groups, calculation functions and parameters
     * according to its current runtime configuration. The operation does not
     * directly modify row data or AMB Grid CRUD state.
     *
     * Use `getCalcResults()` separately when the updated result object is
     * needed.
     *
     * @returns {void}
     */
    recalc() {
        return table.recalc();
    }
});

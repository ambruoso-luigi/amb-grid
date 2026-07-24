const readCalc = (calc, methodName, args = []) => {
    if (!calc) return false;

    const method = calc[methodName];
    if (typeof method !== 'function') return false;

    return method.apply(calc, args);
};

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
     * Returns the runtime data of one calculation row.
     *
     * `calc` must be a Calc Component supplied by the AMB Grid runtime.
     * `transform` is forwarded unchanged to the internal engine and the result
     * is returned without copies. This reads one calculation component; unlike
     * `getCalcResults()`, it does not return the table's aggregate calculation
     * results and is not an AMB Grid CRUD payload or snapshot.
     *
     * @param {object} calc - Calc Component supplied by the AMB Grid runtime.
     * @param {*} transform - Runtime transform option forwarded to the internal engine.
     * @returns {*|false} Runtime calculation-row data, or `false` when the component or operation is unavailable.
     */
    getCalcData(calc, transform) {
        return readCalc(calc, 'getData', [transform]);
    },

    /**
     * Returns the runtime DOM element of one calculation row.
     *
     * `calc` must be a Calc Component supplied by the AMB Grid runtime. The DOM
     * node is returned by identity without copies. Direct manipulation is an
     * advanced integration technique that can bypass normal AMB Grid behavior.
     *
     * @param {object} calc - Calc Component supplied by the AMB Grid runtime.
     * @returns {Element|false} Runtime DOM element, or `false` when the component or operation is unavailable.
     */
    getCalcElement(calc) {
        return readCalc(calc, 'getElement');
    },

    /**
     * Returns the runtime Cell Components of one calculation row.
     *
     * `calc` must be a Calc Component supplied by the AMB Grid runtime. The
     * array, contained components and runtime order are returned without copies,
     * including an empty array.
     *
     * @param {object} calc - Calc Component supplied by the AMB Grid runtime.
     * @returns {object[]|false} Runtime Cell Components, or `false` when the component or operation is unavailable.
     */
    getCalcCells(calc) {
        return readCalc(calc, 'getCells');
    },

    /**
     * Returns one runtime Cell Component from a calculation row.
     *
     * `calc` must be a Calc Component supplied by the AMB Grid runtime. `column`
     * is forwarded unchanged to the internal engine and the component is
     * returned by identity. `false` is preserved when the cell does not exist or
     * when the component operation is unavailable.
     *
     * @param {object} calc - Calc Component supplied by the AMB Grid runtime.
     * @param {*} column - Column lookup supported by the internal engine.
     * @returns {object|false} Runtime Cell Component, or `false` when unavailable.
     */
    getCalcCell(calc, column) {
        return readCalc(calc, 'getCell', [column]);
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

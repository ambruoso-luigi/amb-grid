/**
 * Creates the row-reading methods exposed by the AMB Grid controller.
 *
 * @param {object} context - Required method dependencies.
 * @param {object} context.table - Grid table instance.
 * @param {object} context.crud - AMB Grid CRUD layer.
 * @returns {object} Row-reading methods for the flat controller API.
 * @private
 * @internal
 */
export const createRowMethods = ({ table, crud }) => ({
    /**
     * Returns the row components in the requested row range.
     *
     * Without a row range, all current row components are returned. A range
     * such as `"active"` can be used to retrieve rows included after the
     * current filtering and search conditions have been applied.
     *
     * Row components expose advanced operations. Mutating rows directly through
     * those components may bypass or interfere with AMB Grid CRUD tracking.
     *
     * @param {...any} args - Optional arguments used to select the row range.
     * @returns {object[]} Row components in the requested range.
     */
    getRows(...args) {
        return table.getRows(...args);
    },

    /**
     * Returns a row component for the requested row.
     *
     * Backend identifiers and AMB Grid temporary identifiers are resolved
     * through the CRUD layer. Other supported row lookup values retain their
     * standard lookup behavior.
     *
     * The returned component exposes advanced row operations. Mutating the row
     * directly through that component may bypass or interfere with AMB Grid CRUD
     * tracking.
     *
     * @param {*} identifier - Backend id, AMB temporary id, or supported row lookup value.
     * @returns {object|false} Matching row component, or `false` when no row is found.
     */
    getRow(identifier) {
        const ambRow = crud.findRowByKey(identifier);

        if (ambRow) return ambRow;

        return table.getRow(identifier);
    },

    /**
     * Returns the current numerical position of a row.
     *
     * Positions start at 1. Backend identifiers and AMB Grid temporary
     * identifiers are resolved through the CRUD layer, while other supported row
     * lookup values retain their normal behavior.
     *
     * The method returns `false` when a position is not currently available and
     * does not modify the row or grid state.
     *
     * @param {*} identifier - Backend id, AMB temporary id, or supported row lookup value.
     * @param {...any} args - Additional position lookup arguments.
     * @returns {number|false} Current one-based row position, or `false`.
     */
    getRowPosition(identifier, ...args) {
        const ambRow = crud.findRowByKey(identifier);

        return table.getRowPosition(ambRow || identifier, ...args);
    },

    /**
     * Returns the row component at a numerical position.
     *
     * Positions start at 1. The returned component exposes advanced row
     * operations, so direct mutations may bypass or interfere with AMB Grid CRUD
     * tracking.
     *
     * @param {...any} args - Position lookup arguments.
     * @returns {object|false} Row component at the requested position, or `false`.
     */
    getRowFromPosition(...args) {
        return table.getRowFromPosition(...args);
    }
});

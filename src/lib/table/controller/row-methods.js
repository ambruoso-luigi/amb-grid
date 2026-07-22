const resolveRowComponent = (table, crud, identifier) => {
    const ambRow = crud.findRowByKey(identifier);

    if (ambRow) return ambRow;

    return table.getRow(identifier);
};

/**
 * Creates the row methods exposed by the AMB Grid controller.
 *
 * @param {object} context - Required method dependencies.
 * @param {object} context.table - Grid table instance.
 * @param {object} context.crud - AMB Grid CRUD layer.
 * @returns {object} Row methods for the flat controller API.
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
        return resolveRowComponent(table, crud, identifier);
    },

    /**
     * Freezes one row through the AMB Grid controller.
     *
     * The AMB Grid row identifier is resolved through the CRUD layer first, so
     * backend id values and AMB Grid temporary identifiers address the managed
     * row component. Other supported row lookup values can be resolved by the
     * underlying table engine.
     *
     * Freezing changes only the runtime row position used by the grid display.
     * Row data, snapshots, CRUD state and AMB Grid save payloads are not
     * modified. The method returns `false` when the row or operation is not
     * available.
     *
     * @param {*} identifier - AMB Grid row identifier or supported row lookup value.
     * @returns {boolean} `true` when the runtime row position is frozen, otherwise `false`.
     */
    freezeRow(identifier) {
        const row = resolveRowComponent(table, crud, identifier);

        if (!row || typeof row.freeze !== 'function') return false;

        row.freeze();
        return true;
    },

    /**
     * Unfreezes one row through the AMB Grid controller.
     *
     * The AMB Grid row identifier is resolved through the CRUD layer first, so
     * backend id values and AMB Grid temporary identifiers address the managed
     * row component. Other supported row lookup values can be resolved by the
     * underlying table engine.
     *
     * Unfreezing changes only the runtime row position used by the grid display.
     * Row data, snapshots, CRUD state and AMB Grid save payloads are not
     * modified. The method returns `false` when the row or operation is not
     * available.
     *
     * @param {*} identifier - AMB Grid row identifier or supported row lookup value.
     * @returns {boolean} `true` when the runtime row position is unfrozen, otherwise `false`.
     */
    unfreezeRow(identifier) {
        const row = resolveRowComponent(table, crud, identifier);

        if (!row || typeof row.unfreeze !== 'function') return false;

        row.unfreeze();
        return true;
    },

    /**
     * Reports whether one row is currently frozen in the AMB Grid controller.
     *
     * The AMB Grid row identifier is resolved through the CRUD layer first, so
     * backend id values and AMB Grid temporary identifiers address the managed
     * row component. Other supported row lookup values can be resolved by the
     * underlying table engine.
     *
     * The check reads the current runtime row position state only. Row data,
     * snapshots, CRUD state and AMB Grid save payloads are not modified. The
     * method returns `false` when the row or operation is not available.
     *
     * @param {*} identifier - AMB Grid row identifier or supported row lookup value.
     * @returns {boolean} Current frozen state, or `false` when unavailable.
     */
    isRowFrozen(identifier) {
        const row = resolveRowComponent(table, crud, identifier);

        if (!row || typeof row.isFrozen !== 'function') return false;

        return row.isFrozen();
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
    },

    /**
     * Returns row components matching a filter definition.
     *
     * This is a one-off query and does not modify the current programmatic
     * filters, header filters or AMB Grid global search state.
     *
     * Returned components expose advanced runtime operations. Direct mutations
     * may bypass or interfere with AMB Grid CRUD tracking.
     *
     * @param {...*} args - Filter definition arguments.
     * @returns {object[]} Matching row components.
     */
    searchRows(...args) {
        return table.searchRows(...args);
    },

    /**
     * Scrolls vertically to a grid row.
     *
     * Backend identifiers and AMB Grid temporary identifiers are resolved
     * through the CRUD layer before the operation is delegated. Other supported
     * row lookup values are forwarded unchanged.
     *
     * The optional position controls where the row appears in the viewport.
     * The optional visibility flag controls whether scrolling also occurs when
     * the row is already visible.
     *
     * This method does not change pagination, selection, focus, row data or
     * CRUD state.
     *
     * @param {*} identifier - Backend id, AMB temporary id or supported row lookup.
     * @param {'top'|'center'|'bottom'|'nearest'} [position] - Requested viewport position.
     * @param {boolean} [scrollIfVisible] - Scroll even when the row is already visible.
     * @returns {Promise<void>} Original scrolling promise.
     */
    scrollToRow(identifier, ...args) {
        const ambRow = crud.findRowByKey(identifier);

        return table.scrollToRow(ambRow || identifier, ...args);
    }
});

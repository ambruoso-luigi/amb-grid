const readCell = (rowMethods, rowIdentifier, column, methodName) => {
    const cell = rowMethods.getRowCell(rowIdentifier, column);

    if (!cell || typeof cell[methodName] !== 'function') return false;

    return cell[methodName]();
};

/**
 * Creates contextual Cell Component reading methods exposed by the AMB Grid
 * controller.
 *
 * @param {object} context - Required method dependencies.
 * @param {object} context.rowMethods - Row methods used to resolve cells.
 * @returns {object} Cell reading methods for the flat controller API.
 * @private
 * @internal
 */
export const createCellMethods = ({ rowMethods }) => ({
    /**
     * Returns the current runtime value for one Cell Component.
     *
     * The row is resolved through backend id, `_ambTempId` or another
     * supported row lookup via AMB Grid row methods. The column lookup is
     * forwarded unchanged. This reads Cell Component runtime state and returns
     * `false` when the cell or operation is unavailable.
     *
     * @param {*} rowIdentifier - Backend id, AMB temporary id, or supported row lookup.
     * @param {*} column - Column lookup forwarded to the row component.
     * @returns {*|false} Current cell value, or `false` when unavailable.
     */
    getCellValue(rowIdentifier, column) {
        return readCell(rowMethods, rowIdentifier, column, 'getValue');
    },

    /**
     * Returns the previous runtime value known by the grid engine.
     *
     * This value is read from the Cell Component and must not be confused with
     * AMB Grid CRUD snapshots or row state. The row lookup is AMB-aware, the
     * column lookup is forwarded unchanged, and `false` means unavailable.
     *
     * @param {*} rowIdentifier - Backend id, AMB temporary id, or supported row lookup.
     * @param {*} column - Column lookup forwarded to the row component.
     * @returns {*|false} Previous runtime cell value, or `false` when unavailable.
     */
    getCellOldValue(rowIdentifier, column) {
        return readCell(rowMethods, rowIdentifier, column, 'getOldValue');
    },

    /**
     * Returns the initial runtime value recorded by the Cell Component.
     *
     * This engine value is not guaranteed to equal AMB Grid application
     * snapshots. The row lookup is AMB-aware, the column lookup is forwarded
     * unchanged, and `false` means the cell or operation is unavailable.
     *
     * @param {*} rowIdentifier - Backend id, AMB temporary id, or supported row lookup.
     * @param {*} column - Column lookup forwarded to the row component.
     * @returns {*|false} Initial runtime cell value, or `false` when unavailable.
     */
    getCellInitialValue(rowIdentifier, column) {
        return readCell(rowMethods, rowIdentifier, column, 'getInitialValue');
    },

    /**
     * Returns the runtime DOM element for one Cell Component.
     *
     * DOM nodes are advanced runtime objects. Direct manipulation can bypass
     * AMB Grid behavior. The row lookup is AMB-aware, the column lookup is
     * forwarded unchanged, and `false` means unavailable.
     *
     * @param {*} rowIdentifier - Backend id, AMB temporary id, or supported row lookup.
     * @param {*} column - Column lookup forwarded to the row component.
     * @returns {Element|false} Runtime cell DOM element, or `false` when unavailable.
     */
    getCellElement(rowIdentifier, column) {
        return readCell(rowMethods, rowIdentifier, column, 'getElement');
    },

    /**
     * Returns the runtime field reported by one Cell Component.
     *
     * The row lookup is AMB-aware and the column lookup is forwarded unchanged.
     * The field is returned without conversion, and `false` means unavailable.
     *
     * @param {*} rowIdentifier - Backend id, AMB temporary id, or supported row lookup.
     * @param {*} column - Column lookup forwarded to the row component.
     * @returns {*|false} Runtime cell field, or `false` when unavailable.
     */
    getCellField(rowIdentifier, column) {
        return readCell(rowMethods, rowIdentifier, column, 'getField');
    },

    /**
     * Returns the Column Component for one Cell Component.
     *
     * Column Components are advanced runtime objects. Direct operations can
     * bypass AMB Grid behavior. The row lookup is AMB-aware, the column lookup
     * is forwarded unchanged, and `false` means unavailable.
     *
     * @param {*} rowIdentifier - Backend id, AMB temporary id, or supported row lookup.
     * @param {*} column - Column lookup forwarded to the row component.
     * @returns {object|false} Runtime Column Component, or `false` when unavailable.
     */
    getCellColumn(rowIdentifier, column) {
        return readCell(rowMethods, rowIdentifier, column, 'getColumn');
    }
});

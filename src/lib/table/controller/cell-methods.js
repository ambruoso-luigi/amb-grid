const readCell = (rowMethods, rowIdentifier, column, methodName, args = [], normalize = value => value) => {
    const cell = rowMethods.getRowCell(rowIdentifier, column);

    if (!cell || typeof cell[methodName] !== 'function') return false;

    return normalize(cell[methodName](...args));
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
     * Attempts to open the runtime editor for one managed Cell Component.
     *
     * The row and cell are resolved through the AMB Grid API. The native force
     * flag is deliberately not exposed, so normal `editable` checks and AMB
     * protections, including deleted-row restrictions, remain effective.
     *
     * `true` means the call was delegated, not that the editor necessarily
     * opened. No cell value, row data or AMB Grid CRUD state is modified
     * directly.
     *
     * @param {*} rowIdentifier - Backend id, AMB temporary id, or supported row lookup.
     * @param {*} column - Column lookup forwarded to the row component.
     * @returns {boolean} `true` when delegated, or `false` when unavailable.
     */
    editCell(rowIdentifier, column) {
        return readCell(
            rowMethods,
            rowIdentifier,
            column,
            'edit',
            [],
            () => true
        );
    },

    /**
     * Delegates cancellation of the runtime editor for one managed cell.
     *
     * The operation has an effect only when the resolved cell is currently
     * being edited. It does not clear the historical edited marker and does not
     * perform an AMB Grid CRUD rollback. `true` means the call was delegated,
     * not that cancellation necessarily occurred.
     *
     * @param {*} rowIdentifier - Backend id, AMB temporary id, or supported row lookup.
     * @param {*} column - Column lookup forwarded to the row component.
     * @returns {boolean} `true` when delegated, or `false` when unavailable.
     */
    cancelCellEdit(rowIdentifier, column) {
        return readCell(
            rowMethods,
            rowIdentifier,
            column,
            'cancelEdit',
            [],
            () => true
        );
    },

    /**
     * Navigates left from one managed Cell Component.
     *
     * The AMB Grid row methods resolve `rowIdentifier`, while `column` is
     * forwarded as a supported column lookup. The runtime engine selects the
     * destination and manages focus, scrolling and any editor while respecting
     * normal editability checks. Unlike the global `navigateLeft()`, this
     * operation starts from the resolved cell. Its runtime result is returned
     * directly; `false` also covers an unavailable cell or operation. No data
     * or AMB Grid CRUD state is modified directly.
     *
     * @param {*} rowIdentifier - Backend id, AMB temporary id, or supported row lookup.
     * @param {*} column - Column lookup forwarded to the row component.
     * @returns {boolean} Runtime navigation result, or `false` when unavailable.
     */
    navigateCellLeft(rowIdentifier, column) {
        return readCell(rowMethods, rowIdentifier, column, 'navigateLeft');
    },

    /**
     * Navigates right from one managed Cell Component.
     *
     * The AMB Grid row methods resolve `rowIdentifier`, while `column` is
     * forwarded as a supported column lookup. The runtime engine selects the
     * destination and manages focus, scrolling and any editor while respecting
     * normal editability checks. Unlike the global `navigateRight()`, this
     * operation starts from the resolved cell. Its runtime result is returned
     * directly; `false` also covers an unavailable cell or operation. No data
     * or AMB Grid CRUD state is modified directly.
     *
     * @param {*} rowIdentifier - Backend id, AMB temporary id, or supported row lookup.
     * @param {*} column - Column lookup forwarded to the row component.
     * @returns {boolean} Runtime navigation result, or `false` when unavailable.
     */
    navigateCellRight(rowIdentifier, column) {
        return readCell(rowMethods, rowIdentifier, column, 'navigateRight');
    },

    /**
     * Navigates upward from one managed Cell Component.
     *
     * The AMB Grid row methods resolve `rowIdentifier`, while `column` is
     * forwarded as a supported column lookup. The runtime engine selects the
     * destination and manages focus, scrolling and any editor while respecting
     * normal editability checks. Unlike the global `navigateUp()`, this
     * operation starts from the resolved cell. Its runtime result is returned
     * directly; `false` also covers an unavailable cell or operation. No data
     * or AMB Grid CRUD state is modified directly.
     *
     * @param {*} rowIdentifier - Backend id, AMB temporary id, or supported row lookup.
     * @param {*} column - Column lookup forwarded to the row component.
     * @returns {boolean} Runtime navigation result, or `false` when unavailable.
     */
    navigateCellUp(rowIdentifier, column) {
        return readCell(rowMethods, rowIdentifier, column, 'navigateUp');
    },

    /**
     * Navigates downward from one managed Cell Component.
     *
     * The AMB Grid row methods resolve `rowIdentifier`, while `column` is
     * forwarded as a supported column lookup. The runtime engine selects the
     * destination and manages focus, scrolling and any editor while respecting
     * normal editability checks. Unlike the global `navigateDown()`, this
     * operation starts from the resolved cell. Its runtime result is returned
     * directly; `false` also covers an unavailable cell or operation. No data
     * or AMB Grid CRUD state is modified directly.
     *
     * @param {*} rowIdentifier - Backend id, AMB temporary id, or supported row lookup.
     * @param {*} column - Column lookup forwarded to the row component.
     * @returns {boolean} Runtime navigation result, or `false` when unavailable.
     */
    navigateCellDown(rowIdentifier, column) {
        return readCell(rowMethods, rowIdentifier, column, 'navigateDown');
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
    },

    /**
     * Returns the Row Component for one Cell Component.
     *
     * The row is resolved through backend id, `_ambTempId` or another
     * supported row lookup via AMB Grid row methods. The column lookup is
     * forwarded unchanged. Row Components are advanced runtime objects; use
     * AMB Grid APIs for normal data changes. `false` means unavailable.
     *
     * @param {*} rowIdentifier - Backend id, AMB temporary id, or supported row lookup.
     * @param {*} column - Column lookup forwarded to the row component.
     * @returns {object|false} Runtime Row Component, or `false` when unavailable.
     */
    getCellRow(rowIdentifier, column) {
        return readCell(rowMethods, rowIdentifier, column, 'getRow');
    },

    /**
     * Returns runtime row data in the context of one Cell Component.
     *
     * The row is resolved through backend id, `_ambTempId` or another
     * supported row lookup via AMB Grid row methods. The column lookup and
     * `transform` option are forwarded unchanged. Returned data is runtime
     * row data, not an AMB Grid CRUD snapshot; direct object mutation can
     * bypass CRUD tracking, so prefer AMB Grid APIs for data changes.
     * `false` means unavailable.
     *
     * @param {*} rowIdentifier - Backend id, AMB temporary id, or supported row lookup.
     * @param {*} column - Column lookup forwarded to the row component.
     * @param {*} transform - Transform option forwarded to the Cell Component.
     * @returns {*|false} Runtime row data for the cell, or `false` when unavailable.
     */
    getCellData(rowIdentifier, column, transform) {
        return readCell(rowMethods, rowIdentifier, column, 'getData', [transform]);
    },

    /**
     * Returns the type declared by one Cell Component.
     *
     * The row is resolved through backend id, `_ambTempId` or another
     * supported row lookup via AMB Grid row methods. The column lookup is
     * forwarded unchanged, the runtime type is returned as declared by the
     * Cell Component, and `false` means unavailable.
     *
     * @param {*} rowIdentifier - Backend id, AMB temporary id, or supported row lookup.
     * @param {*} column - Column lookup forwarded to the row component.
     * @returns {*|false} Runtime cell type, or `false` when unavailable.
     */
    getCellType(rowIdentifier, column) {
        return readCell(rowMethods, rowIdentifier, column, 'getType');
    },

    /**
     * Delegates the runtime height check for one Cell Component.
     *
     * The row is resolved through backend id, `_ambTempId` or another
     * supported row lookup via AMB Grid row methods. The column lookup is
     * forwarded unchanged. This only updates runtime layout through the Cell
     * Component and does not redraw the table or modify data. `false` means
     * unavailable.
     *
     * @param {*} rowIdentifier - Backend id, AMB temporary id, or supported row lookup.
     * @param {*} column - Column lookup forwarded to the row component.
     * @returns {boolean} `true` when delegated, or `false` when unavailable.
     */
    checkCellHeight(rowIdentifier, column) {
        return readCell(rowMethods, rowIdentifier, column, 'checkHeight', [], () => true);
    }
});

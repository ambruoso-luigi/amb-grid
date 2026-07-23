const readColumn = (table, columnLookup, methodName) => {
    const column = table.getColumn(columnLookup);

    if (!column || typeof column[methodName] !== 'function') return false;

    return column[methodName]();
};

/**
 * Creates the column methods exposed by the AMB Grid controller.
 *
 * @param {object} context - Required method dependencies.
 * @param {object} context.table - Grid table instance.
 * @returns {object} Column methods for the flat controller API.
 * @private
 * @internal
 */
export const createColumnMethods = ({ table }) => ({
    /**
     * Returns the current grid column definitions.
     *
     * The result reflects the current runtime column structure, including
     * AMB-managed columns and changes made after grid creation. Returned
     * definitions should be treated as read-only.
     *
     * @returns {Array<object>} Current column definitions.
     */
    getColumnDefinitions() {
        return table.getColumnDefinitions();
    },

    /**
     * Returns the current grid column components.
     *
     * Pass `true` to request the structured top-level column hierarchy,
     * including column groups. The returned components expose advanced runtime
     * operations and should be treated carefully.
     *
     * AMB-managed selection and action columns are included when they belong to
     * the current grid structure.
     *
     * @param {boolean} [includeGroups=false] - Include the structured column hierarchy.
     * @returns {Array<object>} Current column components.
     */
    getColumns(...args) {
        return table.getColumns(...args);
    },

    /**
     * Returns a column component using a supported column lookup value.
     *
     * Column components expose advanced runtime operations. Direct operations
     * on a component may affect grid configuration outside higher-level AMB
     * Grid workflows.
     *
     * @param {*} columnLookup - Column field, component, header element or supported lookup.
     * @returns {object|false} Matching column component, or `false` when not found.
     */
    getColumn(columnLookup) {
        return table.getColumn(columnLookup);
    },

    /**
     * Returns the runtime definition for one managed column component.
     *
     * The `columnLookup` value is forwarded to the underlying table engine's
     * supported column lookup system. The returned definition represents
     * runtime column state and should be treated as read-only; direct mutation
     * can bypass normal AMB Grid controller workflows. Data and CRUD state are
     * not modified. Use public AMB Grid methods for normal application
     * operations. `false` means the column or operation is unavailable.
     *
     * @param {*} columnLookup - Supported column lookup forwarded unchanged.
     * @returns {object|false} Runtime column definition, or `false` when unavailable.
     */
    getColumnDefinition(columnLookup) {
        return readColumn(table, columnLookup, 'getDefinition');
    },

    /**
     * Returns the runtime DOM element for one managed column component.
     *
     * The `columnLookup` value is forwarded to the underlying table engine's
     * supported column lookup system. DOM nodes are advanced runtime objects;
     * direct manipulation can bypass AMB Grid controller behavior. Data and
     * CRUD state are not modified. Use public AMB Grid methods for normal
     * application operations. `false` means unavailable.
     *
     * @param {*} columnLookup - Supported column lookup forwarded unchanged.
     * @returns {Element|false} Runtime column DOM element, or `false` when unavailable.
     */
    getColumnElement(columnLookup) {
        return readColumn(table, columnLookup, 'getElement');
    },

    /**
     * Returns the field reported by one managed column component.
     *
     * The `columnLookup` value is forwarded to the underlying table engine's
     * supported column lookup system. This reads runtime column state without
     * conversion and does not modify data or CRUD state. Use public AMB Grid
     * methods for normal application operations. `false` means unavailable.
     *
     * @param {*} columnLookup - Supported column lookup forwarded unchanged.
     * @returns {*|false} Runtime column field, or `false` when unavailable.
     */
    getColumnField(columnLookup) {
        return readColumn(table, columnLookup, 'getField');
    },

    /**
     * Returns the Cell Components currently associated with one column.
     *
     * The `columnLookup` value is forwarded to the underlying table engine's
     * supported column lookup system. Returned components and arrays are
     * advanced runtime objects and are not cloned, reordered or normalized.
     * Data and CRUD state are not modified. Use public AMB Grid methods for
     * normal application operations. `false` means unavailable.
     *
     * @param {*} columnLookup - Supported column lookup forwarded unchanged.
     * @returns {Array<object>|false} Runtime Cell Components, or `false` when unavailable.
     */
    getColumnCells(columnLookup) {
        return readColumn(table, columnLookup, 'getCells');
    },

    /**
     * Returns whether one managed column component is currently visible.
     *
     * The `columnLookup` value is forwarded to the underlying table engine's
     * supported column lookup system. This reads runtime column state only; it
     * does not show, hide or toggle visibility and does not modify data or
     * CRUD state. Use public AMB Grid methods for normal application
     * operations. `false` means unavailable or a hidden column result.
     *
     * @param {*} columnLookup - Supported column lookup forwarded unchanged.
     * @returns {boolean} Runtime visibility, or `false` when unavailable.
     */
    isColumnVisible(columnLookup) {
        return readColumn(table, columnLookup, 'isVisible');
    },

    /**
     * Returns the runtime width of one managed column component.
     *
     * The `columnLookup` value is forwarded to the underlying table engine's
     * supported column lookup system. This reads runtime column state without
     * conversion and does not modify width, layout, data or CRUD state. Use
     * public AMB Grid methods for normal application operations. `false`
     * means unavailable.
     *
     * @param {*} columnLookup - Supported column lookup forwarded unchanged.
     * @returns {number|false} Runtime column width, or `false` when unavailable.
     */
    getColumnWidth(columnLookup) {
        return readColumn(table, columnLookup, 'getWidth');
    },

    /**
     * Shows a hidden grid column.
     *
     * The lookup is applied to the current runtime column structure, including
     * AMB-managed columns when explicitly addressed. The operation changes only
     * column visibility and does not directly modify row data or CRUD state.
     *
     * @param {*} columnLookup - Column field or another supported column lookup.
     * @returns {void|false} `false` when no matching column is found.
     */
    showColumn(columnLookup) {
        return table.showColumn(columnLookup);
    },

    /**
     * Hides a visible grid column.
     *
     * Hiding a column changes its visual availability without removing its
     * definition or directly modifying row data and CRUD state.
     *
     * @param {*} columnLookup - Column field or another supported column lookup.
     * @returns {void|false} `false` when no matching column is found.
     */
    hideColumn(columnLookup) {
        return table.hideColumn(columnLookup);
    },

    /**
     * Toggles the visibility of a grid column.
     *
     * The current column visibility is resolved by the grid. The operation
     * does not directly modify row data or CRUD state.
     *
     * @param {*} columnLookup - Column field or another supported column lookup.
     * @returns {void|false} `false` when no matching column is found.
     */
    toggleColumn(columnLookup) {
        return table.toggleColumn(columnLookup);
    },

    /**
     * Scrolls horizontally to a grid column.
     *
     * The optional position controls where the column is placed in the visible
     * area. The optional visibility flag controls whether scrolling also
     * occurs when the column is already fully visible.
     *
     * AMB-managed columns can be addressed explicitly. The operation changes
     * only the viewport and does not directly modify row data or CRUD state.
     *
     * @param {*} columnLookup - Column field or another supported column lookup.
     * @param {'left'|'center'|'right'} [position] - Requested viewport position.
     * @param {boolean} [scrollIfVisible] - Scroll even when the column is already visible.
     * @returns {Promise<void>} Original scrolling promise.
     */
    scrollToColumn(...args) {
        return table.scrollToColumn(...args);
    },

    /**
     * Moves a grid column relative to another column.
     *
     * Both columns can be identified with supported lookup values. The
     * relative position flag is forwarded unchanged. AMB-managed columns can
     * be moved when explicitly addressed.
     *
     * Reordering columns changes the runtime layout but does not directly
     * modify row data or CRUD state.
     *
     * @param {*} columnLookup - Column to move.
     * @param {*} targetLookup - Column used as the destination reference.
     * @param {boolean} after - Place the column after the target when `true`.
     * @returns {void}
     */
    moveColumn(...args) {
        return table.moveColumn(...args);
    }
});

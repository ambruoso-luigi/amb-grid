const showComponentPopup = (component, contents, position) => {
    if (!component || typeof component.popup !== 'function') return false;

    component.popup(contents, position);
    return true;
};

/**
 * Creates contextual popup methods exposed by the AMB Grid controller.
 *
 * @param {object} context - Required method dependencies.
 * @param {object} context.rowMethods - AMB-aware row and cell resolvers.
 * @param {object} context.columnMethods - Public column resolver.
 * @returns {object} Contextual popup methods for the flat controller API.
 * @private
 * @internal
 */
export const createPopupMethods = ({ rowMethods, columnMethods }) => ({
    /**
     * Opens a popup anchored to one managed Row Component.
     *
     * The identifier is resolved through the AMB-aware row API. `contents` and
     * `position` are forwarded without transformation to the runtime
     * component. The internal table engine handles rendering, positioning,
     * closing and popup events.
     *
     * HTML and DOM nodes are advanced contents: callers must provide trusted
     * or appropriately sanitized values when needed. This operation does not
     * modify row data or AMB Grid CRUD state. `true` means opening was
     * delegated; `false` means the row or popup operation is unavailable.
     *
     * @param {*} identifier - AMB Grid row identifier or supported row lookup.
     * @param {*} contents - Supported popup contents forwarded unchanged.
     * @param {*} [position] - Popup position forwarded unchanged.
     * @returns {boolean} `true` when delegated, otherwise `false`.
     */
    showRowPopup(identifier, contents, position) {
        return showComponentPopup(
            rowMethods.getRow(identifier),
            contents,
            position
        );
    },

    /**
     * Opens a popup anchored to one managed Column Component.
     *
     * The column is resolved through the normal public column lookup.
     * `contents` and `position` are forwarded without transformation to the
     * runtime component. The internal table engine handles rendering,
     * positioning, closing and popup events.
     *
     * HTML and DOM nodes are advanced contents: callers must provide trusted
     * or appropriately sanitized values when needed. This operation does not
     * modify data or AMB Grid CRUD state. `true` means opening was delegated;
     * `false` means the column or popup operation is unavailable.
     *
     * @param {*} columnLookup - Supported column lookup forwarded unchanged.
     * @param {*} contents - Supported popup contents forwarded unchanged.
     * @param {*} [position] - Popup position forwarded unchanged.
     * @returns {boolean} `true` when delegated, otherwise `false`.
     */
    showColumnPopup(columnLookup, contents, position) {
        return showComponentPopup(
            columnMethods.getColumn(columnLookup),
            contents,
            position
        );
    },

    /**
     * Opens a popup anchored to one managed Cell Component.
     *
     * The row and cell are resolved through the AMB-aware row API, with the
     * row identifier and column lookup forwarded unchanged. `contents` and
     * `position` are also forwarded without transformation. The internal table
     * engine handles rendering, positioning, closing and popup events.
     *
     * HTML and DOM nodes are advanced contents: callers must provide trusted
     * or appropriately sanitized values when needed. This operation does not
     * modify cell values, row data or AMB Grid CRUD state. `true` means opening
     * was delegated; `false` means the cell or popup operation is unavailable.
     *
     * @param {*} rowIdentifier - AMB Grid row identifier or supported row lookup.
     * @param {*} column - Column lookup forwarded unchanged.
     * @param {*} contents - Supported popup contents forwarded unchanged.
     * @param {*} [position] - Popup position forwarded unchanged.
     * @returns {boolean} `true` when delegated, otherwise `false`.
     */
    showCellPopup(rowIdentifier, column, contents, position) {
        return showComponentPopup(
            rowMethods.getRowCell(rowIdentifier, column),
            contents,
            position
        );
    },

    /**
     * Opens a popup anchored to a supplied Group Component.
     *
     * The advanced runtime Group Component is received directly, normally from
     * `grid.getGroups()`, `grid.getRowGroup(...)` or
     * `grid.getGroupSubGroups(...)`. `contents` and `position` are forwarded
     * without transformation. The internal table engine handles rendering,
     * positioning, closing and popup events.
     *
     * HTML and DOM nodes are advanced contents: callers must provide trusted
     * or appropriately sanitized values when needed. This operation does not
     * modify grouped data or AMB Grid CRUD state. `true` means opening was
     * delegated; `false` means the component or popup operation is unavailable.
     *
     * @param {object} group - Runtime Group Component obtained through AMB Grid APIs.
     * @param {*} contents - Supported popup contents forwarded unchanged.
     * @param {*} [position] - Popup position forwarded unchanged.
     * @returns {boolean} `true` when delegated, otherwise `false`.
     */
    showGroupPopup(group, contents, position) {
        return showComponentPopup(group, contents, position);
    }
});

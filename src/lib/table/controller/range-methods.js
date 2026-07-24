const readRange = (range, methodName) => {
    if (!range) return false;

    const method = range[methodName];
    if (typeof method !== 'function') return false;

    return method.call(range);
};

const runRangeAction = (range, methodName, args = []) => {
    if (!range) return false;

    const method = range[methodName];
    if (typeof method !== 'function') return false;

    method.apply(range, args);
    return true;
};

/**
 * Creates the cell-range methods exposed by the AMB Grid controller.
 *
 * @param {object} context - Required method dependencies.
 * @param {object} context.table - Grid table instance.
 * @returns {object} Cell-range methods for the flat controller API.
 * @private
 * @internal
 */
export const createRangeMethods = ({ table }) => ({
    /**
     * Adds a selected cell range between two cell components.
     *
     * The supplied cells define the top-left and bottom-right bounds of the new
     * range. The grid manages the active range, visual selection, configured
     * range limits and optional focus behavior.
     *
     * The returned Range Component exposes advanced runtime operations. Adding a
     * range is separate from row selection and does not directly modify row data
     * or AMB Grid CRUD state.
     *
     * @param {object} topLeftCell - Cell component at the top-left range bound.
     * @param {object} bottomRightCell - Cell component at the bottom-right range bound.
     * @returns {object} Newly created Range Component.
     */
    addRange(...args) {
        return table.addRange(...args);
    },

    /**
     * Returns the currently selected cell-range components.
     *
     * Cell ranges are separate from AMB Grid row selection. The returned array
     * and range components retain their runtime identities and should be
     * treated carefully because component operations can modify the active
     * selection.
     *
     * The result is meaningful when cell-range selection is enabled in the grid
     * configuration.
     *
     * @returns {object[]} Current cell-range components.
     */
    getRanges() {
        return table.getRanges();
    },

    /**
     * Returns the data currently contained in the selected cell ranges.
     *
     * The outer array contains one entry for each selected range. Each range
     * entry contains row-shaped objects with only the fields included in that
     * range.
     *
     * This result is separate from AMB Grid row selection, CRUD state and save
     * payload generation.
     *
     * @returns {Array<object[]>} Data grouped by selected cell range.
     */
    getRangesData() {
        return table.getRangesData();
    },

    /**
     * Returns the runtime DOM element of one selected range.
     *
     * `range` must be a Range Component obtained through AMB Grid, for example
     * from `addRange()` or `getRanges()`. The element is returned without a copy;
     * modifying it directly can bypass normal AMB Grid workflows.
     *
     * @param {object} range - Range Component obtained through AMB Grid.
     * @returns {Element|false} Runtime DOM element, or `false` when the component or operation is unavailable.
     */
    getRangeElement(range) {
        return readRange(range, 'getElement');
    },

    /**
     * Returns the runtime data contained in one selected range.
     *
     * `range` must be a Range Component obtained through AMB Grid. The engine's
     * data structure and references are returned without copies or
     * normalization. This is runtime range data, not an AMB Grid CRUD payload;
     * modifying it directly can bypass normal AMB Grid workflows.
     *
     * @param {object} range - Range Component obtained through AMB Grid.
     * @returns {*|false} Runtime range data, or `false` when the component or operation is unavailable.
     */
    getRangeData(range) {
        return readRange(range, 'getData');
    },

    /**
     * Returns the runtime Cell Components contained in one selected range.
     *
     * `range` must be a Range Component obtained through AMB Grid. The engine's
     * structure, order and references are returned without copies. Modifying
     * returned components directly can bypass normal AMB Grid workflows.
     *
     * @param {object} range - Range Component obtained through AMB Grid.
     * @returns {*|false} Runtime Cell Component structure, or `false` when the component or operation is unavailable.
     */
    getRangeCells(range) {
        return readRange(range, 'getCells');
    },

    /**
     * Returns the runtime structured Cell Components of one selected range.
     *
     * `range` must be a Range Component obtained through AMB Grid. The result of
     * the component's structured read is returned by identity, without copies
     * or AMB transformations. Modifying returned components directly can bypass
     * normal AMB Grid workflows.
     *
     * @param {object} range - Range Component obtained through AMB Grid.
     * @returns {*|false} Runtime structured Cell Component result, or `false` when the component or operation is unavailable.
     */
    getRangeStructuredCells(range) {
        return readRange(range, 'getStructuredCells');
    },

    /**
     * Returns the runtime Row Components contained in one selected range.
     *
     * `range` must be a Range Component obtained through AMB Grid. The array,
     * component references and runtime order are returned without copies,
     * including an empty array. Modifying them directly can bypass normal AMB
     * Grid workflows.
     *
     * @param {object} range - Range Component obtained through AMB Grid.
     * @returns {object[]|false} Runtime Row Components, or `false` when the component or operation is unavailable.
     */
    getRangeRows(range) {
        return readRange(range, 'getRows');
    },

    /**
     * Returns the runtime Column Components contained in one selected range.
     *
     * `range` must be a Range Component obtained through AMB Grid. The array,
     * component references and runtime order are returned without copies,
     * including an empty array. Modifying them directly can bypass normal AMB
     * Grid workflows.
     *
     * @param {object} range - Range Component obtained through AMB Grid.
     * @returns {object[]|false} Runtime Column Components, or `false` when the component or operation is unavailable.
     */
    getRangeColumns(range) {
        return readRange(range, 'getColumns');
    },

    /**
     * Returns the runtime bounds structure of one selected range.
     *
     * `range` must be a Range Component obtained through AMB Grid. The exact
     * structure and references produced by the installed engine are returned
     * without normalization or copies. Modifying returned components directly
     * can bypass normal AMB Grid workflows.
     *
     * @param {object} range - Range Component obtained through AMB Grid.
     * @returns {object|false} Runtime bounds structure, or `false` when the component or operation is unavailable.
     */
    getRangeBounds(range) {
        return readRange(range, 'getBounds');
    },

    /**
     * Returns the runtime top edge value of one selected range.
     *
     * `range` must be a Range Component obtained through AMB Grid. The value is
     * returned unchanged, including `0`; it is an edge value, not a component.
     * Direct use of returned runtime state can bypass normal AMB Grid workflows.
     *
     * @param {object} range - Range Component obtained through AMB Grid.
     * @returns {number|false} Runtime top edge, or `false` when the component or operation is unavailable.
     */
    getRangeTopEdge(range) {
        return readRange(range, 'getTopEdge');
    },

    /**
     * Returns the runtime bottom edge value of one selected range.
     *
     * `range` must be a Range Component obtained through AMB Grid. The value is
     * returned unchanged, including `0`; it is an edge value, not a component.
     * Direct use of returned runtime state can bypass normal AMB Grid workflows.
     *
     * @param {object} range - Range Component obtained through AMB Grid.
     * @returns {number|false} Runtime bottom edge, or `false` when the component or operation is unavailable.
     */
    getRangeBottomEdge(range) {
        return readRange(range, 'getBottomEdge');
    },

    /**
     * Returns the runtime left edge value of one selected range.
     *
     * `range` must be a Range Component obtained through AMB Grid. The value is
     * returned unchanged, including `0`; it is an edge value, not a component.
     * Direct use of returned runtime state can bypass normal AMB Grid workflows.
     *
     * @param {object} range - Range Component obtained through AMB Grid.
     * @returns {number|false} Runtime left edge, or `false` when the component or operation is unavailable.
     */
    getRangeLeftEdge(range) {
        return readRange(range, 'getLeftEdge');
    },

    /**
     * Returns the runtime right edge value of one selected range.
     *
     * `range` must be a Range Component obtained through AMB Grid. The value is
     * returned unchanged, including `0`; it is an edge value, not a component.
     * Direct use of returned runtime state can bypass normal AMB Grid workflows.
     *
     * @param {object} range - Range Component obtained through AMB Grid.
     * @returns {number|false} Runtime right edge, or `false` when the component or operation is unavailable.
     */
    getRangeRightEdge(range) {
        return readRange(range, 'getRightEdge');
    },

    /**
     * Updates both runtime bounds of one selected range.
     *
     * `range` must be a Range Component obtained through AMB Grid. `start` and
     * `end` are forwarded unchanged to the internal engine. This operation
     * modifies only the runtime range selection; row data and AMB Grid CRUD
     * state are not modified.
     *
     * @param {object} range - Range Component obtained through AMB Grid.
     * @param {*} start - Runtime start bound supported by the internal engine.
     * @param {*} end - Runtime end bound supported by the internal engine.
     * @returns {boolean} `true` when the operation was delegated; `false` when the component or operation is unavailable.
     */
    setRangeBounds(range, start, end) {
        return runRangeAction(range, 'setBounds', [start, end]);
    },

    /**
     * Updates the runtime end bound of one selected range.
     *
     * `range` must be a Range Component obtained through AMB Grid. `end` is
     * forwarded unchanged to the internal engine. This operation modifies only
     * the runtime range selection; row data and AMB Grid CRUD state are not
     * modified.
     *
     * @param {object} range - Range Component obtained through AMB Grid.
     * @param {*} end - Runtime end bound supported by the internal engine.
     * @returns {boolean} `true` when the operation was delegated; `false` when the component or operation is unavailable.
     */
    setRangeEndBound(range, end) {
        return runRangeAction(range, 'setEndBound', [end]);
    },

    /**
     * Removes one selected range from the runtime selection.
     *
     * `range` must be a Range Component obtained through AMB Grid. The operation
     * removes only the selected runtime interval; it does not remove rows or
     * data and does not modify AMB Grid CRUD state.
     *
     * @param {object} range - Range Component obtained through AMB Grid.
     * @returns {boolean} `true` when the operation was delegated; `false` when the component or operation is unavailable.
     */
    removeRange(range) {
        return runRangeAction(range, 'remove');
    }
});

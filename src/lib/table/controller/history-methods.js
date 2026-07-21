/**
 * Creates the interaction-history methods exposed by the AMB Grid controller.
 *
 * @param {object} context - Required method dependencies.
 * @param {object} context.table - Grid table instance.
 * @returns {object} Interaction-history methods for the flat controller API.
 * @private
 * @internal
 */
export const createHistoryMethods = ({ table }) => ({
    /**
     * Clears the interaction history maintained by the internal table engine.
     *
     * This removes the actions available through the native undo and redo
     * history, but does not revert row data, clear validation errors or reset
     * AMB Grid CRUD state. Use `rollbackRow()` when an AMB-managed row must be
     * restored through the CRUD workflow.
     *
     * @returns {void}
     */
    clearHistory() {
        return table.clearHistory();
    },

    /**
     * Returns the number of interaction-history actions currently available
     * for undo.
     *
     * This is a read-only runtime count. It does not execute an undo operation
     * or modify row data and AMB Grid CRUD state.
     *
     * The count is meaningful when interaction history is enabled in the grid
     * configuration.
     *
     * @returns {number} Number of actions currently available for undo.
     */
    getHistoryUndoSize() {
        return table.getHistoryUndoSize();
    },

    /**
     * Returns the number of interaction-history actions currently available
     * for redo.
     *
     * This is a read-only runtime count. It does not execute a redo operation
     * or modify row data and AMB Grid CRUD state.
     *
     * The count is meaningful when interaction history is enabled in the grid
     * configuration.
     *
     * @returns {number} Number of actions currently available for redo.
     */
    getHistoryRedoSize() {
        return table.getHistoryRedoSize();
    }
});

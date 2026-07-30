/**
 * Creates the interaction-history methods exposed by the AMB Grid controller.
 *
 * @param {object} context - Required method dependencies.
 * @param {object} context.table - Grid table instance.
 * @param {object} context.crud - AMB Grid CRUD layer.
 * @param {object} context.historyRuntime - Internal history coordinator.
 * @param {boolean} context.historyEnabled - Whether interaction history is enabled.
 * @returns {object} Interaction-history methods for the flat controller API.
 * @private
 * @internal
 */
export const createHistoryMethods = ({
    table,
    crud,
    historyRuntime,
    historyEnabled
}) => {
    const runHistoryAction = direction => {
        const countMethod = direction === 'undo'
            ? table && table.getHistoryUndoSize
            : table && table.getHistoryRedoSize;

        if (
            historyEnabled !== true
            || !table
            || typeof table[direction] !== 'function'
            || typeof countMethod !== 'function'
            || !crud
            || crud.isDestroyed === true
            || !historyRuntime
            || typeof historyRuntime.perform !== 'function'
            || typeof historyRuntime.isAvailable !== 'function'
            || !historyRuntime.isAvailable()
        ) {
            return false;
        }

        return historyRuntime.perform(direction);
    };

    return {
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
    },

    /**
     * Undoes one interaction-history action and reconciles its affected AMB
     * Grid validation and CRUD tracking.
     *
     * Interaction history must be enabled. The result is asynchronous because
     * AMB Grid waits for the runtime event and reconciles the affected cell or
     * row before resolving. The Promise resolves `true` after both phases
     * complete, or `false` when no undo action is available. The CRUD baseline
     * is not replaced.
     *
     * Cell validation is recalculated only for the affected data, while manual
     * row errors are not historical state. A reconciliation failure does not
     * roll back an action already applied by the runtime. Advanced direct
     * engine access can create actions that the normal CRUD lifecycle cannot
     * represent.
     *
     * @returns {Promise<boolean>|false} Coordinated undo result, or `false` when unavailable.
     */
    undo() {
        return runHistoryAction('undo');
    },

    /**
     * Redoes one interaction-history action and reconciles its affected AMB
     * Grid validation and CRUD tracking.
     *
     * Interaction history must be enabled. The result is asynchronous because
     * AMB Grid waits for the runtime event and reconciles the affected cell or
     * row before resolving. The Promise resolves `true` after both phases
     * complete, or `false` when no redo action is available. The CRUD baseline
     * is not replaced.
     *
     * Cell validation is recalculated only for the affected data, while manual
     * row errors are not historical state. A reconciliation failure does not
     * roll back an action already applied by the runtime. Advanced direct
     * engine access can create actions that the normal CRUD lifecycle cannot
     * represent.
     *
     * @returns {Promise<boolean>|false} Coordinated redo result, or `false` when unavailable.
     */
    redo() {
        return runHistoryAction('redo');
    }
    };
};

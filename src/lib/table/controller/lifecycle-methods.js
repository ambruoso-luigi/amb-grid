/**
 * Creates lifecycle methods for the AMB Grid controller.
 *
 * @param {object} context - Owned lifecycle dependencies.
 * @param {object} context.table - Internal table engine.
 * @param {object} context.crud - AMB Grid CRUD layer.
 * @param {object} context.resources - Mutable owned AMB Grid resources.
 * @param {Function} context.getController - Returns the public AMB Grid controller.
 * @param {object} context.cellMessageBinder - Managed cell-message binder.
 * @param {object} context.floatingMessage - Managed floating-message region.
 * @param {object} context.confirmDialog - Managed confirmation dialog.
 * @returns {object} Lifecycle methods for the flat controller API.
 * @private
 * @internal
 */
export const createLifecycleMethods = ({
    table,
    crud,
    resources,
    getController,
    cellMessageBinder,
    floatingMessage,
    confirmDialog
}) => ({
    /**
     * Releases the complete AMB Grid controller.
     *
     * Lifecycle cleanup destroys owned AMB Grid resources first: history
     * coordination, toolbar, column and binder subscriptions, search,
     * feedback, cell messages, floating messages and dialogs. History
     * listeners and pending waits are released before CRUD event bindings are
     * disconnected, and the internal table engine is destroyed last.
     *
     * The controller should not normally be reused after destruction.
     *
     * @returns {void}
     */
    destroy() {
        const controller = getController();

        if (resources.historyRuntime) {
            resources.historyRuntime.destroy();
            resources.historyRuntime = null;
        }

        if (resources.toolbarController) {
            resources.toolbarController.destroy();
            resources.toolbarController = null;
            controller.toolbar = null;
        }

        if (resources.unsubscribeDeleteColumn) {
            resources.unsubscribeDeleteColumn();
            resources.unsubscribeDeleteColumn = null;
        }

        if (resources.unsubscribeCalculationRecalc) {
            resources.unsubscribeCalculationRecalc();
            resources.unsubscribeCalculationRecalc = null;
        }

        if (resources.unsubscribeSelectionColumn) {
            resources.unsubscribeSelectionColumn();
            resources.unsubscribeSelectionColumn = null;
        }

        if (resources.unsubscribeLookupDescriptions) {
            resources.unsubscribeLookupDescriptions();
            resources.unsubscribeLookupDescriptions = null;
        }

        if (resources.unsubscribeLookupMetadata) {
            resources.unsubscribeLookupMetadata();
            resources.unsubscribeLookupMetadata = null;
        }

        if (resources.unsubscribeLargeText) {
            resources.unsubscribeLargeText();
            resources.unsubscribeLargeText = null;
        }

        if (resources.searchController) {
            resources.searchController.destroy();
            resources.searchController = null;
        }

        if (resources.feedback) {
            resources.feedback.destroy();
            resources.feedback = null;
            controller.feedback = null;
        }

        cellMessageBinder.destroy();
        floatingMessage.destroy();
        confirmDialog.destroy();
        crud.destroy();

        if (typeof table.destroy === 'function') {
            table.destroy();
        }
    }
});

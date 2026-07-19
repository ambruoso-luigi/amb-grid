/**
 * Creates the table-alert methods exposed by the AMB Grid controller.
 *
 * @param {object} context - Required method dependencies.
 * @param {object} context.table - Grid table instance.
 * @returns {object} Alert methods for the flat controller API.
 * @private
 * @internal
 */
export const createAlertMethods = ({ table }) => ({
    /**
     * Shows a modal alert over the grid.
     *
     * The content can be a string, HTML content or a DOM node according to the
     * current grid alert configuration. An optional style value controls the
     * alert presentation and is forwarded unchanged.
     *
     * Table alerts are separate from AMB Grid cell floating messages,
     * accessible feedback, confirmation dialogs and validation messages.
     *
     * @param {*} content - Alert text, HTML content or DOM node.
     * @param {string} [style] - Optional alert style name.
     * @returns {void}
     */
    alert(...args) {
        return table.alert(...args);
    },

    /**
     * Clears the current modal grid alert.
     *
     * This operation affects only the table alert overlay. It does not clear
     * AMB Grid floating messages, accessible feedback, confirmation dialogs or
     * cell validation errors.
     *
     * @returns {void}
     */
    clearAlert() {
        return table.clearAlert();
    }
});

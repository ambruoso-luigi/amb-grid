/**
 * Creates the localization methods exposed by the AMB Grid controller.
 *
 * @param {object} context - Required method dependencies.
 * @param {object} context.table - Grid table instance.
 * @returns {object} Localization methods for the flat controller API.
 * @private
 * @internal
 */
export const createLocalizationMethods = ({ table }) => ({
    /**
     * Changes the locale used by the grid.
     *
     * The requested locale is resolved against the current `langs`
     * configuration and the grid's built-in localization fallback behavior.
     *
     * This method updates localized table content only. AMB Grid validation,
     * toolbar, confirmation and floating-message texts remain controlled by
     * their dedicated configuration.
     *
     * @param {string|boolean} locale - Locale code, default locale request or automatic detection flag.
     * @returns {void}
     */
    setLocale(...args) {
        return table.setLocale(...args);
    },

    /**
     * Returns the locale currently used by the grid.
     *
     * The result represents the resolved runtime locale and can differ from
     * the original locale option when fallback or automatic detection is used.
     *
     * @returns {string} Current resolved locale code.
     */
    getLocale() {
        return table.getLocale();
    },

    /**
     * Returns the current runtime language object.
     *
     * The object contains the localized values resolved for the active locale,
     * including custom properties supplied through the `langs` configuration.
     * The returned object retains its runtime identity and should be treated
     * as read-only.
     *
     * @returns {object} Current runtime language definition.
     */
    getLang() {
        return table.getLang();
    }
});

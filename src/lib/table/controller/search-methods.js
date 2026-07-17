/**
 * Creates the global-search methods exposed by the AMB Grid controller.
 *
 * @param {object} context - Required method dependencies.
 * @param {object|null} context.searchController - Optional global-search controller.
 * @returns {object} Search methods for the flat controller API.
 * @private
 * @internal
 */
export const createSearchMethods = ({ searchController }) => ({
    /**
     * Sets the AMB Grid global search query.
     *
     * The configured search fields and options are reused. Applying a query may
     * change which rows are active or visible, but it does not directly modify
     * row data or CRUD state.
     *
     * @param {*} query - Search value.
     * @returns {boolean} `true` when search is available, otherwise `false`.
     */
    setSearchQuery(query) {
        if (!searchController) return false;

        searchController.setSearchQuery(query);
        return true;
    },

    /**
     * Clears the AMB Grid global search query.
     *
     * Header filters and developer-managed programmatic filters remain separate.
     * Clearing search may change which rows are active or visible, but it does
     * not directly modify row data or CRUD state.
     *
     * @returns {boolean} `true` when search is available, otherwise `false`.
     */
    clearSearch() {
        if (!searchController) return false;

        searchController.clearSearch();
        return true;
    },

    /**
     * Returns the AMB Grid global search state.
     *
     * The returned state contains the current `query`, `selectedFields`,
     * `caseSensitive`, and `wholeWord` values. When global search is not
     * configured, a new empty state object with a new `selectedFields` array is
     * returned.
     *
     * @returns {object} Current global search state.
     */
    getSearchState() {
        if (!searchController) {
            return {
                query: '',
                selectedFields: [],
                caseSensitive: false,
                wholeWord: false
            };
        }

        return searchController.getSearchState();
    },

    /**
     * Sets the fields used by AMB Grid global search.
     *
     * Field validation and normalization are handled by the configured search
     * system. Updating the fields may immediately change which rows are active
     * or visible.
     *
     * @param {string[]} fields - Field names to search.
     * @returns {boolean} `true` when search is available, otherwise `false`.
     */
    setSearchFields(fields) {
        if (!searchController) return false;

        searchController.setSearchFields(fields);
        return true;
    },

    /**
     * Sets AMB Grid global search options.
     *
     * Supported options include `caseSensitive` and `wholeWord`. Updating these
     * options may immediately change which rows are active or visible.
     *
     * @param {object} options - Search options.
     * @param {boolean} [options.caseSensitive] - Match letter case.
     * @param {boolean} [options.wholeWord] - Match whole words.
     * @returns {boolean} `true` when search is available, otherwise `false`.
     */
    setSearchOptions(options) {
        if (!searchController) return false;

        searchController.setSearchOptions(options);
        return true;
    }
});
